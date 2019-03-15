import { Body, BodyOptions } from "../physics/Body";
import { Renderable } from "../renderer/Renderer";
import { EMPTY_OBJECT, _assign, _null } from "../utils/refs";
import { Sprite } from "./Sprite";
import { RenderingStyle, CommonStyle, DefaultStyle } from "./CommonStyle";

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

export type ShapeOptions = BodyOptions & Partial<{
    style: Partial<ShapeStyle>;
    visible: boolean;
    fillFirst: boolean;
    closePath: boolean;
    isCircle: boolean;
    sprite: Sprite | null;
}>;

export abstract class Shape extends Body implements Renderable, Required<ShapeOptions> {

    static Defaults: ShapeOptions = {
        visible: true,
        fillFirst: true,
        closePath: true,
        isCircle: false,
    };

    static DefaultStyle: ShapeStyle = _assign({} as ShapeStyle, DefaultStyle, {
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
        super(_assign({}, Shape.Defaults, options));
        this.style = _assign({}, Shape.DefaultStyle, options.style);
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

        const { style, fillFirst, position } = this,
            { fillStyle } = style;

        context.translate(position.x, position.y);

        context.globalAlpha = style.opacity;

        if (style.shadowColor) {
            context.shadowColor = style.shadowColor;
            context.shadowBlur = style.shadowBlur;
            context.shadowOffsetX = style.shadowOffsetX;
            context.shadowOffsetY = style.shadowOffsetY;
        }

        context.beginPath();
        this.path(context);
        if (this.closePath) {
            context.closePath();
        }

        if (fillStyle) {
            context.fillStyle = fillStyle;
            if (fillFirst) {
                context.fill();
            }
        }
        if (style.strokeStyle) {
            context.strokeStyle = style.strokeStyle;
            context.lineWidth = style.lineWidth;
            context.lineCap = style.lineCap;
            context.lineJoin = style.lineJoin;
            if (style.lineDash) {
                context.setLineDash(style.lineDash);
                context.lineDashOffset = style.lineDashOffset;
            }
            context.stroke();
        }
        if (!fillFirst && fillStyle) {
            context.fill();
        }

    }

}
