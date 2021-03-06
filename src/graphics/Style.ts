import { Utils } from "../common/Utils";
import { RendererLike } from "../renderer/Renderer";

export type RenderingStyle = string | CanvasGradient | CanvasPattern;

export type CommonStyle = CanvasShadowStyles & {
    opacity: number;
};

export interface StrokeStyle {
    strokeStyle: RenderingStyle | null;
    lineWidth: number;
    lineCap: CanvasLineCap;
    lineJoin: CanvasLineJoin;
    miterLimit: number;
    lineDash: number[] | null;
    lineDashOffset: number;
}

export interface FillStyle {
    fillStyle: RenderingStyle | null;
}

export interface SubStyleObject<T> {
    defaults: T;
    apply(renderer: RendererLike, style: T): void;
}

export type StyleObject = Readonly<{
    Common: SubStyleObject<CommonStyle>;
    Stroke: SubStyleObject<StrokeStyle>;
    Fill: SubStyleObject<FillStyle>;
}>;

export const Style: StyleObject = {

    Common: {

        defaults: {
            shadowColor: Utils.Const.TRANSPARENT,
            shadowBlur: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            opacity: 1,
        },

        apply(renderer, style) {
            const { context, ratio } = renderer;
            context.globalAlpha = style.opacity;
            context.shadowColor = style.shadowColor;
            context.shadowBlur = style.shadowBlur * ratio;
            context.shadowOffsetX = style.shadowOffsetX * ratio;
            context.shadowOffsetY = style.shadowOffsetY * ratio;
        },

    },

    Fill: {

        defaults: {
            fillStyle: null,
        },

        apply(renderer, style) {
            if (style.fillStyle) {
                const { context } = renderer;
                context.fillStyle = style.fillStyle;
            }
        }

    },

    Stroke: {

        defaults: {
            strokeStyle: null,
            lineWidth: 1,
            lineCap: 'butt',
            lineJoin: 'miter',
            miterLimit: 10,
            lineDash: null,
            lineDashOffset: 0,
        },

        apply(renderer, style) {
            if (!style.strokeStyle) {
                return;
            }
            const { context } = renderer;
            context.strokeStyle = style.strokeStyle;
            context.lineWidth = style.lineWidth;
            context.lineCap = style.lineCap;
            context.lineJoin = style.lineJoin;
            if (style.lineDash) {
                context.setLineDash(style.lineDash);
                context.lineDashOffset = style.lineDashOffset;
            }
        },

    },

};
