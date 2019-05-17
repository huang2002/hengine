import { Renderable } from "../renderer/Renderer";
import { Vector, VectorLike } from "../geometry/Vector";
import { _abs, _assign, _cos, _sin, _sqrt, _PI, _undefined } from "../common/references";
import { Shape, ShapeOptions } from "./Shape";
import { Utils } from "../common/Utils";

export type CircleOptions = Utils.ExcludeKeys<ShapeOptions, 'isCircle'>;

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

    // TODO: fix this
    getClosest(target: VectorLike) {
        const { position } = this;
        return Vector.minus(target, position).setNorm(this.radius).plusVector(position);
    }

    project(direction: Vector) {
        const { radius, rotation, scaleX, scaleY } = this,
            positionProjection = Vector.project(this.position, direction),
            angle = rotation - direction.getAngle(),
            cos = _cos(angle),
            sin = _sin(angle),
            halfLength = radius * _sqrt(Utils.quadraticSum(cos * scaleX, sin * scaleY));
        return {
            min: positionProjection - halfLength,
            max: positionProjection + halfLength
        };
    }

    path(context: CanvasRenderingContext2D) {
        context.rotate(this.rotation);
        context.scale(this.scaleX, this.scaleY);
        context.arc(0, 0, this.radius, 0, Utils.Const.DOUBLE_PI);
    }

}
