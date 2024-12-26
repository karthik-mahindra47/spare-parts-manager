from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class SparePart(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sr_no = db.Column(db.String(50), nullable=False)
    equipment = db.Column(db.String(100), nullable=False)
    item_description = db.Column(db.String(200), nullable=False)
    oem_part_number = db.Column(db.String(100), nullable=False)
    oem = db.Column(db.String(100), nullable=False)
    qty = db.Column(db.Integer, nullable=False)
    igt_part_number = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(100), nullable=False)
    sublocation = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class EmailSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email1 = db.Column(db.String(120))
    email2 = db.Column(db.String(120))
    email3 = db.Column(db.String(120))