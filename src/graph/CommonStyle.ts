import { _null } from "../utils/references";

export type RenderingStyle = string | CanvasGradient | CanvasPattern;

export interface CommonStyle {
    shadowColor: string | null;
    shadowBlur: number;
    shadowOffsetX: number;
    shadowOffsetY: number;
    opacity: number;
}

export interface CommonStyleObject {
    defaults: CommonStyle;
    apply(context: CanvasRenderingContext2D, commonStyle: CommonStyle): void;
}

export const CommonStyle: CommonStyleObject = {

    defaults: {
        shadowColor: _null,
        shadowBlur: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        opacity: 1,
    },

    apply(context, commonStyle) {
        context.globalAlpha = commonStyle.opacity;
        if (commonStyle.shadowColor) {
            context.shadowColor = commonStyle.shadowColor;
            context.shadowBlur = commonStyle.shadowBlur;
            context.shadowOffsetX = commonStyle.shadowOffsetX;
            context.shadowOffsetY = commonStyle.shadowOffsetY;
        }
    },

};
