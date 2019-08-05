import { _assign, _document, _null, _window } from "../common/references";
import { Renderable, RendererLike } from "../renderer/Renderer";
import { Vector } from "../geometry/Vector";
import { SceneObject } from "../core/Scene";
import { RenderingStyle, Style } from "./Style";
import { Utils } from "../common/Utils";

export type LayerOptions = Partial<{
    active: boolean;
    offset: Vector;
    width: number;
    height: number;
    ratio: number;
    origin: Vector;
    background: RenderingStyle | null;
    objects: SceneObject[];
}>;

export class Layer implements Required<LayerOptions>, Renderable, RendererLike {

    static defaults: LayerOptions = {
        active: true,
        width: 480,
        height: 320,
        ratio: Utils.Const.IS_TOUCH_MODE ? _window.devicePixelRatio || 1 : 2,
        origin: Vector.of(.5, .5),
        background: _null,
    };

    constructor(options?: Readonly<LayerOptions>) {
        _assign(this, Layer.defaults, options);

        if (!this.offset) {
            this.offset = new Vector();
        }
        if (this.objects) {
            this.expired = true;
        } else {
            this.expired = false;
            this.objects = [];
        }

        this.resize(this.width, this.height);

    }

    readonly canvas = _document.createElement('canvas');
    readonly context = this.canvas.getContext('2d')!;
    readonly width!: number;
    readonly height!: number;
    readonly ratio!: number;
    readonly originX!: number;
    readonly originY!: number;
    active!: boolean;
    offset!: Vector;
    origin!: Vector;
    background!: RenderingStyle | null;
    objects!: SceneObject[];
    expired: boolean;

    resize(width: number, height: number, ratio?: number) {
        if (ratio) {
            (this.ratio as number) = ratio;
        } else {
            ratio = this.ratio;
        }
        const { canvas, offset, origin } = this,
            originX = (this.originX as number) = width * origin.x,
            originY = (this.originY as number) = height * origin.y;
        canvas.width = ((this.width as number) = width) * ratio;
        canvas.height = ((this.height as number) = height) * ratio;
        this.context.setTransform(
            ratio, 0,
            0, ratio,
            (originX - offset.x) * ratio, (originY - offset.y) * ratio
        );
    }

    cache(immediate?: boolean) {
        if (immediate) {
            this.expired = false;
            this.fill(this.background);
            this.objects.forEach(object => {
                object.render(this);
            });
        } else {
            this.expired = true;
        }
    }

    fill(color: RenderingStyle | null) {
        const { context, originX, originY, width, height } = this;
        if (color) {
            context.fillStyle = color;
            context.fillRect(-originX, -originY, width, height);
        } else {
            context.clearRect(-originX, -originY, width, height);
        }
    }

    update(timeScale: number) {
        if (this.active) {
            this.objects.filter(object => {
                if (object.update) {
                    if (object.defer) {
                        return true;
                    } else {
                        object.update!(timeScale);
                    }
                }
            }).forEach(object => {
                object.update!(timeScale);
            });
        }
        if (this.expired) {
            this.cache(true);
        }
    }

    render(renderer: RendererLike) {
        Style.Common.apply(renderer, Style.Common.defaults);
        const { offset } = this;
        renderer.context.drawImage(
            this.canvas,
            offset.x - this.originX,
            offset.y - this.originY,
            this.width,
            this.height
        );
    }

}
