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
    defer: boolean;
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
        strength: 1,
        force: true,
        defer: true,
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

    defer!: boolean;
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
        const { minLength, maxLength } = this,
            strength = this.strength,
            { position: targetPosition } = target,
            originPosition = (origin as Body).position || origin,
            offsetVector = Vector.minus(targetPosition, originPosition)
                .minusVector(this.originOffset)
                .plusVector(this.targetOffset),
            offset = offsetVector.getNorm(),
            delta = offset > maxLength ? offset - maxLength :
                offset < minLength ? offset - minLength : 0;
        if (!delta) {
            return;
        }
        offsetVector.setNorm(delta);
        const originIsActive = originPosition !== origin && (origin as Body).active,
            { velocity: targetVelocity, _v: _targetVelocity } = target;
        if (originIsActive) {
            const { velocity: originVelocity, _v: _originVelocity } = origin as Body;
            if (target.active) {
                (origin as Body).moveVector(offsetVector, .5);
                target.moveVector(offsetVector, -.5);
                const bounceVelocity = Vector.projectVector(
                    Vector.minus(_targetVelocity, _originVelocity).scale(strength / 2),
                    offsetVector
                );
                originVelocity.plusVector(bounceVelocity);
                targetVelocity.minusVector(bounceVelocity);
                // TODO: solve the rotations of origin & target here
            } else {
                (origin as Body).moveVector(offsetVector);
                originVelocity.minusVector(
                    Vector.projectVector(_originVelocity, offsetVector),
                    strength
                );
                // TODO: solve the rotation of origin here
            }
        } else {
            if (target.active || this.force) {
                target.move(-offsetVector.x, -offsetVector.y);
                targetVelocity.minusVector(
                    Vector.projectVector(_targetVelocity, offsetVector),
                    strength
                );
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
