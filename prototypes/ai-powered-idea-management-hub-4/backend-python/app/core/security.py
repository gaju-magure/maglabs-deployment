import logging
from typing import Any, Dict, List, Optional

import jwt # PyJWT library
from fastapi import Depends, HTTPException, Security
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from jwt import PyJWKClient
from pydantic import ValidationError
from starlette.status import HTTP_401_UNAUTHORIZED, HTTP_403_FORBIDDEN

from app.core.config import settings
from app.core.supabase_client import get_supabase_async_client
from app.models.domain import AuthenticatedUser, TokenPayload, UserRoleEnum

logger = logging.getLogger(__name__)

# This is a common scheme, but Supabase uses Authorization: Bearer <JWT> directly.
# We'll use a simpler bearer token scheme for Supabase.
# oauth2_scheme = OAuth2PasswordBearer(
#     tokenUrl=f"{settings.API_V1_STR}/auth/token", # Example token URL
#     scopes={"read": "Read access", "write": "Write access"} # Define scopes if using OAuth2 scopes
# )

# For Supabase, the token is typically passed in the Authorization header as a Bearer token.
# We can use a custom scheme or rely on FastAPI's built-in Security.
# For simplicity, we'll extract it directly in the dependency.

# Supabase JWKS (JSON Web Key Set) URL
# This URL is specific to your Supabase project.
# It's usually: https://<your-project-ref>.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_JWKS_URL = f"{str(settings.SUPABASE_URL).rstrip('/')}/auth/v1/.well-known/jwks.json"
jwks_client = PyJWKClient(SUPABASE_JWKS_URL)


async def get_current_user(
    # security_scopes: SecurityScopes, # If using OAuth2 scopes
    token: str = Security(OAuth2PasswordBearer(tokenUrl="token", auto_error=False)) # auto_error=False to handle missing token manually
) -> AuthenticatedUser:
    """
    Dependency to get the current authenticated user from a Supabase JWT.
    Verifies the JWT using Supabase's JWKS.
    """
    if token is None:
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        # Decode the token. 'audience' should match your Supabase project's audience (usually 'authenticated').
        # 'issuer' should match your Supabase project's issuer URL.
        payload_dict = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"], # Supabase typically uses RS256
            audience="authenticated", # Default Supabase audience
            issuer=f"{str(settings.SUPABASE_URL).rstrip('/')}/auth/v1", # Default Supabase issuer
            options={"verify_exp": True} # Ensure token is not expired
        )
        
        # Extract user information from the payload
        # Supabase JWT payload typically includes:
        # sub (user_id), email, role (if custom claim), app_metadata.roles (if using Supabase roles)
        user_id = payload_dict.get("sub")
        email = payload_dict.get("email")
        
        # Handle roles: Supabase might store roles in 'app_metadata' or a custom 'role' claim.
        # Adjust this based on your Supabase JWT structure.
        raw_roles = payload_dict.get("app_metadata", {}).get("roles", [])
        if not raw_roles and "role" in payload_dict: # Check for a singular 'role' claim
            raw_roles = [payload_dict["role"]]

        # Convert roles to UserRoleEnum, filtering out invalid ones
        user_roles: List[UserRoleEnum] = []
        for r_str in raw_roles:
            try:
                user_roles.append(UserRoleEnum(r_str))
            except ValueError:
                logger.warning(f"Invalid role '{r_str}' found in JWT for user {email}. Ignoring.")

        if not user_id or not email:
            logger.error(f"JWT missing 'sub' or 'email' claim: {payload_dict}")
            raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Invalid token claims.")

        # Create TokenPayload for JWT info
        token_payload = TokenPayload(sub=user_id, email=email, roles=user_roles, exp=payload_dict.get("exp"))
        
        # Fetch user profile from our users table to get accurate role and profile info
        try:
            db = await get_supabase_async_client()
            user_response = await db.table("users").select("*").eq("auth_user_id", user_id).single().execute()
            
            if user_response.data:
                user_data = user_response.data
                # Extract roles from database (more authoritative than JWT)
                db_roles = user_data.get("roles", [])
                if db_roles and isinstance(db_roles, list):
                    try:
                        primary_role = UserRoleEnum(db_roles[0])
                    except (ValueError, IndexError):
                        primary_role = UserRoleEnum.CONTRIBUTOR
                else:
                    primary_role = UserRoleEnum.CONTRIBUTOR
                
                # Create AuthenticatedUser with database profile info
                current_user = AuthenticatedUser(
                    id=str(user_data["id"]), # Our internal user ID (not auth_user_id)
                    email=user_data["email"],
                    role=primary_role,
                    organisation_id=user_data.get("organisation_id")
                )
            else:
                # User not found in our users table - this shouldn't happen with triggers
                logger.error(f"User {user_id} authenticated but not found in users table")
                raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="User profile not found.")
                
        except Exception as db_error:
            logger.error(f"Failed to fetch user profile for {user_id}: {db_error}")
            # Fallback to JWT data if database lookup fails
            primary_role = user_roles[0] if user_roles else UserRoleEnum.CONTRIBUTOR
            current_user = AuthenticatedUser(
                id=user_id,
                email=email,
                role=primary_role
            )

    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired.")
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError as e: # Catch other JWT errors
        logger.error(f"JWT validation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except ValidationError as e:
        logger.error(f"Pydantic validation error for token payload: {e}", exc_info=True)
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail="Invalid token payload structure.",
        )
    
    # Optional: Check security scopes if using them
    # if security_scopes.scopes:
    #     # Example: Check if user has all required scopes
    #     # This requires roles/permissions to be mapped to scopes in your JWT or user data
    #     # For now, we assume role-based access is handled separately.
    #     pass

    return current_user


# --- Role-based access control dependencies ---

def require_role(required_role: UserRoleEnum):
    """
    Dependency factory to require a specific user role.
    """
    async def role_checker(current_user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        # This simple check assumes AuthenticatedUser.role is the primary role.
        # If current_user.roles is a list, you'd check `if required_role not in current_user.roles:`
        # For now, assuming `current_user.role` holds the relevant role from JWT.
        
        # To make this work with the current AuthenticatedUser model, we need to ensure
        # that the `role` field in AuthenticatedUser is correctly populated from the JWT's roles list.
        # Let's assume the JWT parsing in `get_current_user` populates `current_user.role`
        # with the user's effective role for the application, or we check against a list of roles.

        # If `get_current_user` populates `TokenPayload.roles` and `AuthenticatedUser.role` is primary:
        if current_user.role != required_role:
            # A more robust check if `TokenPayload.roles` (a list) was directly on `AuthenticatedUser`
            # jwt_roles = current_user.jwt_payload.roles # Assuming jwt_payload is stored
            # if required_role.value not in [r.value for r in jwt_roles if jwt_roles]:
            logger.warning(
                f"User {current_user.email} with role {current_user.role} "
                f"attempted action requiring role {required_role.value}."
            )
            raise HTTPException(
                status_code=HTTP_403_FORBIDDEN,
                detail=f"User does not have the required role: {required_role.value}",
            )
        return current_user
    return role_checker

# Pre-defined dependencies for common roles
require_contributor = require_role(UserRoleEnum.CONTRIBUTOR)
require_evaluator = require_role(UserRoleEnum.EVALUATOR)
require_admin = require_role(UserRoleEnum.ADMIN)


# Example of requiring multiple roles (any of)
def require_any_role(required_roles: List[UserRoleEnum]):
    """
    Dependency factory to require at least one of the specified user roles.
    """
    async def any_role_checker(current_user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        # Assuming current_user.role is the primary role from JWT
        if current_user.role not in required_roles:
            # If current_user had a list of roles:
            # user_actual_roles = [UserRoleEnum(r) for r in current_user.jwt_payload.roles] # Example
            # if not any(role in user_actual_roles for role in required_roles):
            logger.warning(
                f"User {current_user.email} with role {current_user.role} "
                f"attempted action requiring one of roles: {[r.value for r in required_roles]}."
            )
            raise HTTPException(
                status_code=HTTP_403_FORBIDDEN,
                detail=f"User does not have any of the required roles: {[r.value for r in required_roles]}",
            )
        return current_user
    return any_role_checker

# --- Utility for creating access tokens (if backend handles token generation, e.g., for service accounts) ---
# This is typically NOT needed if Supabase handles all user authentication and token issuance.
# from datetime import datetime, timedelta, timezone
# ALGORITHM = "HS256" # Or RS256 if using asymmetric keys
# ACCESS_TOKEN_EXPIRE_MINUTES = 30

# def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
#     to_encode = data.copy()
#     if expires_delta:
#         expire = datetime.now(timezone.utc) + expires_delta
#     else:
#         expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
#     to_encode.update({"exp": expire})
#     # Ensure settings.SUPABASE_JWT_SECRET is appropriate for HS256 or it's a private key for RS256
#     encoded_jwt = jwt.encode(to_encode, settings.SUPABASE_JWT_SECRET, algorithm=ALGORITHM)
#     return encoded_jwt
