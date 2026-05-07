from comfy_api.latest import io
from ..utils import mk_name, mk_category, Endpoint
import math
from aiohttp import web
from comfy import model_management
import torch

PACKAGE_NAME = "AspectRatios"
CATEGORY = mk_category(PACKAGE_NAME)

ASPECT_RATIOS_PRESETS = [
    "none", 
    "[landscape] 3:1", 
    "[landscape] 7:4", 
    "[landscape] 19:13", 
    "[landscape] 3:2", 
    "[landscape] 7:5", 
    "[landscape] 9:7", 
    "[landscape] 4:3", 
    "[square] 1:1", 
    "[portrait] 3:4", 
    "[portrait] 7:9", 
    "[portrait] 5:7", 
    "[portrait] 2:3", 
    "[portrait] 13:19", 
    "[portrait] 4:7", 
    "[portrait] 1:3", 
]


class AspectRatios(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(
            node_id=mk_name(PACKAGE_NAME, "AspectRatios"), 
            display_name="Aspect Ratios", 
            category=CATEGORY, 
            inputs=[
                io.Int.Input("base", default=1024, min=64, step=8), 
                io.Combo.Input("fixed_side", options=["none", "short", "long"]), 
                io.Int.Input("step", default=8, min=8, step=8), 
                io.Int.Input("aspect_w", default=1, min=1), 
                io.Int.Input("aspect_h", default=1, min=1), 
                io.Combo.Input("preset", options=ASPECT_RATIOS_PRESETS), 
                io.Int.Input("batch_size", default=1, min=1), 
            ], 
            outputs=[
                io.Latent.Output(display_name="latent"), 
                io.Int.Output(display_name="width"), 
                io.Int.Output(display_name="height"), 
            ], 
        )
    
    @classmethod
    def execute(cls, **kwargs):
        width, height = calc_resolution(**kwargs)
        device = model_management.intermediate_device()
        batch_size = kwargs.get("batch_size", 1)
        latent = torch.zeros([batch_size, 4, height // 8, width // 8], device=device)
        latent = {"samples": latent}
        
        return io.NodeOutput(latent, width, height)
    



def calc_resolution(base=1024, fixed_side="none", step=8, aspect_w=1, aspect_h=1, **kwargs):
    step = int(step)
    aspect_w = int(aspect_w)
    aspect_h = int(aspect_h)
    aspect_ratio = aspect_w / aspect_h

    if fixed_side == "none":
        area = base ** 2
        width = math.sqrt(area * aspect_ratio)
        height = width / aspect_ratio
    
    else:
        is_short = (fixed_side == "short")
        is_portrait = aspect_w <= aspect_h

        if (is_short and is_portrait) or (not is_short and not is_portrait):
            width = base
            height = base * aspect_h / aspect_w
        else:
            height = base
            width = base * aspect_w / aspect_h
    
    # stepで丸める
    step_w = math.lcm(step, aspect_w) if fixed_side == "none" else step
    step_h = math.lcm(step, aspect_h) if fixed_side == "none" else step
    width = int(width // step_w * step_w)
    height = int(height // step_h * step_h)

    return width, height



@Endpoint.post(PACKAGE_NAME, "calc")
async def endpoint_calc(req: web.Request):
    data = await req.json()

    base = data.get("base")
    fixed_side = data.get("fixedSide")
    step = data.get("step")
    aspect_w = data.get("aspectW")
    aspect_h = data.get("aspectH")

    width, height = calc_resolution(base, fixed_side, step, aspect_w, aspect_h)
    
    return web.json_response({"width": width, "height": height})


@Endpoint.post(PACKAGE_NAME, "preset")
async def endpoint_preset(req: web.Request):
    data = await req.json()

    preset = data.get("preset")

    if preset == "none":
        aspect_w, aspect_h = None, None
    else:
        ratio_part = preset.split("]")[-1].strip()
        aspect_w, aspect_h = map(int, ratio_part.split(":"))
    
    return web.json_response({"aspectW": aspect_w, "aspectH": aspect_h})


nodes = [
    AspectRatios, 
]