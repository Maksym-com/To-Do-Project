import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from database import db, init_db
from models.task import Task

app = Flask(__name__)
CORS(app, origins=os.environ.get("FRONTEND_URL", "http://localhost:5173"))

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