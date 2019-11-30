import { Renderable } from "../renderer/Renderer";
import { Vector, VectorLike } from "../geometry/Vector";
import { Shape, ShapeOptions } from "./Shape";
import { Utils } from "../common/Utils";

export type CircleOptions = Omit<ShapeOptions, 'isCircle'>;

export class Circle extends Shape implements Required<CircleOptions>, Renderable {

    static defaults: CircleOptions = {
        radius: 1,
    };

    constructor(options: Readonly<CircleOptions> = Utils.Const.EMPTY_OBJECT) {
        super(Object.assign({}, Circle.defaults, options));
        if (this.radius) {
            this.updateRadius();
        }
    }

    readonly isCircle = true;
    radius!: number;

    updateRadius(radius?: number) {
        if (radius === undefined) {
            radius = this.radius;
        } else {
            this.radius = radius;
        }
        this._setArea(radius * radius * Math.PI);
        this.updateBounds();
    }

    updateBounds() {
        const { bounds, position: { x, y }, radius, rotation } = this,
            cos = Math.cos(rotation),
            sin = -Math.sin(rotation),
            a = radius * this.scaleX,
            b = radius * this.scaleY,
            halfWidth = Math.sqrt(Utils.quadraticSum(a * cos, b * sin)),
            halfHeight = Math.sqrt(Utils.quadraticSum(b * cos, a * sin));
        bounds.left = x - halfWidth;
        bounds.right = x + halfWidth;
        bounds.top = y - halfHeight;
        bounds.bottom = y + halfHeight;
    }

    getClosest(target: VectorLike) {
        const { position } = this,
            deltaVector = Vector.minus(target, position),
            angle = deltaVector.getAngle();
        return deltaVector.setNorm(this.radius * Math.sqrt(
            Utils.quadraticSum(Math.cos(angle) * this.scaleX, Math.sin(angle) * this.scaleY)
        )).plusVector(position);
    }

    project(direction: Vector) {
        const positionProjection = Vector.project(this.position, direction),
            angle = this.rotation - direction.getAngle(),
            halfLength = this.radius * Math.sqrt(
                Utils.quadraticSum(Math.cos(angle) * this.scaleX, Math.sin(angle) * this.scaleY)
            );
        return {
            min: positionProjection - halfLength,
            max: positionProjection + halfLength
        };
    }

    path(context: CanvasRenderingContext2D) {
        const { rotation, scaleX, scaleY } = this;
        context.rotate(rotation);
        context.scale(scaleX, scaleY);
        context.arc(0, 0, this.radius, 0, Utils.Const.DOUBLE_PI);
        context.rotate(-rotation);
        context.scale(1 / scaleX, 1 / scaleY);
    }

}
