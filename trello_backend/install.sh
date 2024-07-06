# Install required packages
pip install -r requirements.txt

sudo -u postgres createuser trello
sudo -u postgres psql -c "ALTER USER trello WITH PASSWORD 'trello1234';"
sudo -u postgres createdb trellodb -O trello

flask db init
flask db migrate -m "Initial migration"
flask db upgrade
#  DATABASES = {
#      'default': {
#          'ENGINE': 'django.db.backends.postgresql',
#          'NAME': 'trellodb',
#          'USER': 'trello',
#          'PASSWORD': 'trello1234',
#          'HOST': 'localhost',
#          'PORT': '5432',
#      }
#  }