import logging
import sys
from logging.handlers import RotatingFileHandler

logger = logging.getLogger("fastapi_app")
logger.setLevel(logging.INFO)
logger.propagate = True

formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")

if not logger.handlers:
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    file_handler = RotatingFileHandler(
        "app.log",
        maxBytes=5 * 1024 * 1024,  # 5MB
        backupCount=5,
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

# also propagate to uvicorn loggers
logging.getLogger("uvicorn").handlers.extend(logger.handlers)
logging.getLogger("uvicorn.error").handlers.extend(logger.handlers)
logging.getLogger("uvicorn.access").handlers.extend(logger.handlers)
