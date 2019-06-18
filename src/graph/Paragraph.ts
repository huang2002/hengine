import { _assign } from "../common/references";
import { Renderable, RendererLike } from "../renderer/Renderer";
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

    constructor(options?: ParagraphOptions) {
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

    render(renderer: RendererLike) {
        const { style, fillFirst, lines, lineHeight, indent, position } = this,
            { fillStyle, strokeStyle, shadowColor } = style,
            { context } = renderer;
        let { x, y } = position;
        Text.applyStyle(renderer, style);
        lines.forEach(line => {
            if (fillFirst && fillStyle) {
                context.fillText(line, x, y);
                context.shadowColor = Utils.Const.TRANSPARENT;
            }
            if (strokeStyle) {
                context.strokeText(line, x, y);
                context.shadowColor = Utils.Const.TRANSPARENT;
            }
            if (!fillFirst && fillStyle) {
                context.fillText(line, x, y);
            }
            context.shadowColor = shadowColor;
            x += indent;
            y += lineHeight;
        });
    }

}
