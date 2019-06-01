import { Renderable } from "../renderer/Renderer";
import { Vector, VectorLike } from "../geometry/Vector";
import { _abs, _assign, _cos, _sin, _max, _sqrt, _undefined } from "../common/references";
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

    constructor(options: Readonly<RectangleOptions> = Utils.Const.EMPTY_OBJECT) {
        super(_assign({}, Rectangle.defaults, options));
        this.updateBounds();

        const { rotation } = this,
            cos = _cos(rotation),
            sin = _sin(rotation);
        (this.normals as Vector[]) = [
            Vector.of(cos, sin),
            Vector.of(-sin, cos)
        ];

        this.updateSize();

    }

    width!: number;
    height!: number;
    radius!: number;

    protected _scale(scaleX: number, scaleY: number, origin?: VectorLike) {
        this.width *= scaleX;
        this.height *= scaleY;
        const { position: { x: x0, y: y0 }, bounds } = this,
            x = origin ? origin.x + (x0 - origin.x) * scaleX : x0,
            y = origin ? origin.y + (y0 - origin.y) * scaleY : y0,
            dx = (bounds.right - x) * scaleX,
            dy = (bounds.bottom - y) * scaleY;
        bounds.left = x - dx;
        bounds.right = x + dx;
        bounds.top = y - dy;
        bounds.bottom = y + dy;
    }

    protected _rotate(rotation: number, origin?: VectorLike) {
        const { normals } = this;
        normals[0].rotate(rotation);
        normals[1].rotate(rotation);
        this.updateBounds();
    }

    updateSize(width: number, height: number): void;
    updateSize(): void;
    updateSize(width?: number, height?: number) {
        if (width === _undefined) {
            width = this.width;
        } else {
            this.width = width;
        }
        if (height === _undefined) {
            height = this.height;
        } else {
            this.height = height;
        }
        this._setArea(width * height);
        this.updateBounds();
    }

    updateBounds() {
        const { bounds, rotation, radius, width, height, position } = this,
            { x, y } = position;
        let dx0 = width / 2,
            dy0 = height / 2;
        if (radius > 0) {
            dx0 -= radius;
            dy0 -= radius;
        }
        const cos = _cos(rotation),
            sin = _sin(rotation),
            dx1 = dx0 * cos - dy0 * sin,
            dy1 = dx0 * sin + dy0 * cos,
            dx2 = dx0 * cos - -dy0 * sin,
            dy2 = dx0 * sin + -dy0 * cos;
        bounds.updateVertices(Vertices.fromArray([
            x + dx1, y + dy1,
            x + dx2, y + dy2,
            x - dx1, y - dy1,
            x - dx2, y - dy2
        ]));
        if (radius > 0) {
            bounds.grow(radius);
        }
    }

    getClosest(target: VectorLike) {
        const { rotation, radius, width, height, position } = this,
            { x, y } = position;
        let dx0 = width / 2,
            dy0 = height / 2;
        if (radius > 0) {
            dx0 -= radius;
            dy0 -= radius;
        }
        const cos = _cos(rotation),
            sin = _sin(rotation),
            dx1 = dx0 * cos - dy0 * sin,
            dy1 = dx0 * sin + dy0 * cos,
            dx2 = dx0 * cos - -dy0 * sin,
            dy2 = dx0 * sin + -dy0 * cos,
            closest = Vertices.findClosest(target, Vertices.fromArray([
                x + dx1, y + dy1,
                x + dx2, y + dy2,
                x - dx1, y - dy1,
                x - dx2, y - dy2
            ]));
        if (radius > 0) {
            closest.grow(radius);
        }
        return closest;
    }

    project(direction: Vector) {
        const { radius } = this,
            angle = this.rotation - direction.getAngle(),
            cos = _cos(angle),
            sin = _sin(angle);
        let x0 = this.width / 2,
            y0 = this.height / 2;
        if (radius > 0) {
            x0 -= radius;
            y0 -= radius;
        }
        let halfLength = _max(_abs(x0 * cos - y0 * sin), _abs(x0 * cos + y0 * sin));
        if (radius > 0) {
            halfLength += radius;
        }
        const positionProjection = Vector.project(this.position, direction);
        return {
            min: positionProjection - halfLength,
            max: positionProjection + halfLength
        };
    }

    path(context: CanvasRenderingContext2D) {
        const { width, height, radius, rotation } = this;
        context.rotate(rotation);
        if (radius > 0) {
            const halfWidth = width / 2,
                halfHeight = height / 2,
                innerHalfWidth = halfWidth - radius,
                innerHalfHeight = halfHeight - radius;
            context.moveTo(-innerHalfWidth, -halfHeight);
            context.arcTo(halfWidth, -halfHeight, halfWidth, innerHalfHeight, radius);
            context.arcTo(halfWidth, halfHeight, -innerHalfWidth, halfHeight, radius);
            context.arcTo(-halfWidth, halfHeight, -halfWidth, -innerHalfHeight, radius);
            context.arcTo(-halfWidth, -halfHeight, -innerHalfWidth, -halfHeight, radius);
        } else {
            context.rect(-width / 2, -height / 2, width, height);
        }
        context.rotate(-rotation);
    }

}
