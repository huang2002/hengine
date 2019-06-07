export type SizingResult = Readonly<{
    width: number;
    height: number;
    styleWidth: number;
    styleHeight: number;
    left: number;
    top: number;
    scale: number;
}>;

export type SizingFunction = (
    innerWidth: number, innerHeight: number,
    outerWidth: number, outerHeight: number,
    margin: number
) => SizingResult;

export interface SizingObject {
    readonly Full: SizingFunction;
    readonly Center: SizingFunction;
    readonly Fit: SizingFunction;
    readonly FixedWidth: SizingFunction;
    readonly FixedHeight: SizingFunction;
    readonly Fixed: SizingFunction;
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
            top: margin,
            scale: 1
        };
    },

    Center: (innerWidth, innerHeight, outerWidth, outerHeight, margin) => ({
        width: innerWidth,
        height: innerHeight,
        styleWidth: innerWidth,
        styleHeight: innerHeight,
        left: (outerWidth - innerWidth) / 2,
        top: (outerHeight - innerHeight) / 2,
        scale: 1
    }),

    Fit: (innerWidth, innerHeight, outerWidth, outerHeight, margin) => {
        const scale = outerWidth / outerHeight > innerWidth / innerHeight ?
            (outerHeight - margin * 2) / innerHeight :
            (outerWidth - margin * 2) / innerWidth,
            width = innerWidth * scale,
            height = innerHeight * scale;
        return {
            width: innerWidth,
            height: innerHeight,
            styleWidth: width,
            styleHeight: height,
            left: (outerWidth - width) / 2,
            top: (outerHeight - height) / 2,
            scale
        };
    },

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
            top: margin,
            scale
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
            top: margin,
            scale
        };
    },

    Fixed: (innerWidth, innerHeight, outerWidth, outerHeight, margin) => (
        (
            outerWidth / outerHeight > innerWidth / innerHeight ?
                Sizing.FixedHeight :
                Sizing.FixedWidth
        )(
            innerWidth, innerHeight, outerWidth, outerHeight, margin
        )
    ),

};
