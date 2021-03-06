import { Renderable } from "../renderer/Renderer";
import { Vector, VectorLike } from "../geometry/Vector";
import { Shape, ShapeOptions } from "./Shape";
import { Utils } from "../common/Utils";

export type LineOptions = ShapeOptions & Partial<{
    start: Vector;
    end: Vector;
}>;

export class Line extends Shape implements Required<LineOptions>, Renderable {

    static defaults: LineOptions = {
        closePath: false,
    };

    constructor(options: Readonly<LineOptions> = Utils.Const.EMPTY_OBJECT) {
        super(Object.assign({}, Line.defaults, options));
        if (!this.start) {
            this.start = new Vector();
        }
        if (!this.end) {
            this.end = new Vector();
        }
        this.updateVertices();
    }

    readonly start!: Vector;
    readonly end!: Vector;

    protected _scale(scaleX: number, scaleY: number, origin?: VectorLike) {
        this.start.scale(scaleX, scaleY, origin);
        this.end.scale(scaleX, scaleY, origin);
        this.updateVertices();
    }

    protected _rotate(rotation: number, origin?: VectorLike) {
        this.start.rotate(rotation, origin);
        this.end.rotate(rotation, origin);
        this.updateVertices();
    }

    updateVertices(start?: Vector, end?: Vector) {
        if (start) {
            (this.start as Vector) = start;
        }
        if (end) {
            (this.end as Vector) = end;
        }
        const deltaVector = Vector.minus(this.end, this.start);
        (this.normals as Vector[]) = [
            deltaVector,
            Vector.of(-deltaVector.y, deltaVector.x)
        ];
        this._setArea(deltaVector.getNorm());
        this.updateBounds();
    }

    updateBounds() {
        const { start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, bounds } = this;
        if (x1 > x2) {
            bounds.left = x2;
            bounds.right = x1;
        } else {
            bounds.left = x1;
            bounds.right = x2;
        }
        if (y1 > y2) {
            bounds.top = y2;
            bounds.bottom = y1;
        } else {
            bounds.top = y1;
            bounds.bottom = y2;
        }
    }

    getClosest(target: VectorLike) {
        const { start, end } = this;
        return Utils.quadraticSum(start.x - target.x, start.y - target.y) <
            Utils.quadraticSum(end.x - target.x, end.y - target.y) ?
            start : end;
    }

    project(direction: Vector) {
        const { start, end } = this,
            startProjection = Vector.project(start, direction),
            endProjection = Vector.project(end, direction);
        return startProjection < endProjection ?
            { min: startProjection, max: endProjection } :
            { min: endProjection, max: startProjection };
    }

    path(context: CanvasRenderingContext2D) {
        const { start, end } = this;
        context.moveTo(start.x, start.y);
        context.lineTo(end.x, end.y);
    }

}
