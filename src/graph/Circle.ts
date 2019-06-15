import { Renderable } from "../renderer/Renderer";
import { Vector, VectorLike } from "../geometry/Vector";
import { _abs, _assign, _cos, _sin, _sqrt, _PI, _undefined } from "../common/references";
import { Shape, ShapeOptions } from "./Shape";
import { Utils } from "../common/Utils";

export type CircleOptions = Omit<ShapeOptions, 'isCircle'>;

export class Circle extends Shape implements Required<CircleOptions>, Renderable {

    static defaults: CircleOptions = {
        radius: 1,
    };

    constructor(options: Readonly<CircleOptions> = Utils.Const.EMPTY_OBJECT) {
        super(_assign({}, Circle.defaults, options));
        if (this.radius) {
            this.updateRadius();
        }
    }

    readonly isCircle = true;
    radius!: number;

    updateRadius(radius?: number) {
        if (radius === _undefined) {
            radius = this.radius;
        } else {
            this.radius = radius;
        }
        this._setArea(radius * radius * _PI);
        this.updateBounds();
    }

    updateBounds() {
        const { bounds, position: { x, y }, radius, rotation } = this,
            cos = _cos(rotation),
            sin = -_sin(rotation),
            a = radius * this.scaleX,
            b = radius * this.scaleY,
            halfWidth = _sqrt(Utils.quadraticSum(a * cos, b * sin)),
            halfHeight = _sqrt(Utils.quadraticSum(b * cos, a * sin));
        bounds.left = x - halfWidth;
        bounds.right = x + halfWidth;
        bounds.top = y - halfHeight;
        bounds.bottom = y + halfHeight;
    }

    getClosest(target: VectorLike) {
        const { position } = this,
            deltaVector = Vector.minus(target, position),
            angle = deltaVector.getAngle();
        return deltaVector.setNorm(this.radius * _sqrt(
            Utils.quadraticSum(_cos(angle) * this.scaleX, _sin(angle) * this.scaleY)
        )).plusVector(position);
    }

    project(direction: Vector) {
        const positionProjection = Vector.project(this.position, direction),
            angle = this.rotation - direction.getAngle(),
            halfLength = this.radius * _sqrt(
                Utils.quadraticSum(_cos(angle) * this.scaleX, _sin(angle) * this.scaleY)
            );
        return {
            min: positionProjection - halfLength,
            max: positionProjection + halfLength
        };
    }

    path(context: CanvasRenderingContext2D) {
        const { rotation, scaleX, scaleY } = this;
        context.rotate(rotation);
        context.scale(scaleX, scaleY);
        context.arc(0, 0, this.radius, 0, Utils.Const.DOUBLE_PI);
        context.rotate(-rotation);
        context.scale(1 / scaleX, 1 / scaleY);
    }

}
