import logging
import os
from project.application import create_app

app = create_app()


if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
    logging.info(app.url_map)

if __name__ == "__main__":
    app.run()
