import { _null } from "../utils/references";
import { TRANSPARENT } from "../utils/Common";
import { Renderer } from "../renderer/Renderer";

export type RenderingStyle = string | CanvasGradient | CanvasPattern;

export type CommonStyle = CanvasShadowStyles & {
    opacity: number;
};

export interface CommonStyleObject {
    defaults: CommonStyle;
    apply(renderer: Renderer, commonStyle: CommonStyle): void;
}

export const CommonStyle: CommonStyleObject = {

    defaults: {
        shadowColor: TRANSPARENT,
        shadowBlur: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        opacity: 1,
    },

    apply(renderer, commonStyle) {
        const { context, ratio } = renderer;
        context.globalAlpha = commonStyle.opacity;
        context.shadowColor = commonStyle.shadowColor;
        context.shadowBlur = commonStyle.shadowBlur * ratio;
        context.shadowOffsetX = commonStyle.shadowOffsetX * ratio;
        context.shadowOffsetY = commonStyle.shadowOffsetY * ratio;
    },

};
