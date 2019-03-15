import { _assign, EMPTY_OBJECT } from "../utils/refs";
import { Renderable } from "../renderer/Renderer";
import { Vector } from "../geometry/Vector";
import { CommonStyle, commonStyle, applyCommonStyle } from "./CommonStyle";

/**
 * @todo Mixin `ShapeStyle` and extract an `applyShapeStyle()`.
 */
export type TextStyle = CommonStyle & CanvasTextDrawingStyles;

export type TextOptions = Partial<{
    visible: boolean;
    content: string;
    position: Vector;
    style: Partial<TextStyle>;
}>;

export class Text implements Required<TextOptions>, Renderable {

    static defaults: TextOptions = {
        visible: true,
        content: '',
    };

    static defaultStyle: TextStyle = _assign({} as TextStyle, commonStyle, {
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
    position!: Vector;
    style!: TextStyle;

    render(context: CanvasRenderingContext2D) {
        const { style } = this;
        applyCommonStyle(context, style);
        context.font = style.font;
        context.textAlign = style.textAlign;
        context.textBaseline = style.textBaseline;
        context.direction = style.direction;

    }

}
