import { SizingFunction, Sizing } from "./Sizing";
import { Vector, VectorLike } from "../geometry/Vector";
import { Utils } from "../common/Utils";
import { Bounds } from "../geometry/Bounds";
import { RenderingStyle } from "../graphics/Style";
import { LayerOptions, Layer } from "../graphics/Layer";
import { EventEmitter } from "../common/EventEmitter";

export interface Renderable {
    render(renderer: RendererLike): void;
}

export interface RendererLike {
    readonly canvas: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    readonly ratio: number;
    readonly width: number;
    readonly height: number;
    readonly origin: Vector;
    readonly originX: number;
    readonly originY: number;
    fill(color: RenderingStyle | null): void;
}

export type UIVectorTransform = (renderer: Renderer) => VectorLike;

export type RendererOptions = Partial<{
    canvas: HTMLCanvasElement;
    settings: CanvasRenderingContext2DSettings;
    width: number;
    height: number;
    margin: number;
    ratio: number;
    origin: Vector;
    parent: Element | null;
    align: boolean;
    sizing: SizingFunction;
    resizeEvents: string[];
    resizeDelay: number;
    restoration: boolean;
}>;

export interface RendererEvents {
    resize: [];
}

export class Renderer extends EventEmitter<RendererEvents>
    implements Required<RendererOptions>, RendererLike {

    static defaults: RendererOptions = {
        settings: Utils.Const.EMPTY_OBJECT,
        width: Layer.defaults.width,
        height: Layer.defaults.height,
        margin: 0,
        ratio: Layer.defaults.ratio,
        origin: Layer.defaults.origin,
        parent: document.body,
        align: true,
        sizing: Sizing.Fit,
        resizeEvents: ['resize', 'orientationchange'],
        resizeDelay: 100,
        restoration: false,
    };

    constructor(options: Readonly<RendererOptions> = Utils.Const.EMPTY_OBJECT) {
        super();

        Object.assign(this, Renderer.defaults, options);

        let { canvas } = this;
        if (!canvas) {
            canvas = this.canvas || (this.canvas = document.createElement('canvas'));
        } else if (canvas.parentNode) {
            this.parent = canvas.parentElement;
        }
        if (this.parent) {
            this.parent.appendChild(canvas);
        }

        this.context = canvas.getContext('2d', this.settings)!;

        const { resizeListener } = this;
        this.resizeEvents.forEach(event => {
            window.addEventListener(event, resizeListener);
        });

        this._width = this.width;
        this._height = this.height;
        this._resize();

    }

    readonly canvas!: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    readonly settings: CanvasRenderingContext2DSettings = Utils.Const.EMPTY_OBJECT;
    readonly parent!: Element | null;
    readonly resizeEvents!: string[];
    readonly bounds = new Bounds();
    readonly resizeListener = Utils.debounce(this._resizeListener.bind(this));
    readonly origin!: Vector;
    readonly originX!: number;
    readonly originY!: number;
    readonly width!: number;
    readonly height!: number;
    readonly margin!: number;
    readonly ratio!: number;
    align!: boolean;
    sizing!: SizingFunction;
    restoration!: boolean;
    private _width!: number;
    private _height!: number;
    private _offsetX!: number;
    private _offsetY!: number;
    private _scale!: number;

    set resizeDelay(delay: number) {
        this.resizeListener.delay = delay;
    }
    get resizeDelay() {
        return this.resizeListener.delay;
    }

    private _resize() {

        const { canvas, ratio, origin } = this,
            { style } = canvas;

        const { _width, _height } = this;
        let width = _width,
            height = _height,
            styleWidth = _width,
            styleHeight = _height;

        if (this.align) {
            const { parent } = this;
            if (parent) {
                const rect = parent.getBoundingClientRect(),
                    size = this.sizing(_width, _height, rect.width, rect.height, this.margin);
                style.marginLeft = size.left + 'px';
                style.marginTop = size.top + 'px';
                width = (this.width as number) = size.width;
                height = (this.height as number) = size.height;
                styleWidth = size.styleWidth;
                styleHeight = size.styleHeight;
                this._offsetX = rect.left + size.left;
                this._offsetY = rect.top + size.top;
                this._scale = size.scale;
            }
        } else {
            this._scale = 1;
        }

        style.width = styleWidth + 'px';
        style.height = styleHeight + 'px';
        canvas.width = width * ratio;
        canvas.height = height * ratio;

        const originX = (this.originX as number) = width * origin.x,
            originY = (this.originY as number) = height * origin.y;

        this.context.setTransform(
            ratio, 0,
            0, ratio,
            originX * ratio, originY * ratio
        );

        const { bounds } = this;
        bounds.top = -originY;
        bounds.right = -originX + width;
        bounds.bottom = -originY + height;
        bounds.left = -originX;

        this.emit('resize');

    }

    private _resizeListener() {
        this._resize();
    }

    resize(width: number, height: number, ratio?: number) {
        this._width = (this.width as number) = width;
        this._height = (this.height as number) = height;
        if (ratio) {
            (this.ratio as number) = ratio;
        }
        this._resize();
        return this;
    }

    fill(color: RenderingStyle | null) {
        const { context, bounds } = this,
            { left, top, width, height } = bounds;
        if (color) {
            context.fillStyle = color;
            context.fillRect(left, top, width, height);
        } else {
            context.clearRect(left, top, width, height);
        }
    }

    render(renderable: Renderable) {
        const { context, restoration } = this;
        if (restoration) {
            context.save();
        }
        renderable.render(this);
        if (restoration) {
            context.restore();
        }
    }

    toInnerPosition(position: VectorLike) {
        const { _scale } = this;
        return Vector.of(
            (position.x - this._offsetX) / _scale - this.originX,
            (position.y - this._offsetY) / _scale - this.originY
        );
    }

    toOuterPosition(position: VectorLike) {
        const { _scale } = this;
        return Vector.of(
            (position.x + this.originX) * _scale + this._offsetX,
            (position.y + this.originY) * _scale + this._offsetY,
        );
    }

    createLayer(options?: LayerOptions) {
        const { bounds } = this;
        return new Layer(Object.assign({
            width: bounds.width,
            height: bounds.height,
            ratio: this.ratio,
        }, options));
    }

    createUIVector(transform: UIVectorTransform) {
        const vector = Vector.from(transform(this));
        this.on('resize', () => {
            vector.setVector(transform(this));
        });
        return vector;
    }

}
