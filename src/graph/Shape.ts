import { Body, BodyOptions } from "../physics/Body";
import { Renderable, RendererLike } from "../renderer/Renderer";
import { _assign, _null } from "../common/references";
import { Style, StrokeStyle, CommonStyle, FillStyle } from "./Style";
import { Utils } from "../common/Utils";

export type ShapeStyle = CommonStyle & StrokeStyle & FillStyle;

export type ShapeOptions = BodyOptions & Partial<{
    style: Partial<ShapeStyle>;
    visible: boolean;
    fillFirst: boolean;
    closePath: boolean;
    preferShadow: boolean;
    texture: Renderable | null;
    attachments: Renderable[];
}>;

export abstract class Shape extends Body implements Required<ShapeOptions>, Renderable {

    static defaults: ShapeOptions = {
        visible: true,
        fillFirst: true,
        closePath: true,
        preferShadow: false,
        texture: _null,
    };

    static defaultStyle: ShapeStyle = _assign(
        {} as ShapeStyle,
        Style.Common.defaults,
        Style.Stroke.defaults,
        { fillStyle: _null } as ShapeStyle
    );

    static applyStyle(renderer: RendererLike, style: ShapeStyle) {
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
    preferShadow!: boolean;
    texture!: Renderable | null;
    attachments!: Renderable[];

    abstract path(context: CanvasRenderingContext2D): void;
    abstract updateBounds(): void;

    render(renderer: RendererLike) {

        if (!this.visible) {
            return;
        }

        const { style, fillFirst, position, texture, attachments } = this,
            { fillStyle } = style,
            { context } = renderer,
            { TRANSPARENT } = Utils.Const;

        context.translate(position.x, position.y);

        if (texture) {
            const { rotation } = this;
            context.rotate(rotation);
            texture.render(renderer);
            context.rotate(-rotation);
        } else {
            if (this.preferShadow && !style.shadowBlur && style.shadowColor !== TRANSPARENT) {
                context.shadowColor = TRANSPARENT;
                const { shadowOffsetX, shadowOffsetY } = style;
                context.translate(shadowOffsetX, shadowOffsetY);
                context.beginPath();
                this.path(context);
                if (this.closePath) {
                    context.closePath();
                }
                context.fillStyle = style.shadowColor;
                context.fill();
                context.translate(-shadowOffsetX, -shadowOffsetY);
                if (fillStyle) {
                    context.fillStyle = fillStyle;
                }
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
            if (attachments.length) {
                attachments.forEach(attachment => {
                    attachment.render(renderer);
                });
            }
        }

        context.translate(-position.x, -position.y);

    }

}
