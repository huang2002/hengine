import { Body, BodyOptions } from "../physics/Body";
import { Renderable } from "../renderer/index";
import { EMPTY_OBJECT, _assign, _null } from "../utils/refs";

export type RenderingStyle = string | CanvasGradient | CanvasPattern;

export interface ShapeStyle {
    fillStyle: RenderingStyle | null;
    strokeStyle: RenderingStyle | null;
    lineWidth: number;
    lineCap: CanvasLineCap;
    lineJoin: CanvasLineJoin;
    miterLimit: number;
    lineDash: number[] | null;
    lineDashOffset: number;
    shadowColor: string | null;
    shadowBlur: number;
    shadowOffsetX: number;
    shadowOffsetY: number;
    opacity: number;
}

export type ShapeOptions = BodyOptions & Partial<{
    style: Partial<ShapeStyle>;
    visible: boolean;
    fillFirst: boolean;
}>;

export abstract class Shape extends Body implements Renderable, Required<ShapeOptions> {

    static Defaults: ShapeOptions = {
        style: {
            fillStyle: _null,
            strokeStyle: '#000',
            lineWidth: 1,
            lineCap: 'butt',
            lineJoin: 'miter',
            miterLimit: 10,
            lineDash: _null,
            lineDashOffset: 0,
            shadowColor: null,
            shadowBlur: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            opacity: 1,
        } as ShapeStyle,
        visible: true,
        fillFirst: true
    };

    constructor(options: Readonly<ShapeOptions> = EMPTY_OBJECT) {
        super(_assign({}, Shape.Defaults, options));
        this.style = _assign({}, Shape.Defaults.style, options.style) as ShapeStyle;
    }

    style!: ShapeStyle;
    fillFirst!: boolean;
    visible!: boolean;

    abstract path(context: CanvasRenderingContext2D): void;

    render(context: CanvasRenderingContext2D) {

        if (!this.visible) {
            return;
        }

        const { style, fillFirst } = this,
            { fillStyle } = style;

        context.save();

        context.globalAlpha = style.opacity;
        if (style.shadowColor) {
            context.shadowColor = style.shadowColor;
            context.shadowBlur = style.shadowBlur;
            context.shadowOffsetX = style.shadowOffsetX;
            context.shadowOffsetY = style.shadowOffsetY;
        }

        this.path(context);

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

        context.restore();

    }

}
