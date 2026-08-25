from database import db


class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    detail = db.Column(db.String(500), nullable=False, default="Added just now")
    done = db.Column(db.Boolean, nullable=False, default=False)
    tag = db.Column(db.String(40), nullable=False, default="Today")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "detail": self.detail,
            "done": self.done,
            "tag": self.tag,
        }