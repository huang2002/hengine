import { Renderable, RendererLike } from "../renderer/Renderer";
import { Vector } from "../geometry/Vector";
import { Body } from "./Body";
import { StrokeStyle, Style, CommonStyle } from "../graphics/Style";

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
    elasticity: number;
    stiffness: number;
    style: Partial<ConstraintStyle>;
}>;

export class Constraint implements Required<ConstraintOptions>, Renderable {

    static defaults: ConstraintOptions = {
        origin: null,
        target: null,
        elasticity: 1,
        stiffness: 1,
        force: true,
        defer: true,
    };

    static defaultStyle: ConstraintStyle = Object.assign(
        {} as ConstraintStyle,
        Style.Common.defaults,
        Style.Stroke.defaults
    );

    constructor(options?: Readonly<ConstraintOptions>) {
        Object.assign(this, Constraint.defaults, options);
        this.style = Object.assign({}, Constraint.defaultStyle, this.style);

        if (!this.originOffset) {
            this.originOffset = new Vector();
        }
        if (!this.targetOffset) {
            this.targetOffset = new Vector();
        }

        if (this.maxLength === undefined) {
            const { origin, target } = this;
            this.maxLength = origin && target ?
                Vector.distance((origin as Body).position || origin, target.position) :
                0;
        }
        if (this.minLength === undefined) {
            this.minLength = 0;
        }

    }

    defer!: boolean;
    origin!: Vector | Body | null;
    originOffset!: Vector;
    target!: Body | null;
    targetOffset!: Vector;
    minLength!: number;
    maxLength!: number;
    elasticity!: number;
    stiffness!: number;
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
            elasticity = this.elasticity,
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
            { velocity: targetVelocity } = target,
            { stiffness } = this;
        if (originIsActive) {
            const { velocity: originVelocity } = origin as Body;
            if (target.active) {
                const { mass: originMass } = origin as Body,
                    { mass: targetMass } = target,
                    originScale = originMass / (originMass + targetMass),
                    targetScale = 1 - originScale;
                (origin as Body).moveVector(offsetVector, originScale * stiffness);
                target.moveVector(offsetVector, -targetScale * stiffness);
                const relativeVelocity = Vector.minus(targetVelocity, originVelocity);
                if (Vector.dot(relativeVelocity, offsetVector)) {
                    const bounceVelocity = Vector.projectVector(relativeVelocity, offsetVector)
                        .plusVector(offsetVector)
                        .scale(elasticity);
                    originVelocity.plusVector(bounceVelocity, originScale);
                    targetVelocity.minusVector(bounceVelocity, targetScale);
                    // TODO: solve the rotations of origin & target here
                }
            } else {
                (origin as Body).moveVector(offsetVector);
                originVelocity.minusVector(
                    Vector.projectVector(originVelocity, offsetVector),
                    elasticity
                );
                // TODO: solve the rotation of origin here
            }
        } else {
            if (target.active || this.force) {
                target.move(-offsetVector.x, -offsetVector.y);
                targetVelocity.minusVector(
                    Vector.projectVector(targetVelocity, offsetVector),
                    elasticity
                );
                // TODO: solve the rotation of target here
            }
        }
    }

    render(renderer: RendererLike) {
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
