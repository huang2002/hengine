import { Body, BodyOptions } from "../physics/Body";
import { Renderable } from "../renderer/Renderer";
import { EMPTY_OBJECT, _assign, _null } from "../utils/refs";
import { Sprite } from "./Sprite";
import { RenderingStyle, CommonStyle } from "./CommonStyle";

export interface ShapeStyle extends CommonStyle {
    fillStyle: RenderingStyle | null;
    strokeStyle: RenderingStyle | null;
    lineWidth: number;
    lineCap: CanvasLineCap;
    lineJoin: CanvasLineJoin;
    miterLimit: number;
    lineDash: number[] | null;
    lineDashOffset: number;
}

export const applyShapeStyle = (context: CanvasRenderingContext2D, shapeStyle: ShapeStyle) => {
    const { fillStyle } = shapeStyle;
    CommonStyle.apply(context, shapeStyle);
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
};

export type ShapeOptions = BodyOptions & Partial<{
    style: Partial<ShapeStyle>;
    visible: boolean;
    fillFirst: boolean;
    closePath: boolean;
    isCircle: boolean;
    sprite: Sprite | null;
}>;

export abstract class Shape extends Body implements Required<ShapeOptions>, Renderable {

    static defaults: ShapeOptions = {
        visible: true,
        fillFirst: true,
        closePath: true,
        isCircle: false,
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

    constructor(options: Readonly<ShapeOptions> = EMPTY_OBJECT) {
        super(_assign({}, Shape.defaults, options));
        this.style = _assign({}, Shape.defaultStyle, options.style);
    }

    style!: ShapeStyle;
    visible!: boolean;
    fillFirst!: boolean;
    closePath!: boolean;
    isCircle!: boolean;
    sprite: Sprite | null = _null;

    abstract path(context: CanvasRenderingContext2D): void;

    render(context: CanvasRenderingContext2D) {

        if (!this.visible) {
            return;
        }

        const { style, fillFirst, position, sprite } = this,
            { fillStyle } = style;

        context.translate(position.x, position.y);

        if (sprite) {
            return sprite.render(context);
        }

        applyShapeStyle(context, style);

        context.beginPath();
        this.path(context);
        if (this.closePath) {
            context.closePath();
        }

        if (fillFirst && fillStyle) {
            context.fill();
        }
        if (style.strokeStyle) {
            context.stroke();
        }
        if (!fillFirst && fillStyle) {
            context.fill();
        }

    }

}
