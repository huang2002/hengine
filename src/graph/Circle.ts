import { Renderable } from "../renderer/Renderer";
import { Vector, VectorLike } from "../geometry/Vector";
import { _abs, EMPTY_OBJECT, _assign, _Set, DOUBLE_PI, _cos, _sin, _sqrt } from "../utils/refs";
import { Shape, ShapeOptions } from "./Shape";
import { quadraticSum } from "../utils/common";

export type CircleOptions = Pick<ShapeOptions, Exclude<keyof ShapeOptions, 'isCircle'>> & Partial<{
    radius: number;
}>;

export class Circle extends Shape implements Required<CircleOptions>, Renderable {

    static defaults: CircleOptions = {
        radius: 1,
    };

    constructor(options: Readonly<CircleOptions> = EMPTY_OBJECT) {
        super(_assign({}, Circle.defaults, options));
    }

    readonly isCircle = true;
    radius!: number;

    protected _scale(scaleX: number, scaleY: number, origin?: VectorLike) { }

    protected _rotate(rotation: number, origin?: VectorLike) { }

    project(direction: Vector) {
        const { radius, rotation, scaleX, scaleY } = this,
            positionProjection = Vector.project(this.position, direction),
            angle = rotation - direction.getAngle(),
            cos = _cos(angle),
            sin = _sin(angle),
            halfLength = radius * _sqrt(
                quadraticSum(
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
        context.arc(0, 0, this.radius, 0, DOUBLE_PI);
    }

}
