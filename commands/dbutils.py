import importlib
import json
from flask import current_app
from flask.ext.script import Manager
from flask.ext.migrate import Migrate, upgrade as migrate_upgrade
from pathlib import Path

from commands.utils import perform
from project.extensions import db


class _DBUtilsConfig:

    def __init__(self, database):
        self.db = database

    @property
    def metadata(self):
        return self.db.metadata


class DBUtils:

    def __init__(self, app=None, database=None):
        if app is not None and database is not None:
            self.init_app(app, database)

    def init_app(self, app, db):
        if not hasattr(app, 'extensions'):
            app.extensions = {}
        app.extensions['meowth_dbutils'] = _DBUtilsConfig(db)
        Migrate(app, db)


DBUtilsCommand = Manager(usage='Perform basic dev database operations')


def import_class(what):
    modulename, classname = what.rsplit('.', 1)
    module = importlib.import_module(modulename)
    return getattr(module, classname)


@DBUtilsCommand.option(
    '-d', '--directory',
    dest='directory',
    default=None,
    help='Directory to search fixtures in',
)
def populate(directory=None):
    """ Populate database with fixtures
    """

    if directory is None:
        directory = current_app.config['FIXTURES_DIR']
    with perform(
        name='dbutils populate',
        before='Loading fixtures from directory %s' % directory,
        fail='Error occured while loading fixtures',
    ):
        fixtures = Path(directory).glob("*.json")
        for fixture_file_path in fixtures:
            with fixture_file_path.open() as data_file:
                data = json.load(data_file)
                for entry in data:
                    model_class = import_class(entry['model'])
                    fixture_model = model_class(**entry['fields'])
                    db.session.add(fixture_model)
        db.session.commit()


@DBUtilsCommand.option(
    '-a', '--all',
    dest='drop_all',
    action='store_true',
    default=False,
    help='Drop ALL tables in database',
)
def drop(drop_all=False):
    """ Drop tables in project database
    """

    engine = current_app.extensions['meowth_dbutils'].db.engine
    if current_app.extensions['meowth_dbutils'].metadata.bind is None:
        current_app.extensions['meowth_dbutils'].metadata.bind = engine
    with perform(
        name='dbutils drop',
        before='Dropping all project tables',
        fail='Error occured while droping project tables',
    ):
        current_app.extensions['meowth_dbutils'].metadata.drop_all()
    with perform(
        name='dbutils drop',
        before='Dropping alembic versioning table',
        fail='Error occured while dropping alembic table',
    ):
        engine.execute('drop table if exists alembic_version')
    if drop_all:
        with perform(
            name='dbutils drop',
            before='Dropping all other tables in database',
            fail='Error occured while dropping other tables',
        ):
            current_app.extensions['meowth_dbutils'].db.reflect()
            current_app.extensions['meowth_dbutils'].db.drop_all()


@DBUtilsCommand.option(
    '-p', '--populate',
    dest='populate_after_init',
    action='store_true',
    default=False,
    help='Populate fixtures after creating database',
)
@DBUtilsCommand.option(
    '-d', '--directory',
    dest='directory',
    default=None,
    help='Directory to search fixtures in',
)
@DBUtilsCommand.option(
    '--drop_all',
    dest='drop_all',
    action='store_true',
    default=False,
    help='Drop ALL tables in database',
)
def init(
    populate_after_init=False,
    directory=None,
    drop_all=False,
):
    """ Create a new clean database
    """

    drop(drop_all=drop_all)
    with perform(
        name='dbutils init',
        before='initializing database to its latest version',
    ):
        migrate_upgrade()
    if populate_after_init:
        populate(directory)
