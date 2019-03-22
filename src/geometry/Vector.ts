import { _sqrt, _pow, _cos, _sin, _atan, _PI } from "../utils/references";
import { distance } from "../utils/common";

export interface VectorLike {
    x: number;
    y: number;
}

export class Vector {

    static of(x: number, y: number) {
        return new Vector(x, y);
    }

    static from(vectorLike: VectorLike) {
        return Vector.of(vectorLike.x, vectorLike.y);
    }

    static mix(vectors: VectorLike[]) {
        return vectors.reduce((ans: Vector, cur) => ans.addVector(cur), new Vector());
    }

    static mean(vectors: VectorLike[]) {
        return Vector.mix(vectors).shrink(vectors.length);
    }

    static dot(vector1: VectorLike, vector2: VectorLike) {
        return vector1.x * vector2.x + vector1.y * vector2.y;
    }

    static cross(vector1: VectorLike, vector2: VectorLike) {
        return vector1.x * vector2.y - vector1.y * vector2.x;
    }

    static minus(vector1: VectorLike, vector2: VectorLike) {
        return Vector.of(vector1.x - vector2.x, vector1.y - vector2.y);
    }

    static project(sourceVector: VectorLike, directionVector: Vector) {
        const dirVecMod = directionVector.getModulus();
        return dirVecMod && Vector.dot(sourceVector, directionVector) / dirVecMod;
    }

    static projectVector(sourceVector: VectorLike, directionVector: Vector) {
        return directionVector.clone().setModulus(Vector.project(sourceVector, directionVector));
    }

    static distance(vector1: VectorLike, vector2: VectorLike) {
        return distance(vector1.x, vector1.y, vector2.x, vector2.y);
    }

    constructor(x?: number, y?: number) {
        this.x = x || 0;
        this.y = y || 0;
    }

    x: number;
    y: number;

    clone() {
        return Vector.of(this.x, this.y);
    }

    set(x: number, y: number) {
        this.x = x;
        this.y = y;
        return this;
    }

    setVector(vector: VectorLike) {
        this.x = vector.x;
        this.y = vector.y;
        return this;
    }

    getModulus() {
        return _sqrt(_pow(this.x, 2) + _pow(this.y, 2));
    }

    setModulus(modulus: number) {
        const currentModulus = this.getModulus();
        if (currentModulus) {
            const scale = modulus / currentModulus;
            this.x *= scale;
            this.y *= scale;
        }
        return this;
    }

    add(dx: number, dy: number) {
        this.x += dx;
        this.y += dy;
        return this;
    }

    addVector(vector: VectorLike) {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }

    minus(dx: number, dy: number) {
        this.x -= dx;
        this.y -= dy;
        return this;
    }

    minusVector(vector: VectorLike) {
        this.x -= vector.x;
        this.y -= vector.y;
        return this;
    }

    scale(scaleX: number, scaleY = scaleX, origin?: VectorLike) {
        if (origin) {
            this.x = origin.x + (this.x - origin.x) * scaleX;
            this.y = origin.y + (this.y - origin.y) * scaleY;
        } else {
            this.x *= scaleX;
            this.y *= scaleY;
        }
        return this;
    }

    shrink(shrinkX: number, shrinkY = shrinkX, origin?: VectorLike) {
        if (origin) {
            this.x = origin.x + (this.x - origin.x) / shrinkX;
            this.y = origin.y + (this.y - origin.y) / shrinkY;
        } else {
            this.x /= shrinkX;
            this.y /= shrinkY;
        }
        return this;
    }

    rotate(radian: number, origin?: VectorLike) {
        const cos = _cos(radian),
            sin = _sin(radian);
        if (origin) {
            const dx = this.x - origin.x,
                dy = this.y - origin.y;
            this.x = origin.x + dx * cos - dy * sin;
            this.y = origin.y + dx * sin + dy * cos;
        } else {
            const { x, y } = this;
            this.x = x * cos - y * sin;
            this.y = x * sin + y * cos;
        }
        return this;
    }

    getAngle() {
        const { y } = this;
        return _atan(y / this.x) + (y > 0 ? 0 : _PI);
    }

    turn(clockwise?: boolean) {
        const { x, y } = this;
        if (clockwise) {
            this.x = -y;
            this.y = x;
        } else {
            this.x = y;
            this.y = -x;
        }
        return this;
    }

    reverse() {
        this.x = -this.x;
        this.y = -this.y;
        return this;
    }

    normalize() {
        const modulus = this.getModulus();
        this.x /= modulus;
        this.y /= modulus;
        return this;
    }

    toString(fractionDigits?: number) {
        return this.x.toFixed(fractionDigits) + ',' + this.y.toFixed(fractionDigits);
    }

}
