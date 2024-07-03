from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
import jwt
import datetime
from functools import wraps

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

SECRET_KEY = 'your_secret_key'



# Mock data
USER_BOARDS = {
    'ebi': [
        {'id': 1, 'name': 'Board 1'},
        {'id': 2, 'name': 'Board 2'}
    ],
    'ebra': [
        {'id': 1, 'name': 'Board A'},
        {'id': 2, 'name': 'Board B'}
    ]
}

USER_CREDENTIALS = {
    'ebi': '1379',
    'ebra': '2000'
}

MOCK_TASKS = [
    {
        'id': 1,
        'title': 'Task 1',
        'description': 'Description for task 1',
        'board_name': 'Board 1',
        'due_date': '2024-07-15',
        'status': 'todo',
        'username': 'ebi'
    },
    {
        'id': 2,
        'title': 'Task 2',
        'description': 'Description for task 2',
        'board_name': 'Board A',
        'due_date': '2024-07-20',
        'status': 'in progress',
        'username': 'ebra'
    }
]

# Mock data and users
MOCK_TASKS = [
    {'id': 1, 'username': 'ebi', 'title': 'Task 1', 'description': 'Description 1', 'board_name': 'Board 1', 'due_date': '2023-01-01', 'status': 'todo'},
    {'id': 2, 'username': 'ebra', 'title': 'Task 2', 'description': 'Description 2', 'board_name': 'Board A', 'due_date': '2023-02-01', 'status': 'in progress'},
]
MOCK_BOARDS = [
    {'id': 1, 'name': 'Board 1', 'description': 'Description of Board 1', 'members': ['ebi'], 'admins': ['ebi']},
    {'id': 2, 'name': 'Board A', 'description': 'Description of Board A', 'members': ['ebra'], 'admins': ['ebra']},
]
USERS = ['ebi', 'ebra', 'mammad', 'user1', 'user2']


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"message": "Token is missing"}), 401

        try:
            token = token.split(" ")[1]  # Remove 'Bearer ' prefix
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            current_user = data['username']
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Token is invalid"}), 401

        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/')
def home():
    return "Welcome to the Simple Flask App!"


@app.route('/getProfile', methods=['GET'])
@token_required
def get_profile(current_user):
    # Retrieve user profile information from your user data store
    user_profile = {
        'username': current_user,
        'email': f'{current_user}@gmail.com',  # Example email, replace with actual data
        'membershipDate': '2023-01-01'         # Example date, replace with actual data
    }
    return jsonify(user_profile)


@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    # Check if username already exists
    if username in USER_CREDENTIALS:
        return jsonify({"message": "Username already exists"}), 400

    # Add user to credentials
    USER_CREDENTIALS[username] = password

    # Initialize boards for the new user
    USER_BOARDS[username] = []

    # Print user information to the server console
    print(f"Registered new user: {username}, Email: {email}, Password: {password}")

    return jsonify({"message": "User registered successfully"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Check if the provided credentials match the expected ones
    if username in USER_CREDENTIALS and password == USER_CREDENTIALS[username]:
        token = jwt.encode({'username': username, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)}, SECRET_KEY, algorithm="HS256")
        
        # Create a response with CORS headers and set the Authorization header
        response = make_response(jsonify({"message": "Login successful", "token": token}))
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response
    else:
        return jsonify({"message": "Invalid username or password"}), 401

@app.route('/api/boards', methods=['GET'])
@token_required
def get_boards(current_user):
    boards = USER_BOARDS.get(current_user)
    if not boards:
        return jsonify({"message": "No boards found"}), 404

    return jsonify(boards)



@app.route('/api/boards/<int:board_id>', methods=['DELETE'])
@token_required
def delete_board(current_user, board_id):
    global USER_BOARDS
    USER_BOARDS[current_user] = [board for board in USER_BOARDS[current_user] if board['id'] != board_id]
    return '', 204


@app.route('/api/boards/<int:board_id>', methods=['PUT'])
@token_required
def update_board(current_user, board_id):
    data = request.get_json()
    new_name = data.get('name')
    boards = USER_BOARDS.get(current_user, [])

    for board in boards:
        if board['id'] == board_id:
            board['name'] = new_name
            return jsonify(board)
    
    return jsonify({"message": "Board not found"}), 404

@app.route('/api/user/logout', methods=['POST'])
@token_required
def logout(current_user):
    # Implement your logout logic here, such as clearing the session or token
    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/api/user/profile', methods=['DELETE'])
@token_required
def delete_account(current_user):
    # Implement your delete account logic here
    return jsonify({"message": "Account deleted successfully"}), 200

@app.route('/api/user/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json()
    # Implement your update profile logic here
    return jsonify({"message": "Profile updated successfully"}), 200



@app.route('/api/user/tasks', methods=['GET'])
@token_required
def get_user_tasks(current_user):
    user_tasks = [task for task in MOCK_TASKS if task['username'] == current_user]
    return jsonify(user_tasks)

@app.route('/api/users', methods=['GET'])
@token_required
def get_all_users(current_user):
    return jsonify(USERS)

@app.route('/api/boards', methods=['POST'])
@token_required
def create_board(current_user):
    data = request.json
    new_board = {
        'id': len(MOCK_BOARDS) + 1,
        'name': data['name'],
        'description': data['description'],
        'members': data['members'],
        'admins': [current_user]
    }
    MOCK_BOARDS.append(new_board)
    return jsonify(new_board)

@app.route('/api/boards/<int:board_id>/members/<username>', methods=['DELETE'])
@token_required
def leave_board(current_user, board_id, username):
    board = next((b for b in MOCK_BOARDS if b['id'] == board_id), None)
    if not board:
        return jsonify({'message': 'Board not found!'}), 404
    if username == current_user or current_user in board['admins']:
        if username in board['members']:
            board['members'].remove(username)
            return jsonify({'message': 'Member removed!'}), 200
        else:
            return jsonify({'message': 'Member not found!'}), 404
    else:
        return jsonify({'message': 'Not authorized!'}), 403

@app.route('/api/boards/<int:board_id>/admins/<username>', methods=['PUT'])
@token_required
def change_admin_status(current_user, board_id, username):
    board = next((b for b in MOCK_BOARDS if b['id'] == board_id), None)
    if not board:
        return jsonify({'message': 'Board not found!'}), 404
    if current_user in board['admins']:
        if username in board['members']:
            if username in board['admins']:
                board['admins'].remove(username)
                return jsonify({'message': 'Admin role removed!'}), 200
            else:
                board['admins'].append(username)
                return jsonify({'message': 'Admin role added!'}), 200
        else:
            return jsonify({'message': 'User is not a member of the board!'}), 404
    else:
        return jsonify({'message': 'Not authorized!'}), 403



if __name__ == '__main__':
    app.run(port=5000, debug=True)
