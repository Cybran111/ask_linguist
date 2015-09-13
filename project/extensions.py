from flask.ext.heroku import Heroku
from flask.ext.sqlalchemy import SQLAlchemy
from flask_wtf.csrf import CsrfProtect

csrf = CsrfProtect()
db = SQLAlchemy()
heroku = Heroku()
