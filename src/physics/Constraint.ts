import { _assign, _undefined, _null } from "../common/references";
import { Renderable, Renderer } from "../renderer/Renderer";
import { Vector } from "../geometry/Vector";
import { Body } from "./Body";
import { StrokeStyle, Style, CommonStyle } from "../graph/Style";

export type ConstraintStyle = CommonStyle & StrokeStyle;

export type ConstraintOptions = Partial<{
    origin: Vector | Body | null;
    originOffset: Vector;
    target: Body | null;
    targetOffset: Vector;
    force: boolean;
    minLength: number;
    maxLength: number;
    length: number;
    strength: number;
    style: Partial<ConstraintStyle>;
}>;

export class Constraint implements Required<ConstraintOptions>, Renderable {

    static defaults: ConstraintOptions = {
        origin: _null,
        target: _null,
        strength: .9,
        force: true,
    };

    static defaultStyle: ConstraintStyle = _assign(
        {} as ConstraintStyle,
        Style.Common.defaults,
        Style.Stroke.defaults
    );

    constructor(options?: ConstraintOptions) {
        _assign(this, Constraint.defaults, options);
        this.style = _assign({}, Constraint.defaultStyle, this.style);

        if (!this.originOffset) {
            this.originOffset = new Vector();
        }
        if (!this.targetOffset) {
            this.targetOffset = new Vector();
        }

        if (this.maxLength === _undefined) {
            const { origin, target } = this;
            this.maxLength = origin && target ?
                Vector.distance((origin as Body).position || origin, target.position) :
                0;
        }
        if (this.minLength === _undefined) {
            this.minLength = this.maxLength;
        }

    }

    origin!: Vector | Body | null;
    originOffset!: Vector;
    target!: Body | null;
    targetOffset!: Vector;
    minLength!: number;
    maxLength!: number;
    strength!: number;
    force!: boolean;
    style!: ConstraintStyle;

    set length(length: number) {
        this.minLength = this.maxLength = length;
    }

    update(timeScale: number) {
        const { origin, target } = this;
        if (!target || !origin) {
            return;
        }
        const { minLength, maxLength, strength } = this,
            { position: targetPosition } = target,
            originPosition = (origin as Body).position || origin,
            offsetVector = Vector.minus(targetPosition, originPosition)
                .minusVector(this.originOffset)
                .plusVector(this.targetOffset),
            offset = offsetVector.getModulus(),
            delta = offset > maxLength ? offset - maxLength :
                offset < minLength ? offset - minLength : 0;
        if (!delta) {
            return;
        }
        offsetVector.setModulus(delta);
        const originIsActive = originPosition !== origin && (origin as Body).active;
        if (originIsActive) {
            if (target.active) {
                const relativeVelocity = Vector.minus(target.velocity, (origin as Body).velocity),
                    bounceVelocity = Vector.projectVector(relativeVelocity, offsetVector)
                        .scale(strength / 2);
                (origin as Body).impulse.plusVector(offsetVector);
                target.impulse.plus(-offsetVector.x, -offsetVector.y);
                (origin as Body).velocity.plusVector(bounceVelocity);
                target.velocity.minusVector(bounceVelocity);
                Vector.distribute(
                    offsetVector.scale(strength),
                    (origin as Body).velocity, target.velocity,
                    target.mass, -(origin as Body).mass
                );
                // TODO: solve the rotations of origin & target here
            } else {
                (origin as Body).impulse.plusVector(offsetVector);
                (origin as Body).velocity
                    .minusVector(Vector.projectVector((origin as Body).velocity, offsetVector), strength);
                // .minusVector(Vector.projectVector((origin as Body).velocity, offsetVector), strength)
                // .plusVector(offsetVector, strength);
                // TODO: solve the rotation of origin here
            }
        } else {
            if (target.active || this.force) {
                target.impulse.plus(-offsetVector.x, -offsetVector.y);
                target.velocity
                    .minusVector(Vector.projectVector(target.velocity, offsetVector), strength);
                // .minusVector(Vector.projectVector(target.velocity, offsetVector), strength)
                // .minusVector(offsetVector, strength);
                // TODO: solve the rotation of target here
            }
        }
    }

    render(renderer: Renderer) {
        const { style, origin, target } = this;
        if (!style.strokeStyle || !origin || !target) {
            return;
        }
        const { originOffset, targetOffset } = this,
            { position: targetPosition } = target,
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
