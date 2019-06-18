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
    preferShadow: boolean;
    position: Vector;
    style: Partial<TextStyle>;
}>;

export class Paragraph implements Required<ParagraphOptions>, Renderable {

    static defaults: ParagraphOptions = {
        visible: true,
        lines: [],
        indent: 0,
        lineHeight: 20,
        preferShadow: true,
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
    preferShadow!: boolean;
    position!: Vector;
    style!: TextStyle;

    render(renderer: RendererLike) {
        const { style, fillFirst, lines, lineHeight, indent, position } = this,
            { fillStyle, strokeStyle, shadowColor, shadowOffsetX, shadowOffsetY } = style,
            { context } = renderer,
            { TRANSPARENT } = Utils.Const,
            preferShadow = this.preferShadow && !style.shadowBlur && style.shadowColor !== TRANSPARENT;
        let { x, y } = position;
        Text.applyStyle(renderer, style);
        if (preferShadow) {
            context.shadowColor = TRANSPARENT;
        }
        lines.forEach(line => {
            if (preferShadow) {
                context.fillStyle = style.shadowColor;
                context.fillText(line, x + shadowOffsetX, y + shadowOffsetY);
                if (fillStyle) {
                    context.fillStyle = fillStyle;
                }
            }
            if (fillFirst && fillStyle) {
                context.fillText(line, x, y);
                context.shadowColor = TRANSPARENT;
            }
            if (strokeStyle) {
                context.strokeText(line, x, y);
                context.shadowColor = TRANSPARENT;
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
