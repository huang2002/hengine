import { _assign, EMPTY_OBJECT } from "../utils/references";
import { Renderable } from "../renderer/Renderer";
import { Vector } from "../geometry/Vector";
import { ShapeStyle, applyShapeStyle, Shape } from "./Shape";

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
        font: 'Consolas 16px',
        textAlign: 'center',
        textBaseline: 'middle',
        direction: 'inherit',
    } as TextStyle);

    constructor(options: TextOptions = EMPTY_OBJECT) {
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

    render(context: CanvasRenderingContext2D) {
        const { style, fillFirst, content, position } = this,
            { fillStyle } = style;
        applyShapeStyle(context, style);
        context.font = style.font;
        context.textAlign = style.textAlign;
        context.textBaseline = style.textBaseline;
        context.direction = style.direction;
        if (fillFirst && fillStyle) {
            context.fillText(content, position.x, position.y);
        }
        if (style.strokeStyle) {
            context.strokeText(content, position.x, position.y);
        }
        if (!fillFirst && fillStyle) {
            context.fillText(content, position.x, position.y);
        }
    }

}
