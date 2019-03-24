import { VectorLike } from "./Vector";
import { _max, _min, _null } from "../utils/references";

export class Bounds {

    static getOverlap(bounds1: Bounds, bounds2: Bounds) {
        const result = new Bounds();
        result.left = _max(bounds1.left, bounds2.left);
        result.right = _min(bounds1.right, bounds2.right);
        result.top = _max(bounds1.top, bounds2.top);
        result.bottom = _min(bounds1.bottom, bounds2.bottom);
        return result.left < result.right && result.top < result.bottom ? result : _null;;
    }

    top = 0;
    right = 0;
    bottom = 0;
    left = 0;

    get width() {
        return this.right - this.left;
    }

    get height() {
        return this.bottom - this.top;
    }

    move(deltaX: number, deltaY: number) {
        this.left += deltaX;
        this.right += deltaX;
        this.top += deltaY;
        this.bottom += deltaY;
    }

    moveVector(vector: VectorLike) {
        this.left += vector.x;
        this.right += vector.x;
        this.top += vector.y;
        this.bottom += vector.y;
    }

    overlaps(bounds: Bounds) {
        return !(
            bounds.right < this.left ||
            bounds.left > this.right ||
            bounds.bottom < this.top ||
            bounds.top > this.bottom
        );
    }

}
