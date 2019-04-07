import { Renderable } from "../renderer/Renderer";
import { Vector, VectorLike } from "../geometry/Vector";
import { _abs, _assign, _cos, _sin, _sqrt } from "../common/references";
import { Shape, ShapeOptions } from "./Shape";
import { Utils } from "../common/Utils";

export type CircleOptions = Utils.ExcludeKeys<ShapeOptions, 'isCircle'>;

export class Circle extends Shape implements Required<CircleOptions>, Renderable {

    static defaults: CircleOptions = {
        radius: 1,
    };

    constructor(options: Readonly<CircleOptions> = Utils.Const.EMPTY_OBJECT) {
        super(_assign({}, Circle.defaults, options));
    }

    readonly isCircle = true;
    radius!: number;

    getClosest(target: VectorLike) {
        const { position } = this;
        return Vector.minus(target, position).setModulus(this.radius).plusVector(position);
    }

    project(direction: Vector) {
        const { radius, rotation, scaleX, scaleY } = this,
            positionProjection = Vector.project(this.position, direction),
            angle = rotation - direction.getAngle(),
            cos = _cos(angle),
            sin = _sin(angle),
            halfLength = radius * _sqrt(
                Utils.quadraticSum(
                    cos * scaleX - sin * scaleY,
                    sin * scaleX + cos * scaleY
                )
            );
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
