import logging
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(
        "HTTPException %s em %s %s: %s",
        exc.status_code,
        request.method,
        request.url.path,
        exc.detail
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )


async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(
        "Erro inesperado em %s %s: %s",
        request.method,
        request.url.path,
        exc,
        exc_info=True
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "Erro interno do servidor",
            "status_code": 500
        }
    )
