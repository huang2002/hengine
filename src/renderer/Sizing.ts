export type SizingResult = Readonly<{
    width: number;
    height: number;
    styleWidth: number;
    styleHeight: number;
    left: number;
    top: number;
}>;

export type SizingFunction = (
    innerWidth: number, innerHeight: number,
    outerWidth: number, outerHeight: number,
    margin: number
) => SizingResult;

export interface SizingObject {
    Full: SizingFunction;
    Center: SizingFunction;
    FixedWidth: SizingFunction;
    FixedHeight: SizingFunction;
    Fixed: SizingFunction;
}

export const Sizing: SizingObject = {

    Full: (innerWidth, innerHeight, outerWidth, outerHeight, margin) => {
        const doubleMargin = margin * 2,
            width = outerWidth - doubleMargin,
            height = outerHeight - doubleMargin;
        return {
            width,
            height,
            styleWidth: width,
            styleHeight: height,
            left: margin,
            top: margin
        };
    },

    Center: (innerWidth, innerHeight, outerWidth, outerHeight, margin) => ({
        width: innerWidth,
        height: innerHeight,
        styleWidth: innerWidth,
        styleHeight: innerHeight,
        left: (outerWidth - innerWidth) / 2,
        top: (outerHeight - innerHeight) / 2
    }),

    FixedWidth: (innerWidth, innerHeight, outerWidth, outerHeight, margin) => {
        const doubleMargin = margin * 2,
            styleWidth = outerWidth - doubleMargin,
            styleHeight = outerHeight - doubleMargin,
            scale = styleWidth / innerWidth;
        return {
            width: innerWidth,
            height: styleHeight / scale,
            styleWidth,
            styleHeight,
            left: margin,
            top: margin
        };
    },

    FixedHeight: (innerWidth, innerHeight, outerWidth, outerHeight, margin) => {
        const doubleMargin = margin * 2,
            styleWidth = outerWidth - doubleMargin,
            styleHeight = outerHeight - doubleMargin,
            scale = styleHeight / innerHeight;
        return {
            width: styleWidth / scale,
            height: innerHeight,
            styleWidth,
            styleHeight,
            left: margin,
            top: margin
        };
    },

    Fixed: (innerWidth, innerHeight, outerWidth, outerHeight, margin) => ((
        outerWidth / innerWidth > outerHeight / innerHeight ?
            Sizing.FixedHeight :
            Sizing.FixedWidth
    )(innerWidth, innerHeight, outerWidth, outerHeight, margin)),

};
