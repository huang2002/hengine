import { Renderable } from "../renderer/Renderer";
import { Vector, VectorLike } from "../geometry/Vector";
import { _assign } from "../common/references";
import { Shape, ShapeOptions } from "./Shape";
import { Utils } from "../common/Utils";

export type LineOptions = ShapeOptions & Partial<{
    start: Vector;
    end: Vector;
    noWidth: boolean;
}>;

export class Line extends Shape implements Required<LineOptions>, Renderable {

    static defaults: LineOptions = {
        noWidth: false,
    };

    constructor(options: Readonly<LineOptions> = Utils.Const.EMPTY_OBJECT) {
        super(_assign({}, Line.defaults, options));
        this.updateBounds();
    }

    start!: Vector;
    end!: Vector;
    noWidth!: boolean;

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
        const { start, end } = this,
            result = Utils.quadraticSum(start.x - target.x, start.y - target.y) <
                Utils.quadraticSum(end.x - target.x, end.y - target.y) ?
                start : end;
        return this.noWidth ? result : result.clone().grow(this.style.lineWidth);
    }

    project(direction: Vector) {
        const { start, end } = this,
            startProjection = Vector.project(start, direction),
            endProjection = Vector.project(end, direction),
            width = this.noWidth ? 0 : this.style.lineWidth;
        return startProjection < endProjection ?
            { min: startProjection - width, max: endProjection + width } :
            { min: endProjection - width, max: startProjection + width };
    }

    path(context: CanvasRenderingContext2D) {
        const { start, end } = this;
        context.moveTo(start.x, start.y);
        context.lineTo(end.x, end.y);
    }

}
