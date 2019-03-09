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

export const Sizing: {
    Full: SizingFunction;
    Center: SizingFunction;
    FixedWidth: SizingFunction;
    FixedHeight: SizingFunction;
    Fixed: SizingFunction;
} = {

    Full: (innerWidth, innerHeight, outerWidth, outerHeight, margin) => {
        const dbMargin = margin * 2,
            width = outerWidth - dbMargin,
            height = outerHeight - dbMargin;
        return {
            width,
            height,
            styleWidth: width,
            styleHeight: height,
            left: margin,
            top: margin
        };
    },

    Center: (innerWidth, innerHeight, outerWidth, outerHeight, margin) => {
        return {
            width: innerWidth,
            height: innerHeight,
            styleWidth: innerWidth,
            styleHeight: innerHeight,
            left: (outerWidth - innerWidth) / 2,
            top: (outerHeight - innerHeight) / 2
        };
    },

    FixedWidth: (innerWidth, innerHeight, outerWidth, outerHeight, margin) => {
        const dbMargin = margin * 2,
            styleWidth = outerWidth - dbMargin,
            styleHeight = outerHeight - dbMargin,
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
        const dbMargin = margin * 2,
            styleWidth = outerWidth - dbMargin,
            styleHeight = outerHeight - dbMargin,
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

    Fixed: (innerWidth, innerHeight, outerWidth, outerHeight, margin) => {
        return (
            outerWidth / innerWidth > outerHeight / innerHeight ?
                Sizing.FixedHeight :
                Sizing.FixedWidth
        )(
            innerWidth, innerHeight, outerWidth, outerHeight, margin
        );
    },

};
