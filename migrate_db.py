from app import app, db

with app.app_context():
    # Drop existing tables
    db.drop_all()
    
    # Recreate the tables with the updated schema
    db.create_all()
    print("Database tables dropped and recreated successfully")
