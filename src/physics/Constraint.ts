import { _assign, _undefined, _null } from "../common/references";
import { Renderable, Renderer } from "../renderer/Renderer";
import { Vector } from "../geometry/Vector";
import { Body } from "./Body";
import { Utils } from "../common/Utils";
import { StrokeStyle, Style, CommonStyle } from "../graph/Style";

export type ConstraintStyle = CommonStyle & StrokeStyle;

export type ConstraintOptions = Partial<{
    origin: Vector | Body;
    originOffset: Vector;
    target: Body;
    targetOffset: Vector;
    minLength: number;
    maxLength: number;
    length: number;
    strength: number;
    style: ConstraintStyle;
}>;

export class Constraint implements Required<ConstraintOptions>, Renderable {

    static defaults: ConstraintOptions = {
        originOffset: new Vector(),
        targetOffset: new Vector(),
        minLength: 0,
        strength: .8,
    };

    static defaultStyle: ConstraintStyle = _assign(
        {} as ConstraintStyle,
        Style.Common.defaults,
        Style.Stroke.defaults
    );

    constructor(options: ConstraintOptions = Utils.EMPTY_OBJECT) {
        _assign(this, Constraint.defaults, options);
        this.style = _assign({}, Constraint.defaultStyle, options.style);

        if (this.maxLength === _undefined) {
            const { origin, target } = options;
            if (origin && target) {
                this.maxLength = Vector.distance(
                    (origin as Body).position || origin,
                    target.position
                );
            }
        }

    }

    origin!: Vector | Body;
    originOffset!: Vector;
    target!: Body;
    targetOffset!: Vector;
    minLength!: number;
    maxLength!: number;
    strength!: number;
    style: ConstraintStyle;

    set length(length: number) {
        this.minLength = this.maxLength = length;
    }

    update(timeScale: number) {
        // TODO: implement `constraint.update`

    }

    render(renderer: Renderer) {
        const { style } = this;
        if (!style.strokeStyle) {
            return;
        }
        const { origin, originOffset, target: { position: targetPosition }, targetOffset } = this,
            originPosition = (origin as Body).position || origin,
            { context } = renderer;
        Style.Common.apply(renderer, style);
        Style.Stroke.apply(renderer, style);
        context.beginPath();
        context.moveTo(originPosition.x + originOffset.x, originPosition.y + originOffset.y);
        context.lineTo(targetPosition.x + targetOffset.x, targetPosition.y + targetOffset.y);
        context.stroke();
    }

}
