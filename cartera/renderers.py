import json

from rest_framework.renderers import JSONRenderer


class PrettyJSONRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        return json.dumps(data, indent=2, ensure_ascii=False).encode("utf-8")
