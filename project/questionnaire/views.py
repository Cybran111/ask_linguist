from flask import render_template, jsonify
from project.extensions import db
from project.models import Word
from project.questionnaire.forms import WordForm
from project.blueprints import questionnaire_app


class Hashabledict(dict):
    def __key(self):
        return tuple((k, self[k]) for k in sorted(self))

    def __hash__(self):
        return hash(self.__key())

    def __eq__(self, other):
        return self.__key() == other.__key()


@questionnaire_app.route('/', methods=['GET', 'POST'])
def hello_world_my_horse_is_amasing():
    word_form = WordForm(prefix="not the word")
    translate_form = WordForm(prefix="translate")
    if word_form.validate_on_submit() and translate_form.validate_on_submit():
        translated_word = Word.query.filter_by(
            language=word_form.language.data,
            text=word_form.word.data,
        ).first() or Word(language=word_form.language.data, text=word_form.word.data)

        translate = Word.query.filter_by(
            language=translate_form.language.data,
            text=translate_form.word.data,
        ).first() or Word(
            language=translate_form.language.data,
            text=translate_form.word.data,
        )

        translated_word.translate.append(translate)
        db.session.add(translated_word)
        db.session.add(translate)
        db.session.commit()

        word_form.word.data, translate_form.word.data = "", ""

    words = Word.query.order_by(Word.id.desc()).all()
    return render_template(
        'post.html',
        word_form=word_form,
        translate_form=translate_form,
        words=words,
    )


@questionnaire_app.route("/<source>-<target>/")
def questionnaire(source, target):
    my_words = Word.query.filter_by(language=target)

    w = [
        Hashabledict(
            source=tuple(source.text for source in word.translated.filter_by(language=source)),
            target=word.text
        )
        for word in my_words
        if word.translated.filter_by(language=source).first()
        ]

    my_d = Word.query.filter_by(language=source)
    d = [
        Hashabledict(
            source=(word.text,),
            target=word.translated.filter_by(language=target).first().text,
        )
        for word in my_d
        if word.translated.filter_by(language=target).first()]

    q = w+d
    a = list(filter(lambda el: el["source"] and el["target"], set(q)))
    print("a: " +str(a))

    return jsonify(words=a)


@questionnaire_app.route("/words")
def words():
    return render_template('question.html')
