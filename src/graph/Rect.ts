import { Renderable } from "../renderer/Renderer";
import { Vector } from "../geometry/Vector";
import { _abs, EMPTY_OBJECT, _assign, _Set, _cos, _sin, _sqrt, _max } from "../utils/refs";
import { Shape, ShapeOptions } from "./Shape";
import { quadraticSum } from "../utils/common";

export type RectOptions = ShapeOptions & Partial<{
    width: number;
    height: number;
    radius: number;
}>;

export class Rect extends Shape implements Required<RectOptions>, Renderable {

    static defaults: RectOptions = {
        width: 20,
        height: 20,
        radius: 0,
    };

    constructor(options: Readonly<RectOptions> = EMPTY_OBJECT) {
        super(_assign({}, Rect.defaults, options));
    }

    width!: number;
    height!: number;
    radius!: number;

    protected _scale(scaleX: number, scaleY: number, origin?: Vector) {
        this.width *= scaleX;
        this.height *= scaleY;
    }

    protected _rotate(rotation: number, origin?: Vector) { }

    project(direction: Vector) {
        const { rotation, radius } = this;
        let { width, height } = this;
        if (radius > 0) {
            width -= radius;
            height -= radius;
        }
        const positionProjection = Vector.project(this.position, direction),
            cos = _cos(rotation),
            sin = _sin(rotation);
        let halfLength = _sqrt(
            _max(
                quadraticSum(
                    cos * width - sin * height,
                    sin * width + cos * height
                ),
                quadraticSum(
                    cos * width - sin * -height,
                    sin * width + cos * -height
                )
            )
        );
        if (radius > 0) {
            halfLength += radius;
        }
        return {
            min: positionProjection - halfLength,
            max: positionProjection + halfLength
        };
    }

    path(context: CanvasRenderingContext2D) {
        const { width, height, radius } = this;
        context.rotate(this.rotation);
        if (radius > 0) {
            const halfWidth = width / 2,
                halfHeight = height / 2,
                innerHalfWidth = halfWidth - radius,
                innerHalfHeight = halfHeight - radius;
            context.moveTo(-innerHalfWidth, -halfHeight);
            context.lineTo(innerHalfWidth, -halfHeight);
            context.arcTo(halfWidth, -halfHeight, halfWidth, -innerHalfHeight, radius);
            context.lineTo(halfWidth, innerHalfHeight);
            context.arcTo(halfWidth, halfHeight, innerHalfWidth, halfHeight, radius);
            context.lineTo(-innerHalfWidth, halfHeight);
            context.arcTo(-halfWidth, halfHeight, -halfWidth, innerHalfHeight, radius);
            context.lineTo(-halfWidth, -innerHalfHeight);
            context.arcTo(-halfWidth, -halfHeight, -innerHalfWidth, -halfHeight, radius);
        } else {
            context.rect(-width / 2, -height / 2, width, height);
        }
    }

}
