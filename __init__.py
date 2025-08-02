from .py.utils import _name, _dname
from .py import node

NODE_CLASS_MAPPINGS = {
    _name("AspectRatios"): node.AspectRaiots
}

NODE_DISPLAY_NAME_MAPPINGS = {k: _dname(k) for k in NODE_CLASS_MAPPINGS}
WEB_DIRECTORY = "./web"
