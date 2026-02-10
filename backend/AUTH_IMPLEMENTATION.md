# Backend Authentication Implementation Guide

## Completed:
✅ User model created with password hashing
✅ Auth routes with JWT (register, login, refresh, change password)
✅ User.to_dict() method
✅ Added user_id to all models (Subject, Lecture, Note, FlashcardSet, Quiz)
✅ Updated subjects routes with @jwt_required() and user filtering  
✅ Updated lectures routes with @jwt_required() and user filtering

## Pattern for Updating Remaining Routes

For each route file (notes.py, flashcards.py, quizzes.py, tutor.py), apply this pattern:

### 1. Update imports:
```python
from flask_jwt_extended import jwt_required, get_jwt_identity
```

### 2. Add @jwt_required() decorator to all routes:
```python
@route_bp.route('', methods=['GET'])
@jwt_required()
def get_items():
    user_id = get_jwt_identity()
    items = Item.query.filter_by(user_id=user_id).all()
    return jsonify([i.to_dict() for i in items])
```

### 3. For single item routes:
```python
@route_bp.route('/<int:item_id>', methods=['GET'])
@jwt_required()
def get_item(item_id: int):
    user_id = get_jwt_identity()
    item = Item.query.filter_by(id=item_id, user_id=user_id).first_or_404()
    return jsonify(item.to_dict())
```

### 4. For POST/PUT/DELETE, always add user_id:
```python
@route_bp.route('', methods=['POST'])
@jwt_required()
def create_item():
    user_id = get_jwt_identity()
    data = request.get_json()
    item = Item(user_id=user_id, **data)
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201
```

## To Do for Each Route File:

1. **notes.py**: Add @jwt_required() and filter_by(user_id=user_id) to all 7 routes
2. **flashcards.py**: Add @jwt_required() and user filtering to all 11 routes
3. **quizzes.py**: Add @jwt_required() and user filtering to all 8 routes
4. **tutor.py**: Add @jwt_required() to chat routes

## Database Migration:

After updating models, run:
```bash
flask db migrate -m "Add user_id to all models and create User table"
flask db upgrade
```

## Note on Circular Imports:
The User model is imported in models.py which is imported in __init__.py, causing circular import issues.

**Solution**: Update app/models/models.py imports to use forward references and lazy imports.
