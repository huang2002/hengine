import { VectorLike } from "./Vector";
import { _max, _min, _null } from "../common/references";

export class Bounds {

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
