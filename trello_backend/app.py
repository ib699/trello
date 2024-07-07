from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
import jwt
import datetime
from functools import wraps
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_socketio import SocketIO, emit, join_room, leave_room


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://trello:trello1234@localhost:5432/trellodb'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
SECRET_KEY = 'your_secret_key'

db = SQLAlchemy(app)
migrate = Migrate(app, db)
socketio = SocketIO(app, cors_allowed_origins="*")


# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    notifications = db.relationship('Notification', back_populates='user')


class Subtask(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(10), default='do')  # 'do' or 'done'
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)

    task = db.relationship('Task', back_populates='subtasks')

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    username = db.Column(db.String(50), db.ForeignKey('user.username'))
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    task = db.relationship('Task', back_populates='comments')
    user = db.relationship('User')

class TaskWatchers(db.Model):
    __tablename__ = 'task_watchers'
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)

    task = db.relationship('Task', back_populates='watchers')
    user = db.relationship('User')

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.String(200), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)

    user = db.relationship('User', back_populates='notifications')


class Board(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(200))
    members = db.relationship('User', secondary='board_members', backref=db.backref('boards', lazy='dynamic'))
    admins = db.relationship('User', secondary='board_admins', backref=db.backref('admin_boards', lazy='dynamic'))


# Define the association table for task assignments
class TaskAssignees(db.Model):
    __tablename__ = 'task_assignees'
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)


# Make sure to update the Task model
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(200))
    board_id = db.Column(db.Integer, db.ForeignKey('board.id'))
    due_date = db.Column(db.Date)
    status = db.Column(db.String(50))
    username = db.Column(db.String(50), db.ForeignKey('user.username'))
    assignees = db.relationship('User', secondary='task_assignees', backref=db.backref('tasks', lazy='dynamic'))
    subtasks = db.relationship('Subtask', back_populates='task')
    comments = db.relationship('Comment', back_populates='task')
    watchers = db.relationship('TaskWatchers', back_populates='task')




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
    admin_board_ids = db.session.query(BoardAdmins.board_id).filter_by(user_id=current_user.id).all()
    # Flatten the list of tuples to a list of board IDs
    admin_board_ids = [board_id for (board_id,) in admin_board_ids]

    # Fetch board IDs where the current user is a member
    member_board_ids = db.session.query(BoardMembers.board_id).filter_by(user_id=current_user.id).all()
    # Flatten the list of tuples to a list of board IDs
    member_board_ids = [board_id for (board_id,) in member_board_ids]

    # Combine and get unique board IDs
    combined_board_ids = list(set(admin_board_ids + member_board_ids))

    # Fetch boards using the combined list of board IDs
    boards = Board.query.filter(Board.id.in_(combined_board_ids)).all()

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

    # Delete all tasks associated with the board
    Task.query.filter_by(board_id=board.id).delete()

    # Delete the board
    db.session.delete(board)
    db.session.commit()

    return '', 204


@app.route('/api/boards/<int:board_id>', methods=['PUT'])
@token_required
def update_board(current_user, board_id):
    data = request.get_json()
    new_name = data.get('name')
    new_description = data.get('description')

    board = Board.query.get_or_404(board_id)

    if current_user not in board.admins:
        return jsonify({"message": "Not authorized"}), 403

    if new_name:
        board.name = new_name
    if new_description:
        board.description = new_description

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
    try:
        # Find all tasks associated with the user
        tasks = Task.query.filter_by(username=current_user.username).all()

        # Delete all tasks associated with the user
        for task in tasks:
            db.session.delete(task)

        # Find all boards where the user is an admin
        admin_boards = Board.query.filter(Board.admins.contains(current_user)).all()

        for board in admin_boards:
            # Delete all tasks associated with each board
            Task.query.filter_by(board_id=board.id).delete()

            # Remove all normal members from the board
            board.members = []

            # Remove all admins from the board
            board.admins = []

            # Delete the board itself
            db.session.delete(board)

        # Remove the user from all boards where they are a member
        member_boards = Board.query.filter(Board.members.contains(current_user)).all()

        for board in member_boards:
            board.members.remove(current_user)

        # Delete the user account
        db.session.delete(current_user)
        db.session.commit()

        return jsonify({"message": "Account deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to delete account: {str(e)}"}), 500


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


@app.route('/api/boards/<int:board_id>/members', methods=['DELETE'])
@token_required
def leave_board(current_user, board_id):
    data = request.json
    username = data.get('username')
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


@app.route('/api/boards/<int:board_id>/members', methods=['GET'])
@token_required
def get_board_members(current_user, board_id):
    # Check if the current user is an admin or member of the board
    board = Board.query.get_or_404(board_id)
    if current_user not in board.admins and current_user not in board.members:
        return jsonify({'message': 'Not authorized to access board members'}), 403

    # Fetch all members and admins of the board
    members = [member.username for member in board.members]
    admins = [admin.username for admin in board.admins]

    # Prepare the response
    board_info = {
        'id': board.id,
        'name': board.name,
        'description': board.description,
        'members': members,
        'admins': admins
    }

    return jsonify(board_info)


@app.route('/api/boards/<int:board_id>/members', methods=['POST'])
@token_required
def add_board_member(current_user, board_id):
    data = request.json
    username = data.get('username')

    # Fetch the board and user
    board = Board.query.get_or_404(board_id)
    user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({'message': 'User not found!'}), 404

    # Check if the current user is an admin of the board
    if current_user not in board.admins:
        return jsonify({'message': 'Not authorized!'}), 403

    # Add the user to the board's members
    if user not in board.members:
        board.members.append(user)
        db.session.commit()
        return jsonify({'message': 'User added as a member!'}), 200
    else:
        return jsonify({'message': 'User is already a member!'}), 400


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

    if 'title' not in data:
        return jsonify({"message": "Title is required"}), 400

    description = data.get('description', '')
    board_id = data.get('board_name', None)
    due_date_str = data.get('due_date')

    due_date = None
    if due_date_str:
        try:
            due_date = datetime.datetime.strptime(due_date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"message": "Invalid due_date format, should be YYYY-MM-DD"}), 400

    status = data.get('status', 'todo')

    new_task = Task(
        title=data['title'],
        description=description,
        board_id=board_id,
        due_date=due_date,
        status=status,
        username=current_user.username
    )

    assignees_usernames = data.get('assignees', [])
    assignees = User.query.filter(User.username.in_(assignees_usernames)).all()
    new_task.assignees = assignees

    db.session.add(new_task)
    db.session.commit()

    return jsonify({
        'id': new_task.id,
        'title': new_task.title,
        'description': new_task.description,
        'board_id': new_task.board_id,
        'due_date': str(new_task.due_date) if new_task.due_date else None,
        'status': new_task.status,
        'assignees': [user.username for user in new_task.assignees]
    })


@app.route('/api/tasks/<int:task_id>/assignees', methods=['PUT'])
@token_required
def update_task_assignees(current_user, task_id):
    task = Task.query.get_or_404(task_id)
    data = request.json
    assignees_usernames = data.get('assignees', [])

    assignees = User.query.filter(User.username.in_(assignees_usernames)).all()
    task.assignees = assignees

    db.session.commit()

    return jsonify({
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'board_id': task.board_id,
        'due_date': task.due_date,
        'status': task.status,
        'assignees': [user.username for user in task.assignees]
    })


@app.route('/api/tasks/<int:task_id>/assignees/<username>', methods=['DELETE'])
@token_required
def delete_task_assignee(current_user, task_id, username):
    task = Task.query.get_or_404(task_id)
    user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({'message': 'User not found!'}), 404

    if user in task.assignees:
        task.assignees.remove(user)
        db.session.commit()
        return jsonify({'message': 'User removed from task!'}), 200
    else:
        return jsonify({'message': 'User not assigned to this task!'}), 404


@app.route('/api/tasks/<int:task_id>/assignees', methods=['GET'])
@token_required
def get_task_assignees(current_user, task_id):
    task = Task.query.get_or_404(task_id)

    if not task:
        return jsonify({"message": "Task not found"}), 404

    assignees = [user.username for user in task.assignees]

    return jsonify({
        'id': task.id,
        'title': task.title,
        'assignees': assignees
    })


@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
@token_required
def update_task(current_user, task_id):
    task = Task.query.get_or_404(task_id)
    data = request.json

    task.title = data.get('title', task.title)
    task.description = data.get('description', task.description)
    task.board_id = data.get('board_id', task.board_id)
    task.due_date = data.get('estimatedDate', task.due_date)
    task.status = data.get('status', task.status)  # typo fixed: 'tatus' -> 'status'

    db.session.commit()

    return jsonify({
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'board_id': task.board_id,
        'estimatedDate': task.due_date,
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

    # Fetch all user IDs from the task_assignees table where task_id matches and user is the current user
    task_assignees = TaskAssignees.query.filter_by(task_id=task_id).all()
    user_ids = [assignee.user_id for assignee in task_assignees if assignee.user_id == current_user.id]

    # If the current user is not assigned to this task, return an error
    if not user_ids:
        return jsonify({'message': 'You are not assigned to this task!'}), 403

    # Delete entries in the Subtask table for this task
    Subtask.query.filter_by(task_id=task_id).delete(synchronize_session=False)

    # Delete entries in the Comment table for this task
    Comment.query.filter_by(task_id=task_id).delete(synchronize_session=False)

    # Delete entries in the task_assignees table for this task and user
    TaskAssignees.query.filter_by(task_id=task_id).filter(TaskAssignees.user_id.in_(user_ids)).delete(
        synchronize_session=False)

    # Delete the task itself
    db.session.delete(task)
    db.session.commit()

    return jsonify({'message': 'Task and its related data deleted!'})



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


@app.route('/api/tasks/<int:task_id>/subtasks', methods=['POST'])
@token_required
def create_subtask(current_user, task_id):
    data = request.json
    title = data.get('title')
    if not title:
        return jsonify({"message": "Title is required"}), 400

    subtask = Subtask(title=title, task_id=task_id)
    db.session.add(subtask)
    db.session.commit()

    return jsonify({'id': subtask.id, 'title': subtask.title, 'status': subtask.status, 'task_id': subtask.task_id})


@app.route('/api/subtasks/<int:subtask_id>', methods=['PUT'])
@token_required
def update_subtask_status(current_user, subtask_id):
    subtask = Subtask.query.get_or_404(subtask_id)
    data = request.json
    subtask.title = data.get('title', subtask.title)
    subtask.status = data.get('status', subtask.status)
    db.session.commit()
    return jsonify({'id': subtask.id, 'title': subtask.title, 'status': subtask.status, 'task_id': subtask.task_id})


@app.route('/api/subtasks/<int:subtask_id>', methods=['DELETE'])
@token_required
def delete_subtask(current_user, subtask_id):
    subtask = Subtask.query.get_or_404(subtask_id)
    db.session.delete(subtask)
    db.session.commit()
    return jsonify({'message': 'Subtask deleted!'})

@app.route('/api/tasks/<int:task_id>/comments', methods=['POST'])
@token_required
def create_comment(current_user, task_id):
    data = request.json
    content = data.get('content')
    if not content:
        return jsonify({"message": "Content is required"}), 400

    comment = Comment(content=content, username=current_user.username, task_id=task_id)
    db.session.add(comment)
    db.session.commit()

    return jsonify({'id': comment.id, 'content': comment.content, 'timestamp': comment.timestamp, 'username': comment.username, 'task_id': comment.task_id})

@app.route('/api/tasks/<int:task_id>/comments', methods=['GET'])
@token_required
def get_comments(current_user, task_id):
    comments = Comment.query.filter_by(task_id=task_id).all()
    return jsonify([{
        'id': comment.id,
        'content': comment.content,
        'timestamp': comment.timestamp,
        'username': comment.username,
        'task_id': comment.task_id
    } for comment in comments])

@app.route('/api/tasks/<int:task_id>/watchers', methods=['POST'])
@token_required
def add_watcher(current_user, task_id):
    task = Task.query.get_or_404(task_id)
    watcher = TaskWatchers(task_id=task_id, user_id=current_user.id)
    db.session.add(watcher)
    db.session.commit()
    return jsonify({'message': 'Watcher added!'})

@app.route('/api/tasks/<int:task_id>/subtasks', methods=['GET'])
@token_required
def get_subtasks(current_user, task_id):
    subtasks = Subtask.query.filter_by(task_id=task_id).all()
    subtasks_list = [{'id': subtask.id, 'title': subtask.title, 'status': subtask.status, 'task_id': subtask.task_id} for subtask in subtasks]
    return jsonify(subtasks_list)

@app.route('/api/subtasks/<int:subtask_id>', methods=['GET'])
@token_required
def get_subtask(current_user, subtask_id):
    subtask = Subtask.query.get_or_404(subtask_id)
    return jsonify({'id': subtask.id, 'title': subtask.title, 'status': subtask.status, 'task_id': subtask.task_id})



@app.route('/api/tasks/<int:task_id>/watchers', methods=['DELETE'])
@token_required
def remove_watcher(current_user, task_id):
    watcher = TaskWatchers.query.filter_by(task_id=task_id, user_id=current_user.id).first_or_404()
    db.session.delete(watcher)
    db.session.commit()
    return jsonify({'message': 'Watcher removed!'})

@app.route('/api/tasks/<int:task_id>/notify', methods=['POST'])
@token_required
def notify_watchers(current_user, task_id):
    task = Task.query.get_or_404(task_id)
    data = request.json
    notification = data.get('notification')
    watchers = TaskWatchers.query.filter_by(task_id=task_id).all()

    for watcher in watchers:
        user_room = f'user_{watcher.user_id}'
        socketio.emit('task_notification', {'task_id': task_id, 'notification': notification}, room=user_room)

    return jsonify({'message': 'Watchers notified!'})

@socketio.on('join')
def on_join(data):
    username = data['username']
    user = User.query.filter_by(username=username).first_or_404()
    room = f'user_{user.id}'
    join_room(room)
    emit('message', {'msg': f'{username} has joined the room.'}, room=room)

@socketio.on('leave')
def on_leave(data):
    username = data['username']
    user = User.query.filter_by(username=username).first_or_404()
    room = f'user_{user.id}'
    leave_room(room)
    emit('message', {'msg': f'{username} has left the room.'}, room=room)


@app.route('/api/notifications', methods=['GET'])
@token_required
def get_notifications(current_user):
    notifications = Notification.query.filter_by(user_id=current_user.id, is_read=False).all()
    return jsonify([{
        'id': notification.id,
        'message': notification.message,
        'timestamp': notification.timestamp,
        'is_read': notification.is_read
    } for notification in notifications])

@app.route('/api/notifications/<int:notification_id>', methods=['PUT'])
@token_required
def mark_notification_as_read(current_user, notification_id):
    notification = Notification.query.get_or_404(notification_id)
    if notification.user_id != current_user.id:
        return jsonify({'message': 'Not authorized'}), 403

    notification.is_read = True
    db.session.commit()
    return jsonify({'message': 'Notification marked as read'})


if __name__ == '__main__':
     app.run(host='0.0.0.0',port=5000, debug=True)
#if __name__ == '__main__':
    # app.run(port=5000, debug=True)
    #socketio.run(app, debug=True)
