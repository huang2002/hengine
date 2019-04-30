import { Body, BodyOptions } from "../physics/Body";
import { Renderable, Renderer } from "../renderer/Renderer";
import { _assign, _null } from "../common/references";
import { Style, StrokeStyle, CommonStyle, FillStyle } from "./Style";
import { Utils } from "../common/Utils";


export type ShapeStyle = CommonStyle & StrokeStyle & FillStyle;

export type ShapeOptions = BodyOptions & Partial<{
    style: Partial<ShapeStyle>;
    visible: boolean;
    fillFirst: boolean;
    closePath: boolean;
    texture: Renderable | null;
    attachments: Renderable[];
}>;

export abstract class Shape extends Body implements Required<ShapeOptions>, Renderable {

    static defaults: ShapeOptions = {
        visible: true,
        fillFirst: true,
        closePath: true,
        texture: _null,
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

    constructor(options: Readonly<ShapeOptions> = Utils.Const.EMPTY_OBJECT) {
        super(_assign({}, Shape.defaults, options));

        this.style = _assign({}, Shape.defaultStyle, this.style);
        if (!this.attachments) {
            this.attachments = [];
        }

    }

    style!: ShapeStyle;
    visible!: boolean;
    fillFirst!: boolean;
    closePath!: boolean;
    texture!: Renderable | null;
    attachments!: Renderable[];

    abstract path(context: CanvasRenderingContext2D): void;
    abstract updateBounds(): void;

    render(renderer: Renderer) {

        if (!this.visible) {
            return;
        }

        const { style, fillFirst, position, texture, attachments } = this,
            { fillStyle } = style,
            { context } = renderer;

        context.translate(position.x, position.y);

        if (texture) {
            return texture.render(renderer);
        }

        Shape.applyStyle(renderer, style);

        context.beginPath();
        this.path(context);
        if (this.closePath) {
            context.closePath();
        }

        if (fillFirst && fillStyle) {
            context.fill();
            context.shadowColor = Utils.Const.TRANSPARENT;
        }
        if (style.strokeStyle) {
            context.stroke();
            context.shadowColor = Utils.Const.TRANSPARENT;
        }
        if (!fillFirst && fillStyle) {
            context.fill();
        }

        if (attachments.length) {
            attachments.forEach(attachment => {
                attachment.render(renderer);
            });
        }

        context.translate(-position.x, -position.y);

    }

}
