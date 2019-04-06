import { _document, _assign, _window, _undefined } from "../utils/references";
import { SizingFunction, Sizing } from "./Sizing";
import { Vector } from "../geometry/Vector";
import { EMPTY_OBJECT, debounce } from "../utils/Common";

export interface Renderable {
    update?(timeScale: number): void;
    render(renderer: Renderer): void;
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

export class Renderer implements Required<RendererOptions>{

    static defaults: RendererOptions = {
        settings: EMPTY_OBJECT,
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

    constructor(options: Readonly<RendererOptions> = EMPTY_OBJECT) {
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

    restoration!: boolean;

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

        this.context.setTransform(ratio, 0, 0, ratio, originOffsetX * ratio, originOffsetY * ratio);
        (this.top as number) = -originOffsetY;
        (this.right as number) = -originOffsetX + width;
        (this.bottom as number) = -originOffsetY + height;
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
        const { context, restoration } = this;
        if (restoration) {
            context.save();
        }
        renderable.render(this);
        if (restoration) {
            context.restore();
        }
    }

}
