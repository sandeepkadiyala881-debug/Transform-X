"""API v1: aggregates all endpoint routers under one prefix."""

from fastapi import APIRouter

from app.api.v1 import health, outputs, sources, transformations

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(sources.router)
api_router.include_router(transformations.router)
api_router.include_router(outputs.router)
