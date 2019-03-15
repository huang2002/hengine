export type RenderingStyle = string | CanvasGradient | CanvasPattern;

export interface CommonStyle {
    shadowColor: string | null;
    shadowBlur: number;
    shadowOffsetX: number;
    shadowOffsetY: number;
    opacity: number;
}

export const DefaultStyle: CommonStyle = {
    shadowColor: null,
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    opacity: 1,
};
