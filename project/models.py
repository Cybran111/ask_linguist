from project.extensions import db

translation = db.Table(
    'translation',
    db.Column('word_id', db.Integer, db.ForeignKey('word.id')),
    db.Column('translated_id', db.Integer, db.ForeignKey('word.id')),
)


class Word(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    language = db.Column(db.Unicode(80))
    text = db.Column(db.Unicode(80))
    translate = db.relationship(
        'Word',
        lazy='dynamic',
        secondary=translation,
        primaryjoin=(translation.c.word_id == id),
        secondaryjoin=(translation.c.translated_id == id),
        backref=db.backref('translated', lazy='dynamic')
    )

    def __init__(self, language, text):
        self.language = language.title()
        self.text = text

    def __repr__(self):
        return '<Language %s, Text %s>' % (self.language, self.text)
