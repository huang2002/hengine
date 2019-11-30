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
    rotation: number;
    style: Partial<TextStyle>;
}>;

export class Paragraph implements Required<ParagraphOptions>, Renderable {

    static defaults: ParagraphOptions = {
        visible: true,
        lines: [],
        indent: 0,
        lineHeight: 20,
        preferShadow: true,
        rotation: 0,
    };

    static defaultStyle: TextStyle = Object.assign({} as TextStyle, Text.defaultStyle);

    constructor(options?: Readonly<ParagraphOptions>) {
        Object.assign(this, Paragraph.defaults, options);

        if (!this.position) {
            this.position = new Vector();
        }

        this.style = Object.assign({}, Paragraph.defaultStyle, this.style);

    }

    visible!: boolean;
    lines!: string[];
    lineHeight!: number;
    indent!: number;
    fillFirst!: boolean;
    preferShadow!: boolean;
    position!: Vector;
    rotation!: number;
    style!: TextStyle;

    render(renderer: RendererLike) {
        const { style, fillFirst, lines, lineHeight, indent, position, rotation } = this,
            { fillStyle, strokeStyle, shadowColor, shadowOffsetX, shadowOffsetY } = style,
            { x, y } = position,
            { context } = renderer,
            { TRANSPARENT } = Utils.Const,
            preferShadow = this.preferShadow && !style.shadowBlur && style.shadowColor !== TRANSPARENT;
        Text.applyStyle(renderer, style);
        if (preferShadow) {
            context.shadowColor = TRANSPARENT;
        }
        context.translate(x, y);
        context.rotate(rotation);
        let dx = 0,
            dy = 0;
        lines.forEach(line => {
            if (preferShadow) {
                context.fillStyle = style.shadowColor;
                context.fillText(line, dx + shadowOffsetX, dy + shadowOffsetY);
                if (fillStyle) {
                    context.fillStyle = fillStyle;
                }
            }
            if (fillFirst && fillStyle) {
                context.fillText(line, dx, dy);
                context.shadowColor = TRANSPARENT;
            }
            if (strokeStyle) {
                context.strokeText(line, dx, dy);
                context.shadowColor = TRANSPARENT;
            }
            if (!fillFirst && fillStyle) {
                context.fillText(line, dx, dy);
            }
            context.shadowColor = shadowColor;
            dx += indent;
            dy += lineHeight;
        });
        context.rotate(-rotation);
        context.translate(-x, -y);
    }

}
