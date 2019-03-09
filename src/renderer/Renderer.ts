import { EMPTY_OBJECT, _document, _assign, _window, _undefined } from "../utils/refs";
import { SizingFunction, Sizing } from "./Sizing";
import { Vector } from "../geometry/index";
import { debounce } from "../utils/common";

export interface Renderable {
    position: Vector;
    render(context: CanvasRenderingContext2D): void;
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
}>;

export class Renderer implements Required<RendererOptions>{

    static Defaults: RendererOptions = {
        settings: EMPTY_OBJECT,
        width: 960,
        height: 640,
        margin: 10,
        ratio: _window.devicePixelRatio || 1,
        origin: Vector.of(.5, .5),
        parent: _document.body,
        align: true,
        sizing: Sizing.Fixed,
        resizeEvents: ['resize', 'orientationchange'],
        resizeDelay: 100,
    };

    constructor(options: Readonly<RendererOptions> = EMPTY_OBJECT) {
        _assign(this, options);

        let { canvas } = this;
        if (!canvas) {
            canvas = this.canvas || (this.canvas = _document.createElement('canvas'));
        } else {
            if (canvas.parentNode) {
                this.parent = canvas.parentElement;
            } else if (this.parent) {
                this.parent.appendChild(canvas);
            }
        }

        this.context = canvas.getContext('2d', options.settings)!;

        const { resizeListener } = this;
        this.resizeEvents.forEach(event => {
            _window.addEventListener(event, resizeListener);
        });

        this._resize();

    }

    readonly canvas!: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    readonly settings: CanvasRenderingContext2DSettings = EMPTY_OBJECT;
    readonly parent!: Element | null;
    readonly resizeEvents!: string[];
    readonly top!: number;
    readonly right!: number;
    readonly bottom!: number;
    readonly left!: number;
    readonly resizeListener = debounce(this._resize.bind(this));

    width!: number;
    height!: number;
    margin!: number;
    ratio!: number;
    origin!: Vector;

    align!: boolean;
    sizing!: SizingFunction;

    set resizeDelay(delay: number) {
        this.resizeListener.delay = delay;
    }

    private _resize() {

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
                width = this.width = size.width;
                height = this.height = size.height;
                styleWidth = size.styleWidth;
                styleHeight = size.styleHeight;
            }
        }

        canvas.width = width * ratio;
        canvas.height = height * ratio;
        style.width = styleWidth + 'px';
        style.height = styleHeight + 'px';

        const originOffsetX = width * origin.x,
            originOffsetY = height * origin.y;

        this.context.setTransform(1, 0, originOffsetX, 0, 1, originOffsetY);
        (this.top as number) = -originOffsetY;
        (this.right as number) = width - originOffsetX;
        (this.bottom as number) = height - originOffsetY;
        (this.left as number) = -originOffsetX;

    }

    resize(width: number, height: number, ratio?: number) {
        this.width = width;
        this.height = height;
        if (ratio) {
            this.ratio = ratio;
        }
        this._resize();
        return this;
    }

    render(renderable: Renderable) {
        const { context } = this,
            { position } = renderable;
        context.translate(position.x, position.y);
        renderable.render(context);
        context.translate(-position.x, -position.y);
    }

}
