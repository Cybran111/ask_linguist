import os


class DevelopmentConfig:
    BASEDIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    TESTING = False

    SECRET_KEY = 'im!mx2m(69)b^7n3j!yi)k!a7n(^09=^&*+pnan78hl^%_yp4u'

    CSRF = True
    CSRF_SECRET = 'im!mx2m(69)b^7n3j!yi)k!a7n(^09=^&*+pnan78hl^%_yp4u'

    JSONIFY_PRETTYPRINT_REGULAR = False

    FIXTURES_DIR = os.path.join(BASEDIR, 'fixtures')

    # Flask
    DEBUG = True
    DEVELOPMENT = True

    SQLALCHEMY_ECHO = True

    # Database
    SQLALCHEMY_DATABASE_URI = 'sqlite:///db.sqlite3'

    # Logger configuration
    LOG_CONFIG = {
        'version': 1,
        'disable_existing_loggers': False,
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'level': 'INFO',
                'formatter': 'detailed',
                'stream': 'ext://sys.stdout',
            },
        },
        'formatters': {
            'detailed': {
                'format': '%(asctime)s %(module)-17s line:%(lineno)-4d '
                          '%(levelname)-8s %(message)s',
            },
            'email': {
                'format': 'Timestamp: %(asctime)s\nModule: %(module)s\n'
                          'Line: %(lineno)d\nMessage: %(message)s',
            },
        },
        'root': {
            'level': 'INFO',
            'handlers': [
                'console',
            ]
        }
    }

    FRONTEND_VERSION = "trunk"
    STATIC_PATH = "/static"
