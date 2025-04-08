import os
from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import json

app = Flask(__name__, static_folder='.')
CORS(app)

# Configure database
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Note model
class Note(db.Model):
    __tablename__ = 'notes'
    
    id = db.Column(db.String, primary_key=True)
    title = db.Column(db.String(100), nullable=True)
    content = db.Column(db.Text, nullable=True)
    text_color = db.Column(db.String(50), nullable=True, default='#000000')
    font_size = db.Column(db.Integer, nullable=True, default=16)
    timestamp = db.Column(db.BigInteger, default=lambda: int(datetime.now().timestamp() * 1000))

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'text_color': self.text_color,
            'font_size': self.font_size,
            'timestamp': self.timestamp
        }

# Create tables if they don't exist
with app.app_context():
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    if not inspector.has_table('notes'):
        db.create_all()

# Routes
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

@app.route('/api/notes', methods=['GET'])
def get_notes():
    notes = Note.query.all()
    return jsonify([note.to_dict() for note in notes])

@app.route('/api/notes', methods=['POST'])
def create_note():
    data = request.json
    new_note = Note(
        id=data['id'],
        title=data['title'],
        content=data['content'],
        text_color=data.get('text_color', '#000000'),
        font_size=data.get('font_size', 16),
        timestamp=data['timestamp']
    )
    db.session.add(new_note)
    db.session.commit()
    return jsonify(new_note.to_dict()), 201

@app.route('/api/notes/<string:id>', methods=['PUT'])
def update_note(id):
    note = Note.query.get(id)
    if not note:
        return jsonify({'error': 'Note not found'}), 404
    
    data = request.json
    note.title = data['title']
    note.content = data['content']
    note.text_color = data.get('text_color', '#000000')
    note.font_size = data.get('font_size', 16)
    note.timestamp = data['timestamp']
    
    db.session.commit()
    return jsonify(note.to_dict())

@app.route('/api/notes/<string:id>', methods=['DELETE'])
def delete_note(id):
    note = Note.query.get(id)
    if not note:
        return jsonify({'error': 'Note not found'}), 404
    
    db.session.delete(note)
    db.session.commit()
    return jsonify({'message': 'Note deleted'})

@app.route('/api/notes/all', methods=['DELETE'])
def delete_all_notes():
    notes = Note.query.all()
    count = len(notes)
    
    for note in notes:
        db.session.delete(note)
    
    db.session.commit()
    return jsonify({'message': f'All {count} notes deleted successfully'})

@app.route('/api/notes/<string:id>', methods=['GET'])
def get_note(id):
    note = Note.query.get(id)
    if not note:
        return jsonify({'error': 'Note not found'}), 404
    
    return jsonify(note.to_dict())

# Settings model 
class UserSettings(db.Model):
    __tablename__ = 'user_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    settings_data = db.Column(db.Text, nullable=False)
    
    def to_dict(self):
        return json.loads(self.settings_data)

# Create settings table if it doesn't exist
with app.app_context():
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    if not inspector.has_table('user_settings'):
        db.create_all()

@app.route('/api/settings', methods=['GET'])
def get_settings():
    settings = UserSettings.query.first()
    if not settings:
        return jsonify({})
    return jsonify(settings.to_dict())

@app.route('/api/settings', methods=['POST'])
def save_settings():
    data = request.json
    settings = UserSettings.query.first()
    
    if settings:
        settings.settings_data = json.dumps(data)
    else:
        settings = UserSettings(settings_data=json.dumps(data))
        db.session.add(settings)
    
    db.session.commit()
    return jsonify(data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)