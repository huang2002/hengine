export type RenderingStyle = string | CanvasGradient | CanvasPattern;

export interface CommonStyle {
    shadowColor: string | null;
    shadowBlur: number;
    shadowOffsetX: number;
    shadowOffsetY: number;
    opacity: number;
}

export const commonStyle: CommonStyle = {
    shadowColor: null,
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    opacity: 1,
};

export const applyCommonStyle = (context: CanvasRenderingContext2D, commonStyle: CommonStyle) => {
    context.globalAlpha = commonStyle.opacity;
    if (commonStyle.shadowColor) {
        context.shadowColor = commonStyle.shadowColor;
        context.shadowBlur = commonStyle.shadowBlur;
        context.shadowOffsetX = commonStyle.shadowOffsetX;
        context.shadowOffsetY = commonStyle.shadowOffsetY;
    }
};
