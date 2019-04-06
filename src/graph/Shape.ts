import { Body, BodyOptions } from "../physics/Body";
import { Renderable, Renderer } from "../renderer/Renderer";
import { _assign, _null } from "../utils/references";
import { Sprite } from "./Sprite";
import { RenderingStyle, CommonStyle, StrokeStyle } from "./CommonStyle";
import { EMPTY_OBJECT, TRANSPARENT } from "../utils/Common";


export interface ShapeStyle extends CommonStyle, StrokeStyle {
    fillStyle: RenderingStyle | null;
}

export type ShapeOptions = BodyOptions & Partial<{
    style: Partial<ShapeStyle>;
    visible: boolean;
    fillFirst: boolean;
    closePath: boolean;
    sprite: Sprite | null;
}>;

export abstract class Shape extends Body implements Required<ShapeOptions>, Renderable {

    static defaults: ShapeOptions = {
        visible: true,
        fillFirst: true,
        closePath: true,
    };

    static defaultStyle: ShapeStyle = _assign({} as ShapeStyle, CommonStyle.defaults, {
        fillStyle: _null,
        strokeStyle: '#000',
        lineWidth: 1,
        lineCap: 'butt',
        lineJoin: 'miter',
        miterLimit: 10,
        lineDash: _null,
        lineDashOffset: 0,
    } as ShapeStyle);

    static applyStyle(renderer: Renderer, shapeStyle: ShapeStyle) {
        const { context } = renderer,
            { fillStyle } = shapeStyle;
        CommonStyle.apply(renderer, shapeStyle);
        if (fillStyle) {
            context.fillStyle = fillStyle;
        }
        if (shapeStyle.strokeStyle) {
            context.strokeStyle = shapeStyle.strokeStyle;
            context.lineWidth = shapeStyle.lineWidth;
            context.lineCap = shapeStyle.lineCap;
            context.lineJoin = shapeStyle.lineJoin;
            if (shapeStyle.lineDash) {
                context.setLineDash(shapeStyle.lineDash);
                context.lineDashOffset = shapeStyle.lineDashOffset;
            }
        }
    }

    constructor(options: Readonly<ShapeOptions> = EMPTY_OBJECT) {
        super(_assign({}, Shape.defaults, options));
        this.style = _assign({}, Shape.defaultStyle, options.style);
    }

    style!: ShapeStyle;
    visible!: boolean;
    fillFirst!: boolean;
    closePath!: boolean;
    sprite: Sprite | null = _null;

    abstract path(context: CanvasRenderingContext2D): void;

    render(renderer: Renderer) {

        if (!this.visible) {
            return;
        }

        const { style, fillFirst, position, sprite } = this,
            { fillStyle } = style,
            { context } = renderer;

        context.translate(position.x, position.y);

        if (sprite) {
            return sprite.render(renderer);
        }

        Shape.applyStyle(renderer, style);

        context.beginPath();
        this.path(context);
        if (this.closePath) {
            context.closePath();
        }

        if (fillFirst && fillStyle) {
            context.fill();
            context.shadowColor = TRANSPARENT;
        }
        if (style.strokeStyle) {
            context.stroke();
            context.shadowColor = TRANSPARENT;
        }
        if (!fillFirst && fillStyle) {
            context.fill();
        }

        context.translate(-position.x, -position.y);

    }

}
