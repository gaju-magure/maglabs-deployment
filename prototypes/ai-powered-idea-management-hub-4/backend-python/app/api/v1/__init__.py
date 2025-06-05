# This file makes 'v1' a Python sub-package for API version 1.

from fastapi import APIRouter

# Import individual route modules here
from . import categorize
from . import evaluate
from . import ideas
# from . import auth # If you have auth-specific routes like login, refresh_token

api_router_v1 = APIRouter()

# Include routers from the modules
api_router_v1.include_router(categorize.router, prefix="/categorize", tags=["AI Categorization"])
api_router_v1.include_router(evaluate.router, prefix="/evaluate", tags=["AI Evaluation"])
api_router_v1.include_router(ideas.router, prefix="/ideas", tags=["Ideas Management"])
# api_router_v1.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# A health check endpoint for v1
@api_router_v1.get("/health", status_code=200)
async def health_check():
    return {"status": "ok", "version": "v1"}
