from importlib import import_module
import logging
import logging.config
from os import environ
from flask import Flask
from project.extensions import csrf, db, heroku
from project.blueprints import all_blueprints


def create_app():
    app = Flask(__name__, static_folder='../static')
    used_config = environ.get('APP_SETTINGS', 'config.ProductionConfig')
    app.config.from_object(used_config)

    with app.app_context():
        for module in app.config.get('DB_MODELS_IMPORT', list()):
            import_module(module)

    for bp in all_blueprints:
        import_module(bp.import_name)
        app.register_blueprint(bp)

    logging.config.dictConfig(app.config["LOG_CONFIG"])
    db.init_app(app)
    csrf.init_app(app)
    heroku.init_app(app)

    return app
