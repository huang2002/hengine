import { _sqrt, _pow, _cos, _sin, _PI, _abs, _Math, _undefined } from "../common/references";
import { Utils } from "../common/Utils";

export interface VectorLike {
    x: number;
    y: number;
}

// TODO: add interface `ReadonlyVector`

export class Vector {

    static of(x: number, y: number) {
        return new Vector(x, y);
    }

    static from(vectorLike: VectorLike) {
        return Vector.of(vectorLike.x, vectorLike.y);
    }

    static plus(vectors: VectorLike[]) {
        return vectors.reduce((ans: Vector, cur) => ans.plusVector(cur), new Vector());
    }

    static mean(vectors: VectorLike[]) {
        return Vector.plus(vectors).shrink(vectors.length);
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
        const dirVecMod = directionVector.getNorm();
        return dirVecMod && Vector.dot(sourceVector, directionVector) / dirVecMod;
    }

    static projectVector(sourceVector: VectorLike, directionVector: Vector) {
        return directionVector.clone().setNorm(Vector.project(sourceVector, directionVector));
    }

    static distance(vector1: VectorLike, vector2: VectorLike) {
        return Utils.distance(vector1.x, vector1.y, vector2.x, vector2.y);
    }

    static distribute(
        vector0: VectorLike,
        vector1: VectorLike, vector2: VectorLike,
        k1: number, k2: number,
        scale?: number
    ) {
        let sum = _abs(k1) + _abs(k2);
        if (scale !== _undefined) {
            sum /= scale;
        }
        k1 /= sum;
        k2 /= sum;
        vector1.x += vector0.x * k1;
        vector1.y += vector0.y * k1;
        vector2.x += vector0.x * k2;
        vector2.y += vector0.y * k2;
    }

    static random(startAngle?: number, endAngle = Utils.Const.DOUBLE_PI) {
        const angle = Utils.mix(startAngle || 0, endAngle, _Math.random());
        return Vector.of(_cos(angle), _sin(angle));
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

    setVector(vector: VectorLike, scale?: number) {
        if (scale !== _undefined) {
            this.x = vector.x * scale;
            this.y = vector.y * scale;
        } else {
            this.x = vector.x;
            this.y = vector.y;
        }
        return this;
    }

    reset() {
        this.x = this.y = 0;
        return this;
    }

    getNorm() {
        return _sqrt(_pow(this.x, 2) + _pow(this.y, 2));
    }

    setNorm(norm: number) {
        const currentNorm = this.getNorm();
        if (currentNorm) {
            const scale = norm / currentNorm;
            this.x *= scale;
            this.y *= scale;
        }
        return this;
    }

    plus(dx: number, dy: number) {
        this.x += dx;
        this.y += dy;
        return this;
    }

    plusVector(vector: VectorLike, scale?: number) {
        if (scale !== _undefined) {
            this.x += vector.x * scale;
            this.y += vector.y * scale;
        } else {
            this.x += vector.x;
            this.y += vector.y;
        }
        return this;
    }

    minus(dx: number, dy: number) {
        this.x -= dx;
        this.y -= dy;
        return this;
    }

    minusVector(vector: VectorLike, scale?: number) {
        if (scale !== _undefined) {
            this.x -= vector.x * scale;
            this.y -= vector.y * scale;
        } else {
            this.x -= vector.x;
            this.y -= vector.y;
        }
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

    grow(delta: number) {
        const norm = this.getNorm();
        if (norm) {
            const scale = (norm + delta) / norm;
            this.x *= scale;
            this.y *= scale;
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
        const { x } = this;
        return _Math.atan(this.y / x) + (x > 0 ? 0 : _PI);
    }

    turn(clockwise?: boolean) {
        const { x, y } = this;
        if (clockwise) {
            this.x = y;
            this.y = -x;
        } else {
            this.x = -y;
            this.y = x;
        }
        return this;
    }

    reverse() {
        this.x = -this.x;
        this.y = -this.y;
        return this;
    }

    normalize() {
        const norm = this.getNorm();
        this.x /= norm;
        this.y /= norm;
        return this;
    }

    isZero() {
        return this.x === 0 && this.y === 0;
    }

    toString(fractionDigits?: number) {
        return this.x.toFixed(fractionDigits) + ',' + this.y.toFixed(fractionDigits);
    }

}
