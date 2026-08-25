import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from database import db, init_db
from models.task import Task
from models.user import User

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "change-this-in-production")
allowed_origins = [origin.strip() for origin in os.environ.get("FRONTEND_URL", "").split(",") if origin.strip()]
allowed_origins.extend(["http://localhost:5173", "http://127.0.0.1:5173"])
CORS(app, origins=allowed_origins)

init_db(app)

with app.app_context():
    db.create_all()
    if not Task.query.first():
        db.session.add_all([
            Task(title="Map out the week", detail="Choose three outcomes that would make Friday feel good.", tag="Planning"),
            Task(title="Reply to the design notes", detail="Close the loop with a clear next step.", tag="Work"),
            Task(title="Book a quiet hour", detail="Make some room for focused, uninterrupted work.", done=True, tag="Personal"),
        ])
        db.session.commit()

@app.route("/")
def health():
    return {"status": "ok"}


def make_token(user_id):
    return URLSafeTimedSerializer(app.config["SECRET_KEY"]).dumps({"user_id": user_id})


def user_from_token():
    authorization = request.headers.get("Authorization", "")
    if not authorization.startswith("Bearer "):
        return None
    try:
        data = URLSafeTimedSerializer(app.config["SECRET_KEY"]).loads(authorization[7:], max_age=60 * 60 * 24 * 30)
    except (BadSignature, SignatureExpired):
        return None
    return db.session.get(User, data.get("user_id"))


@app.post("/auth/register")
def register():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    if not name or not email or len(password) < 6:
        return {"error": "name, email and a password of at least 6 characters are required"}, 400
    if User.query.filter_by(email=email).first():
        return {"error": "email is already registered"}, 409
    user = User(name=name, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return {"token": make_token(user.id), "user": user.to_dict()}, 201


@app.post("/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(str(data.get("password", ""))):
        return {"error": "invalid email or password"}, 401
    return {"token": make_token(user.id), "user": user.to_dict()}


@app.get("/auth/me")
def current_user():
    user = user_from_token()
    if not user:
        return {"error": "authentication required"}, 401
    return user.to_dict()


@app.get("/tasks")
def get_tasks():
    return jsonify([task.to_dict() for task in Task.query.order_by(Task.id.desc()).all()])


@app.post("/tasks")
def create_task():
    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()
    if not title:
        return {"error": "title is required"}, 400
    task = Task(title=title, detail=data.get("detail", "Added just now"), tag=data.get("tag", "Today"))
    db.session.add(task)
    db.session.commit()
    return task.to_dict(), 201


@app.patch("/tasks/<int:task_id>")
def update_task(task_id):
    task = db.get_or_404(Task, task_id)
    data = request.get_json(silent=True) or {}
    for field in ("title", "detail", "tag"):
        if field in data:
            setattr(task, field, str(data[field]).strip())
    if "done" in data:
        task.done = bool(data["done"])
    db.session.commit()
    return task.to_dict()


@app.delete("/tasks/<int:task_id>")
def delete_task(task_id):
    task = db.get_or_404(Task, task_id)
    db.session.delete(task)
    db.session.commit()
    return {"status": "deleted"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)