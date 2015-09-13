from flask_wtf import Form
from wtforms import StringField
from wtforms.validators import DataRequired


class WordForm(Form):
    language = StringField('Language', validators=[DataRequired()])
    word = StringField('Word', validators=[DataRequired()])
