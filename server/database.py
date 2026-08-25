import os
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()

def init_db(app):
    database_url = os.environ.get("DATABASE_URL", "sqlite:///local.db")
    # Render/Supabase иногда дают url с postgres://, SQLAlchemy требует postgresql://
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)