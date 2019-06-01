import { _document, _assign, _window, _undefined } from "../common/references";
import { SizingFunction, Sizing } from "./Sizing";
import { Vector, VectorLike } from "../geometry/Vector";
import { Utils } from "../common/Utils";
import { Bounds } from "../geometry/Bounds";
import { RenderingStyle } from "../graph/Style";

export interface Renderable {
    render(renderer: RendererLike): void;
}

export interface RendererLike {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    ratio: number;
    fill(color: RenderingStyle | null): void;
}

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

export class Renderer implements Required<RendererOptions>, RendererLike {

    static defaults: RendererOptions = {
        settings: Utils.Const.EMPTY_OBJECT,
        width: 480,
        height: 320,
        margin: 10,
        ratio: _window.devicePixelRatio || 1,
        origin: Vector.of(.5, .5),
        parent: _document.body,
        align: true,
        sizing: Sizing.Fit,
        resizeEvents: ['resize', 'orientationchange'],
        resizeDelay: 100,
        restoration: false,
    };

    constructor(options: Readonly<RendererOptions> = Utils.Const.EMPTY_OBJECT) {
        _assign(this, Renderer.defaults, options);

        let { canvas } = this;
        if (!canvas) {
            canvas = this.canvas || (this.canvas = _document.createElement('canvas'));
        } else if (canvas.parentNode) {
            this.parent = canvas.parentElement;
        }
        if (this.parent) {
            this.parent.appendChild(canvas);
        }

        this.context = canvas.getContext('2d', this.settings)!;

        const { resizeListener } = this;
        this.resizeEvents.forEach(event => {
            _window.addEventListener(event, resizeListener);
        });

        this._resize(true);

    }

    readonly canvas!: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    readonly settings: CanvasRenderingContext2DSettings = Utils.Const.EMPTY_OBJECT;
    readonly parent!: Element | null;
    readonly resizeEvents!: string[];
    readonly bounds = new Bounds();
    readonly resizeListener = Utils.debounce(this._resizeListener.bind(this));
    width!: number;
    height!: number;
    margin!: number;
    ratio!: number;
    origin!: Vector;
    align!: boolean;
    sizing!: SizingFunction;
    restoration!: boolean;
    private _offsetX!: number;
    private _offsetY!: number;
    private _originOffsetX!: number;
    private _originOffsetY!: number;
    private _scale!: number;

    set resizeDelay(delay: number) {
        this.resizeListener.delay = delay;
    }

    private _resize(force?: boolean) {

        const { canvas, ratio, origin } = this,
            { style } = canvas;

        let { width, height } = this,
            styleWidth = width,
            styleHeight = height;

        if (this.align) {
            const { parent } = this;
            if (parent) {
                const rect = parent.getBoundingClientRect(),
                    size = this.sizing(width, height, rect.width, rect.height, this.margin);
                style.marginLeft = size.left + 'px';
                style.marginTop = size.top + 'px';
                if (force) {
                    width = this.width = size.width;
                    height = this.height = size.height;
                }
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

        if (!force) {
            return;
        }

        canvas.width = width * ratio;
        canvas.height = height * ratio;

        const originOffsetX = this._originOffsetX = width * origin.x,
            originOffsetY = this._originOffsetY = height * origin.y;

        this.context.setTransform(
            ratio, 0,
            0, ratio,
            originOffsetX * ratio, originOffsetY * ratio
        );

        const { bounds } = this;
        bounds.top = -originOffsetY;
        bounds.right = -originOffsetX + width;
        bounds.bottom = -originOffsetY + height;
        bounds.left = -originOffsetX;

    }

    private _resizeListener() {
        this._resize();
    }

    resize(width: number, height: number, ratio?: number) {
        this.width = width;
        this.height = height;
        if (ratio) {
            this.ratio = ratio;
        }
        this._resize(true);
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

    outer2inner(position: VectorLike) {
        const { _scale } = this;
        return Vector.of(
            (position.x - this._offsetX) / _scale - this._originOffsetX,
            (position.y - this._offsetY) / _scale - this._originOffsetY
        );
    }

    inner2outer(position: VectorLike) {
        const { _scale } = this;
        return Vector.of(
            (position.x + this._originOffsetX) * _scale + this._offsetX,
            (position.y + this._originOffsetY) * _scale + this._offsetY,
        );
    }

}
