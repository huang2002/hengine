import { _null } from "../utils/references";
import { TRANSPARENT } from "../utils/common";

export type RenderingStyle = string | CanvasGradient | CanvasPattern;

export type CommonStyle = CanvasShadowStyles & {
    opacity: number;
};

export interface CommonStyleObject {
    defaults: CommonStyle;
    apply(context: CanvasRenderingContext2D, commonStyle: CommonStyle): void;
}

export const CommonStyle: CommonStyleObject = {

    defaults: {
        shadowColor: TRANSPARENT,
        shadowBlur: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        opacity: 1,
    },

    apply(context, commonStyle) {
        context.globalAlpha = commonStyle.opacity;
        context.shadowColor = commonStyle.shadowColor;
        context.shadowBlur = commonStyle.shadowBlur;
        context.shadowOffsetX = commonStyle.shadowOffsetX;
        context.shadowOffsetY = commonStyle.shadowOffsetY;
    },

};
