import os
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()

def init_db(app):
    database_url = os.environ.get("DATABASE_URL", "sqlite:///local.db")
    # Render/Supabase иногда дают url с postgres://, SQLAlchemy требует postgresql://
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    # Supabase includes this pooler hint, but psycopg2 rejects it as a DSN option.
    parts = urlsplit(database_url)
    query = [(key, value) for key, value in parse_qsl(parts.query, keep_blank_values=True) if key != "pgbouncer"]
    database_url = urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))

    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)