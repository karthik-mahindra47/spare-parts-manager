from flask import Flask, request, jsonify, render_template
from flask_mail import Mail, Message
from models import db, SparePart, EmailSettings
from config import Config
import pandas as pd

app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
db.init_app(app)
mail = Mail(app)

# Create database tables
with app.app_context():
    db.create_all()

def send_low_stock_alert(part):
    email_settings = EmailSettings.query.first()
    if not email_settings:
        return
    
    emails = [email_settings.email1, email_settings.email2, email_settings.email3]
    emails = [email for email in emails if email]  # Remove empty emails
    
    if not emails:
        return

    message = Message(
        subject=f"Low Stock Alert: {part.item_description}",
        recipients=emails,
        html=render_template(
            'email/low_stock_alert.html',
            part=part
        )
    )
    mail.send(message)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/parts', methods=['GET'])
def get_parts():
    parts = SparePart.query.all()
    return jsonify([{
        'id': part.id,
        'sr_no': part.sr_no,
        'equipment': part.equipment,
        'item_description': part.item_description,
        'oem_part_number': part.oem_part_number,
        'oem': part.oem,
        'qty': part.qty,
        'igt_part_number': part.igt_part_number,
        'location': part.location,
        'sublocation': part.sublocation
    } for part in parts])

@app.route('/api/parts', methods=['POST'])
def add_part():
    data = request.json
    part = SparePart(
        sr_no=data['sr_no'],
        equipment=data['equipment'],
        item_description=data['item_description'],
        oem_part_number=data['oem_part_number'],
        oem=data['oem'],
        qty=data['qty'],
        igt_part_number=data['igt_part_number'],
        location=data['location'],
        sublocation=data['sublocation']
    )
    db.session.add(part)
    db.session.commit()
    return jsonify({'message': 'Part added successfully'})

@app.route('/api/parts/<int:part_id>', methods=['PUT'])
def update_part(part_id):
    part = SparePart.query.get_or_404(part_id)
    data = request.json
    
    for key, value in data.items():
        setattr(part, key, value)
    
    db.session.commit()
    
    if part.qty < 4:
        send_low_stock_alert(part)
    
    return jsonify({'message': 'Part updated successfully'})

@app.route('/api/parts/<int:part_id>', methods=['DELETE'])
def delete_part(part_id):
    part = SparePart.query.get_or_404(part_id)
    db.session.delete(part)
    db.session.commit()
    return jsonify({'message': 'Part deleted successfully'})

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    try:
        df = pd.read_excel(file)
        for _, row in df.iterrows():
            part = SparePart(
                sr_no=str(row['Sr No.']),
                equipment=str(row['Equipment']),
                item_description=str(row['Item Description']),
                oem_part_number=str(row['OEM Part Number']),
                oem=str(row['OEM']),
                qty=int(row['QTY']),
                igt_part_number=str(row['IGT Part Number']),
                location=str(row['Location']),
                sublocation=str(row['Sublocation'])
            )
            db.session.add(part)
        db.session.commit()
        return jsonify({'message': 'File uploaded successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)