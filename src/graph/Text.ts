import { Renderable, RendererLike } from "../renderer/Renderer";
import { Vector } from "../geometry/Vector";
import { ShapeStyle, Shape } from "./Shape";
import { Utils } from "../common/Utils";

export type TextStyle = ShapeStyle & CanvasTextDrawingStyles;

export type TextOptions = Partial<{
    visible: boolean;
    content: string;
    fillFirst: boolean;
    preferShadow: boolean;
    position: Vector;
    rotation: number;
    style: Partial<TextStyle>;
}>;

export class Text implements Required<TextOptions>, Renderable {

    static defaults: TextOptions = {
        visible: true,
        content: '',
        preferShadow: false,
        rotation: 0,
    };

    static defaultStyle: TextStyle = Object.assign({} as TextStyle, Shape.defaultStyle, {
        font: '16px Consolas',
        textAlign: 'center',
        textBaseline: 'middle',
        direction: 'inherit',
    } as TextStyle);

    static applyStyle(renderer: RendererLike, textStyle: TextStyle) {
        Shape.applyStyle(renderer, textStyle);
        const { context } = renderer;
        context.font = textStyle.font;
        context.textAlign = textStyle.textAlign;
        context.textBaseline = textStyle.textBaseline;
        context.direction = textStyle.direction;
    }

    constructor(options?: Readonly<TextOptions>) {
        Object.assign(this, Text.defaults, options);

        if (!this.position) {
            this.position = new Vector();
        }

        this.style = Object.assign({}, Text.defaultStyle, this.style);

    }

    visible!: boolean;
    content!: string;
    fillFirst!: boolean;
    preferShadow!: boolean;
    position!: Vector;
    rotation!: number;
    style!: TextStyle;

    render(renderer: RendererLike) {
        const { style, fillFirst, content, position, rotation } = this,
            { x, y } = position,
            { fillStyle } = style,
            { context } = renderer,
            { TRANSPARENT } = Utils.Const;
        Text.applyStyle(renderer, style);
        context.translate(x, y);
        context.rotate(rotation);
        if (this.preferShadow && !style.shadowBlur && style.shadowColor !== TRANSPARENT) {
            context.shadowColor = TRANSPARENT;
            context.fillStyle = style.shadowColor;
            context.fillText(content, style.shadowOffsetX, style.shadowOffsetY);
            if (fillStyle) {
                context.fillStyle = fillStyle;
            }
        }
        if (fillFirst && fillStyle) {
            context.fillText(content, 0, 0);
            context.shadowColor = TRANSPARENT;
        }
        if (style.strokeStyle) {
            context.strokeText(content, 0, 0);
            context.shadowColor = TRANSPARENT;
        }
        if (!fillFirst && fillStyle) {
            context.fillText(content, 0, 0);
        }
        context.rotate(-rotation);
        context.translate(-x, -y);
    }

}
