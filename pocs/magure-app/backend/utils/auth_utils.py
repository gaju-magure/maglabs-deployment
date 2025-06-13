"""
Authentication utilities for extracting and handling JWT tokens.
"""
import logging

logger = logging.getLogger(__name__)


def get_jwt_token_from_request(request):
    """
    Extract JWT token from Django request Authorization header.
    
    Args:
        request: Django request object
        
    Returns:
        str: JWT token string without 'Bearer ' prefix, or None if not found
    """
    if not request:
        return None
        
    # Get Authorization header from request META
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    
    if not auth_header:
        logger.debug("No Authorization header found in request")
        return None
    
    # Check if header starts with 'Bearer '
    if not auth_header.startswith('Bearer '):
        logger.debug(f"Authorization header does not start with 'Bearer ': {auth_header[:20]}...")
        return None
    
    try:
        # Extract token part after 'Bearer '
        token = auth_header.split(' ')[1]
        logger.debug("Successfully extracted JWT token from request")
        return token
    except IndexError:
        logger.warning("Malformed Authorization header: missing token after 'Bearer'")
        return None


def create_auth_header(token):
    """
    Create Authorization header value from JWT token.
    
    Args:
        token (str): JWT token string
        
    Returns:
        str: Authorization header value in format 'Bearer <token>'
    """
    if not token:
        return None
    return f'Bearer {token}'


def is_valid_jwt_format(token):
    """
    Basic validation to check if token has JWT format (3 parts separated by dots).
    
    Args:
        token (str): Token to validate
        
    Returns:
        bool: True if token appears to be JWT format, False otherwise
    """
    if not token or not isinstance(token, str):
        return False
    
    parts = token.split('.')
    return len(parts) == 3 and all(part for part in parts)