import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import api_router_v1
from app.core.config import settings
from app.core.supabase_client import close_supabase_async_client, get_supabase_async_client

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json", # Standardize OpenAPI path
    docs_url="/docs", # Swagger UI
    redoc_url="/redoc", # ReDoc
)

# --- Event Handlers ---
@app.on_event("startup")
async def startup_event():
    logger.info("Starting up FastAPI application...")
    # Initialize Supabase client (or other resources)
    try:
        await get_supabase_async_client() # Initialize on startup
        logger.info("Supabase client connection established (or verified).")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client during startup: {e}", exc_info=True)
        # Depending on severity, you might want to prevent app startup or run in a degraded mode.

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down FastAPI application...")
    await close_supabase_async_client()
    logger.info("Supabase client connection closed.")


# --- CORS Middleware ---
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"], # Allows all methods
        allow_headers=["*"], # Allows all headers
    )
else:
    # Default permissive CORS for local development if no origins are specified
    logger.warning(
        "No BACKEND_CORS_ORIGINS specified. Allowing all origins for local development."
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# --- Exception Handlers ---
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error(f"HTTPException: {exc.status_code} {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "headers": exc.headers},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"RequestValidationError: {exc.errors()}")
    # You can customize the error response format here
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation Error", "errors": exc.errors()},
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred on the server."},
    )


# --- API Routers ---
# Include the v1 API router
app.include_router(api_router_v1, prefix=settings.API_V1_STR)

# Root health check
@app.get("/", status_code=200, tags=["Health Check"])
async def root_health_check():
    """
    Root health check for the application.
    """
    return {
        "status": "ok",
        "message": f"{settings.PROJECT_NAME} is running!",
        "version": settings.PROJECT_VERSION,
        "environment": settings.APP_ENV.value,
    }

# Example of how to run with uvicorn if this file is executed directly:
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(
#         "app.main:app",
#         host=settings.HOST,
#         port=settings.PORT,
#         reload=(settings.APP_ENV == "development"),
#         log_level=settings.LOG_LEVEL.lower()
#     )
