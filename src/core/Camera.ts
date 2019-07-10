import { Vector, VectorLike } from "../geometry/Vector";
import { _assign, _cos, _sin } from "../common/references";

export type CameraOptions = Partial<{
    position: Vector;
    scale: Vector;
    rotation: number;
}>;

export class Camera implements Required<CameraOptions> {

    static defaults: CameraOptions = {
        rotation: 0,
    };

    constructor(options?: CameraOptions) {
        _assign(this, Camera.defaults, options);

        if (!this.position) {
            this.position = new Vector();
        }
        if (!this.scale) {
            this.scale = new Vector(1, 1);
        }

    }

    position!: Vector;
    scale!: Vector;
    rotation!: number;

    applyTo(context: CanvasRenderingContext2D) {
        const { position, scale } = this,
            { x: scaleX, y: scaleY } = scale;
        context.transform(
            scaleX, 0,
            0, scaleY,
            -position.x * scaleX, -position.y * scaleY
        );
        context.rotate(this.rotation);
    }

    restore(context: CanvasRenderingContext2D) {
        const { position, scale } = this;
        context.rotate(-this.rotation);
        context.transform(
            1 / scale.x, 0,
            0, 1 / scale.y,
            position.x, position.y
        );
    }

    toViewPosition(position: VectorLike) {
        const { position: pos, scale, rotation } = this,
            cos = _cos(rotation),
            sin = -_sin(rotation),
            tx = (position.x + pos.x) / scale.x,
            ty = (position.y + pos.y) / scale.y;
        return Vector.of(
            tx * cos - ty * sin,
            tx * sin + ty * cos
        );
    }

    toGlobalPosition(position: VectorLike) {
        const { position: pos, scale, rotation } = this,
            cos = _cos(rotation),
            sin = _sin(rotation),
            tx = position.x * scale.x - pos.x,
            ty = position.y * scale.y - pos.y;
        return Vector.of(
            tx * cos - ty * sin,
            tx * sin + ty * cos
        );
    }

}
