import { Body, BodyOptions } from "../physics/Body";
import { Renderable, Renderer } from "../renderer/Renderer";
import { _assign, _null } from "../utils/references";
import { Sprite } from "./Sprite";
import { Style, StrokeStyle, CommonStyle, FillStyle } from "./Style";
import { EMPTY_OBJECT, TRANSPARENT } from "../utils/Common";


export type ShapeStyle = CommonStyle & StrokeStyle & FillStyle;

export type ShapeOptions = BodyOptions & Partial<{
    style: Partial<ShapeStyle>;
    visible: boolean;
    fillFirst: boolean;
    closePath: boolean;
    sprite: Sprite | null;
}>;

export abstract class Shape extends Body implements Required<ShapeOptions>, Renderable {

    static defaults: ShapeOptions = {
        visible: true,
        fillFirst: true,
        closePath: true,
    };

    static defaultStyle: ShapeStyle = _assign(
        {} as ShapeStyle,
        Style.Common.defaults,
        Style.Stroke.defaults,
        { fillStyle: _null } as ShapeStyle
    );

    static applyStyle(renderer: Renderer, style: ShapeStyle) {
        Style.Common.apply(renderer, style);
        Style.Fill.apply(renderer, style);
        Style.Stroke.apply(renderer, style);
    }

    constructor(options: Readonly<ShapeOptions> = EMPTY_OBJECT) {
        super(_assign({}, Shape.defaults, options));
        this.style = _assign({}, Shape.defaultStyle, options.style);
    }

    style!: ShapeStyle;
    visible!: boolean;
    fillFirst!: boolean;
    closePath!: boolean;
    sprite: Sprite | null = _null;

    abstract path(context: CanvasRenderingContext2D): void;

    render(renderer: Renderer) {

        if (!this.visible) {
            return;
        }

        const { style, fillFirst, position, sprite } = this,
            { fillStyle } = style,
            { context } = renderer;

        context.translate(position.x, position.y);

        if (sprite) {
            return sprite.render(renderer);
        }

        Shape.applyStyle(renderer, style);

        context.beginPath();
        this.path(context);
        if (this.closePath) {
            context.closePath();
        }

        if (fillFirst && fillStyle) {
            context.fill();
            context.shadowColor = TRANSPARENT;
        }
        if (style.strokeStyle) {
            context.stroke();
            context.shadowColor = TRANSPARENT;
        }
        if (!fillFirst && fillStyle) {
            context.fill();
        }

        context.translate(-position.x, -position.y);

    }

}
