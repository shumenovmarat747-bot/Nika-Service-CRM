"""Address-based intake flow and username-based staff accounts."""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import sqlite3

import pytest

from app.utils.exceptions import ValidationError
from app.utils.validators import validate_login


ROOT = Path(__file__).resolve().parents[1]


def test_order_forms_use_address_without_legacy_sensitive_fields():
    add_order = (ROOT / "templates/add_order.html").read_text(encoding="utf-8")
    detail = (ROOT / "templates/order_detail.html").read_text(encoding="utf-8")
    registry = (ROOT / "templates/all_orders.html").read_text(encoding="utf-8")

    assert 'name="address"' in add_order
    assert 'name="address"' in detail
    assert '"address_col"' in registry

    for html in (add_order, detail):
        assert 'name="email"' not in html
        assert 'name="serial_number"' not in html
        assert 'name="device_password"' not in html

    customer_routes = (ROOT / "app/routes/customers.py").read_text(encoding="utf-8")
    lookup_block = customer_routes.split("def api_lookup_customer():", 1)[1].split("@bp.route", 1)[0]
    assert "customer_dict.pop('email', None)" in lookup_block
    assert "device_dict.pop('serial_number', None)" in lookup_block
    assert "device_dict.pop('password', None)" in lookup_block


def test_staff_login_is_not_required_to_be_an_email():
    assert validate_login("master1") == "master1"
    assert validate_login("сергей-2") == "сергей-2"
    assert validate_login("old@example.com") == "old@example.com"
    with pytest.raises(ValidationError):
        validate_login("bad login")

    html = (ROOT / "templates/settings/employees.html").read_text(encoding="utf-8")
    assert 'id="employeeLogin" required' in html
    assert 'type="email" class="form-control" id="employeeLogin"' not in html
    assert "Логин (Email)" not in html

    legacy_settings = (ROOT / "templates/settings.html").read_text(encoding="utf-8")
    assert 'id="masterLogin" required' in legacy_settings
    assert "login: login" in legacy_settings


def test_order_address_migration_is_idempotent(tmp_path, monkeypatch):
    db_path = tmp_path / "address.sqlite3"
    with sqlite3.connect(db_path) as conn:
        conn.execute("CREATE TABLE orders (id INTEGER PRIMARY KEY)")

    monkeypatch.setenv("DB_DRIVER", "sqlite")
    monkeypatch.setenv("DATABASE_PATH", str(db_path))

    migration_path = ROOT / "app/database/migrations/versions/067_order_address.py"
    spec = spec_from_file_location("migration_067_order_address_test", migration_path)
    module = module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)

    module.up()
    module.up()

    with sqlite3.connect(db_path) as conn:
        columns = {row[1] for row in conn.execute("PRAGMA table_info(orders)")}
    assert "address" in columns
