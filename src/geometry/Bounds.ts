import { VectorLike } from "./Vector";

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

    moveVector(vector: VectorLike, scale?: number) {
        if (scale) {
            this.left += vector.x * scale;
            this.right += vector.x * scale;
            this.top += vector.y * scale;
            this.bottom += vector.y * scale;
        } else {
            this.left += vector.x;
            this.right += vector.x;
            this.top += vector.y;
            this.bottom += vector.y;
        }
    }

    grow(delta: number) {
        this.left -= delta;
        this.right += delta;
        this.top -= delta;
        this.bottom += delta;
    }

    overlaps(bounds: Bounds) {
        return !(
            bounds.right < this.left ||
            bounds.left > this.right ||
            bounds.bottom < this.top ||
            bounds.top > this.bottom
        );
    }

    updateVertices(vertices: ReadonlyArray<VectorLike>) {
        vertices.forEach(({ x, y }, i) => {
            if (i > 0) {
                if (x < this.left) {
                    this.left = x;
                } else if (x > this.right) {
                    this.right = x;
                }
                if (y < this.top) {
                    this.top = y;
                } else if (y > this.bottom) {
                    this.bottom = y;
                }
            } else {
                this.left = this.right = x;
                this.top = this.bottom = y;
            }
        });
    }

    updateBounds(boundsArray: ReadonlyArray<Bounds>) {
        boundsArray.forEach(({ left, right, top, bottom }, i) => {
            if (i > 0) {
                if (left < this.left) {
                    this.left = left;
                }
                if (right > this.right) {
                    this.right = right;
                }
                if (top < this.top) {
                    this.top = top;
                }
                if (bottom > this.bottom) {
                    this.bottom = bottom;
                }
            } else {
                this.left = left;
                this.right = right;
                this.top = top;
                this.bottom = bottom;
            }
        });
    }

}
