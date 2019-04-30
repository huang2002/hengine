import { _assign } from "../common/references";
import { Renderable, Renderer } from "../renderer/Renderer";
import { Vector } from "../geometry/Vector";
import { TextStyle, Text } from "./Text";
import { Utils } from "../common/Utils";

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
        indent: 0,
        lineHeight: 20,
    };

    static defaultStyle: TextStyle = _assign({} as TextStyle, Text.defaultStyle);

    constructor(options: ParagraphOptions = Utils.Const.EMPTY_OBJECT) {
        _assign(this, Paragraph.defaults, options);

        if (!this.position) {
            this.position = new Vector();
        }

        this.style = _assign({}, Paragraph.defaultStyle, this.style);

    }

    visible!: boolean;
    lines!: string[];
    lineHeight!: number;
    indent!: number;
    fillFirst!: boolean;
    position!: Vector;
    style!: TextStyle;

    render(renderer: Renderer) {
        const { style, fillFirst, lines, lineHeight, indent, position } = this,
            { fillStyle, strokeStyle, shadowColor } = style,
            { context } = renderer;
        Text.applyStyle(renderer, style);
        context.translate(position.x, position.y);
        lines.forEach((line, i) => {
            if (fillFirst && fillStyle) {
                context.fillText(line, 0, 0);
                context.shadowColor = Utils.Const.TRANSPARENT;
            }
            if (strokeStyle) {
                context.strokeText(line, 0, 0);
                context.shadowColor = Utils.Const.TRANSPARENT;
            }
            if (!fillFirst && fillStyle) {
                context.fillText(line, 0, 0);
            }
            context.translate(indent, lineHeight);
            context.shadowColor = shadowColor;
        });
        const { length: lineCount } = lines;
        context.translate(
            -position.x - indent * lineCount,
            -position.y - lineHeight * lineCount
        );
    }

}
