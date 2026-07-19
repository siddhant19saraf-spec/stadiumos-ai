import logging
import sys
from pathlib import Path

from app.core.config import settings


def setup_logging() -> None:
    log_format = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    logging.basicConfig(
        level=getattr(logging, settings.log_level.value),
        format=log_format,
        datefmt=date_format,
        handlers=[
            logging.StreamHandler(sys.stdout),
        ],
    )

    # Quiet noisy libraries
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)

    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)

    file_handler = logging.FileHandler(logs_dir / "stadiumos.log")
    file_handler.setFormatter(logging.Formatter(log_format, date_format))
    logging.getLogger().addHandler(file_handler)
