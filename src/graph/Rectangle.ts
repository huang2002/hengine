import { Renderable } from "../renderer/Renderer";
import { Vector, VectorLike } from "../geometry/Vector";
import { _abs, _assign, _Set, _cos, _sin, _max, _sqrt } from "../common/references";
import { Shape, ShapeOptions } from "./Shape";
import { Utils } from "../common/Utils";
import { Vertices } from "../geometry/Vertices";

export type RectangleOptions = ShapeOptions & Partial<{
    width: number;
    height: number;
    radius: number;
}>;

export class Rectangle extends Shape implements Required<RectangleOptions>, Renderable {

    static defaults: RectangleOptions = {
        width: 20,
        height: 20,
        radius: 0,
    };

    constructor(options: Readonly<RectangleOptions> = Utils.EMPTY_OBJECT) {
        super(_assign({}, Rectangle.defaults, options));
    }

    width!: number;
    height!: number;
    radius!: number;

    protected _scale(scaleX: number, scaleY: number, origin?: VectorLike) {
        this.width *= scaleX;
        this.height *= scaleY;
    }

    getClosest(target: VectorLike) {
        const { rotation, radius, width, height, position: { x, y } } = this;
        let x0 = width / 2,
            y0 = height / 2;
        if (radius > 0) {
            x0 -= radius;
            y0 -= radius;
        }
        const cos = _cos(rotation),
            sin = _sin(rotation),
            x1 = x0 * cos - y0 * sin,
            y1 = x0 * sin + y0 * cos,
            x2 = x0 * cos - -y0 * sin,
            y2 = x0 * sin + -y0 * cos,
            closet = Vertices.findClosest(target, Vertices.fromArray([
                x + x1, y + y1,
                x + x2, y + y2,
                x - x1, y - y1,
                x - x2, y - y2
            ]));
        if (radius > 0) {
            closet.grow(radius);
        }
        return closet;
    }

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
                Utils.quadraticSum(
                    cos * width - sin * height,
                    sin * width + cos * height
                ),
                Utils.quadraticSum(
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
