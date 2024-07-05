# Create a new Django project
django-admin startproject trello_backend

# Navigate into the project directory
cd trello_backend

# Create a new Django app
python manage.py startapp api

# Install required packages
pip install -r requirements.txt

sudo -u postgres createuser myuser
sudo -u postgres psql -c "ALTER USER myuser WITH PASSWORD 'mypassword';"
sudo -u postgres createdb mydatabase -O myuser

