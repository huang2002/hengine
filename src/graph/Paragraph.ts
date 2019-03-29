import { _assign } from "../utils/references";
import { Renderable } from "../renderer/Renderer";
import { Vector } from "../geometry/Vector";
import { TextStyle, Text } from "./Text";
import { EMPTY_OBJECT } from "../utils/common";

export type ParagraphOptions = Partial<{
    visible: boolean;
    lines: string[];
    lineHeight: number;
    indent: number;
    fillFirst: boolean;
    position: Vector;
    style: Partial<TextStyle>;
}>;

export class Paragraph implements Required<ParagraphOptions>, Renderable {

    static defaults: ParagraphOptions = {
        visible: true,
        lines: [],
        lineHeight: 20,
    };

    static defaultStyle: TextStyle = _assign({} as TextStyle, Text.defaultStyle);

    constructor(options: ParagraphOptions = EMPTY_OBJECT) {
        _assign(this, Paragraph.defaults, options);

        if (!options.position) {
            this.position = new Vector();
        }

        this.style = _assign({}, Paragraph.defaultStyle, options.style);

    }

    visible!: boolean;
    lines!: string[];
    lineHeight!: number;
    indent!: number;
    fillFirst!: boolean;
    position!: Vector;
    style!: TextStyle;

    render(context: CanvasRenderingContext2D) {
        const { style, fillFirst, lines, lineHeight, indent, position } = this,
            { fillStyle, strokeStyle } = style;
        Text.applyStyle(context, style);
        context.translate(position.x, position.y);
        lines.forEach(line => {
            context.translate(indent, lineHeight);
            if (fillFirst && fillStyle) {
                context.fillText(line, 0, 0);
            }
            if (strokeStyle) {
                context.strokeText(line, 0, 0);
            }
            if (!fillFirst && fillStyle) {
                context.fillText(line, 0, 0);
            }
        });
    }

}
