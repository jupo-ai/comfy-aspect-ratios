from functools import wraps
from aiohttp import web
from server import PromptServer

author = "jupo"
packageName = "AspectRatios"

def _name(name: str):
    return f"{author}.{packageName}.{name}"

def _dname(name: str):
    return name.replace(f"{author}.", "").replace(f"{packageName}.", "").replace("_", " ")

def set_default_category(node_class_mappings: dict):
    for cls in node_class_mappings.values():
        if not hasattr(cls, "CATEGORY"):
            setattr(cls, "CATEGORY", f"{author}/{packageName}")


class Endpoint:
    def __init__(self):
        self.routes = PromptServer.instance.routes
    
    def _endpoint(self, part: str):
        return f"/{author}/{packageName}/{part}"
    
    def get(self, path: str):
        """GETリクエスト用デコレータ"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                return func(*args, **kwargs)
            
            self.routes.get(self._endpoint(path))(wrapper)
            return wrapper
        return decorator
    
    def post(self, path: str):
        """POSTリクエスト用デコレータ"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                return func(*args, **kwargs)
            
            self.routes.post(self._endpoint(path))(wrapper)
            return wrapper
        return decorator

endpoint = Endpoint()

