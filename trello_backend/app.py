from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
import jwt
import datetime
from functools import wraps
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://trello:trello1234@localhost:5432/trellodb'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
SECRET_KEY = 'your_secret_key'

db = SQLAlchemy(app)
migrate = Migrate(app, db)


# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)


class Board(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(200))
    members = db.relationship('User', secondary='board_members', backref=db.backref('boards', lazy='dynamic'))
    admins = db.relationship('User', secondary='board_admins', backref=db.backref('admin_boards', lazy='dynamic'))


class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(200))
    board_id = db.Column(db.Integer, db.ForeignKey('board.id'))
    due_date = db.Column(db.Date)
    status = db.Column(db.String(50))
    username = db.Column(db.String(50), db.ForeignKey('user.username'))


class BoardMembers(db.Model):
    __tablename__ = 'board_members'
    board_id = db.Column(db.Integer, db.ForeignKey('board.id'), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)


class BoardAdmins(db.Model):
    __tablename__ = 'board_admins'
    board_id = db.Column(db.Integer, db.ForeignKey('board.id'), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]  # Bearer <token>

        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['user_id']).first()
        except:
            return jsonify({'message': 'Token is invalid!'}), 401

        return f(current_user, *args, **kwargs)

    return decorated



@app.route('/')
def home():
    return "Welcome to the Simple Flask App!"


@app.route('/getProfile', methods=['GET'])
@token_required
def get_profile(current_user):
    user_profile = {
        'username': current_user.username,
        'email': current_user.email,
        'membershipDate': '2023-01-01'  # Example date, replace with actual data
    }
    return jsonify(user_profile)


@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Username already exists"}), 400

    new_user = User(username=username, email=email, password=password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username, password=password).first()
    if user:
        token = jwt.encode(
            {
                'user_id': user.id,
                'username': user.username,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
            },
            SECRET_KEY,
            algorithm="HS256"
        )
        if isinstance(token, bytes):
            token = token.decode('utf-8')  # Decode the token to a string only if it is in bytes
        response = make_response(jsonify({"message": "Login successful", "token": token}))
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response
    else:
        return jsonify({"message": "Invalid username or password"}), 401




@app.route('/api/boards', methods=['GET'])
@token_required
def get_boards(current_user):
    # Fetch board IDs where the current user is an admin
    board_ids = db.session.query(BoardAdmins.board_id).filter_by(user_id=current_user.id).all()
    # Flatten the list of tuples to a list of board IDs
    board_ids = [board_id for (board_id,) in board_ids]

    # Fetch boards using the obtained board IDs
    boards = Board.query.filter(Board.id.in_(board_ids)).all()

    if not boards:
        return jsonify({"message": "No boards found"}), 404

    return jsonify([{
        'id': board.id,
        'name': board.name,
        'description': board.description
    } for board in boards])


@app.route('/api/boards/<int:board_id>', methods=['DELETE'])
@token_required
def delete_board(current_user, board_id):
    board = Board.query.get_or_404(board_id)
    if current_user not in board.admins:
        return jsonify({"message": "Not authorized"}), 403

    db.session.delete(board)
    db.session.commit()
    return '', 204


@app.route('/api/boards/<int:board_id>', methods=['PUT'])
@token_required
def update_board(current_user, board_id):
    data = request.get_json()
    new_name = data.get('name')
    board = Board.query.get_or_404(board_id)

    if current_user not in board.admins:
        return jsonify({"message": "Not authorized"}), 403

    board.name = new_name
    db.session.commit()
    return jsonify({
        'id': board.id,
        'name': board.name,
        'description': board.description
    })


@app.route('/api/user/logout', methods=['POST'])
def logout():
    return jsonify({"message": "Logged out successfully"}), 200


@app.route('/api/user/profile', methods=['DELETE'])
@token_required
def delete_account(current_user):
    db.session.delete(current_user)
    db.session.commit()
    return jsonify({"message": "Account deleted successfully"}), 200


@app.route('/api/user/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json()
    current_user.email = data.get('email', current_user.email)
    current_user.password = data.get('password', current_user.password)
    db.session.commit()
    return jsonify({"message": "Profile updated successfully"}), 200


@app.route('/api/users', methods=['GET'])
@token_required
def get_all_users(current_user):
    users = User.query.all()
    return jsonify([user.username for user in users])


@app.route('/api/boards', methods=['POST'])
@token_required
def create_board(current_user):
    data = request.json
    new_board = Board(name=data['name'], description=data['description'])
    new_board.admins.append(current_user)
    db.session.add(new_board)
    db.session.commit()
    return jsonify({
        'id': new_board.id,
        'name': new_board.name,
        'description': new_board.description
    })


@app.route('/api/boards/<int:board_id>/members/<username>', methods=['DELETE'])
@token_required
def leave_board(current_user, board_id, username):
    board = Board.query.get_or_404(board_id)
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'message': 'User not found!'}), 404

    if username == current_user.username or current_user in board.admins:
        if user in board.members:
            board.members.remove(user)
            db.session.commit()
            return jsonify({'message': 'Member removed!'}), 200
        else:
            return jsonify({'message': 'Member not found!'}), 404
    else:
        return jsonify({'message': 'Not authorized!'}), 403


@app.route('/api/boards/<int:board_id>/admins/<username>', methods=['PUT'])
@token_required
def change_admin_status(current_user, board_id, username):
    board = Board.query.get_or_404(board_id)
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'message': 'User not found!'}), 404

    if current_user in board.admins:
        if user in board.members:
            if user in board.admins:
                board.admins.remove(user)
                message = 'Admin role removed!'
            else:
                board.admins.append(user)
                message = 'Admin role added!'
            db.session.commit()
            return jsonify({'message': message}), 200
        else:
            return jsonify({'message': 'User is not a member of the board!'}), 404
    else:
        return jsonify({'message': 'Not authorized!'}), 403


@app.route('/api/user/tasks', methods=['GET'])
@token_required
def get_user_tasks(current_user):
    user_tasks = Task.query.filter_by(username=current_user.username).all()
    return jsonify([{
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'board_name': task.board_id,
        'due_date': task.due_date,
        'status': task.status
    } for task in user_tasks])


@app.route('/api/tasks', methods=['POST'])
@token_required
def create_task(current_user):
    data = request.json
    new_task = Task(
        title=data['title'],
        description=data.get('description', ''),
        board_id=data['board_name'],
        due_date=data.get('due_date', None),
        status='todo',
        username=current_user.username
    )
    db.session.add(new_task)
    db.session.commit()
    return jsonify({
        'id': new_task.id,
        'title': new_task.title,
        'description': new_task.description,
        'board_id': new_task.board_id,
        'due_date': new_task.due_date,
        'status': new_task.status
    })


@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
@token_required
def update_task(current_user, task_id):
    task = Task.query.get_or_404(task_id)
    data = request.json

    for key, value in data.items():
        setattr(task, key, value)

    db.session.commit()
    return jsonify({
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'board_id': task.board_id,
        'due_date': task.due_date,
        'status': task.status
    })


@app.route('/api/tasks/<int:task_id>/status', methods=['PUT'])
@token_required
def update_task_status(current_user, task_id):
    task = Task.query.get_or_404(task_id)
    data = request.json
    task.status = data.get('status', task.status)
    db.session.commit()
    return jsonify({
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'board_id': task.board_id,
        'due_date': task.due_date,
        'status': task.status
    })


@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@token_required
def delete_task(current_user, task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'Task deleted!'})


@app.route('/api/boards/<int:board_id>/tasks', methods=['GET'])
@token_required
def get_board_tasks(current_user, board_id):
    board_tasks = Task.query.filter_by(board_id=board_id).all()
    return jsonify([{
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'board_id': task.board_id,
        'due_date': task.due_date,
        'status': task.status
    } for task in board_tasks])


if __name__ == '__main__':
    app.run(port=5000, debug=True)
