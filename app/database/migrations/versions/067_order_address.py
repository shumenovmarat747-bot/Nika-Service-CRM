"""Миграция 067: адрес выезда/приёма хранится в заявке."""
from __future__ import annotations

import logging

from app.database.connection import get_db_connection

logger = logging.getLogger(__name__)


def up():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(orders)")
        columns = {row[1] for row in cursor.fetchall()}
        if "address" not in columns:
            cursor.execute("ALTER TABLE orders ADD COLUMN address TEXT")
        conn.commit()
    logger.info("067_order_address: OK")


def down():
    # Не удаляем пользовательские адреса при откате версии приложения.
    logger.info("067_order_address: downgrade skipped (column kept)")


# Алиасы оставлены для ручного запуска в стиле Alembic.
upgrade = up
downgrade = down
