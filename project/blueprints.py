from flask import Blueprint


def _factory(bp_name, url_prefix):
    import_name = 'project.{}.views'.format(bp_name)
    template_folder = 'templates'
    blueprint = Blueprint(
        bp_name,
        import_name,
        template_folder=template_folder,
        url_prefix=url_prefix,
    )
    return blueprint

questionnaire_app = _factory("questionnaire", '')

all_blueprints = (
    questionnaire_app,
)
