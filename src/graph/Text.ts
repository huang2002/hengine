import { _assign } from "../common/references";
import { Renderable, Renderer } from "../renderer/Renderer";
import { Vector } from "../geometry/Vector";
import { ShapeStyle, Shape } from "./Shape";
import { Utils } from "../common/Utils";

export type TextStyle = ShapeStyle & CanvasTextDrawingStyles;

export type TextOptions = Partial<{
    visible: boolean;
    content: string;
    fillFirst: boolean;
    position: Vector;
    style: Partial<TextStyle>;
}>;

export class Text implements Required<TextOptions>, Renderable {

    static defaults: TextOptions = {
        visible: true,
        content: '',
    };

    static defaultStyle: TextStyle = _assign({} as TextStyle, Shape.defaultStyle, {
        font: '16px Consolas',
        textAlign: 'center',
        textBaseline: 'middle',
        direction: 'inherit',
    } as TextStyle);

    static applyStyle(renderer: Renderer, textStyle: TextStyle) {
        Shape.applyStyle(renderer, textStyle);
        const { context } = renderer;
        context.font = textStyle.font;
        context.textAlign = textStyle.textAlign;
        context.textBaseline = textStyle.textBaseline;
        context.direction = textStyle.direction;
    }

    constructor(options: TextOptions = Utils.EMPTY_OBJECT) {
        _assign(this, Text.defaults, options);

        if (!options.position) {
            this.position = new Vector();
        }

        this.style = _assign({}, Text.defaultStyle, options.style);

    }

    visible!: boolean;
    content!: string;
    fillFirst!: boolean;
    position!: Vector;
    style!: TextStyle;

    render(renderer: Renderer) {
        const { style, fillFirst, content, position } = this,
            { fillStyle } = style,
            { context } = renderer;
        Text.applyStyle(renderer, style);
        if (fillFirst && fillStyle) {
            context.fillText(content, position.x, position.y);
            context.shadowColor = Utils.TRANSPARENT;
        }
        if (style.strokeStyle) {
            context.strokeText(content, position.x, position.y);
            context.shadowColor = Utils.TRANSPARENT;
        }
        if (!fillFirst && fillStyle) {
            context.fillText(content, position.x, position.y);
        }
    }

}
