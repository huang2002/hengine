import { EventEmitter } from "../utils/EventEmitter";
import { EMPTY_OBJECT, _assign, _undefined, _abs, _Infinity } from "../utils/refs";
import { Vector } from "../geometry/Vector";
import { FilterTag, Filter } from "./Filter";
import { Bounds } from "../geometry/Bounds";
import { Renderable } from "../renderer/Renderer";

export interface Projection {
    min: number;
    max: number;
}

export type BodyOptions = Partial<{
    tag: FilterTag;
    filter: number;
    collisionFilter: number;
    isSensor: boolean;
    active: boolean;
    position: Vector;
    velocity: Vector;
    acceleration: Vector;
    gravity: Vector;
    density: number;
    mass: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
}>;

export interface BodyEvents {
    willUpdate: number;
    didUpdate: number;
}

export abstract class Body extends EventEmitter<BodyEvents> implements Required<BodyOptions>, Renderable {

    static NormalPrecision = 3;

    static defaults: BodyOptions = {
        filter: 0,
        collisionFilter: 0,
        isSensor: false,
        active: false,
        density: .01,
    };

    static defaultGravity = Vector.of(0, 5);

    constructor(options: Readonly<BodyOptions> = EMPTY_OBJECT) {
        super();

        _assign(this, Body.defaults, options);

        if (!options.position) {
            this.position = new Vector();
        }
        if (!options.velocity) {
            this.velocity = new Vector();
        }
        if (!options.acceleration) {
            this.acceleration = new Vector();
        }
        if (!options.gravity) {
            this.gravity = Body.defaultGravity;
        }

        if (options.filter) {
            this.tag = Filter.tagFor(options.filter) || '';
        } else if (options.tag) {
            this.filter = Filter.for(options.tag);
        }

        if (options.scaleX !== _undefined || options.scaleY !== _undefined) {
            this.scale(this.scaleX, this.scaleY);
        }

    }

    readonly area = 0;
    readonly normals: ReadonlyArray<Vector> = [];
    readonly scaleX = 1;
    readonly scaleY = 1;
    readonly rotation = 0;
    readonly density!: number;
    readonly mass = 0;
    readonly active!: boolean;
    readonly tag: FilterTag = '';
    readonly filter!: number;
    readonly collisionFilter!: number;
    readonly isSensor!: boolean;
    readonly bounds = new Bounds();
    position!: Vector;
    velocity!: Vector;
    acceleration!: Vector;
    gravity!: Vector;

    setDensity(density: number) {
        (this.density as number) = density;
        if (this.active) {
            (this.mass as number) = this.area * density;
        }
        return this;
    }

    setMass(mass: number) {
        if (this.active) {
            (this.mass as number) = mass;
        }
        (this.density as number) = mass / this.area;
        return this;
    }

    activate(active = true) {
        (this.mass as number) = ((this.active as boolean) = active) ? this.area * this.density : _Infinity;
        return this;
    }

    protected abstract _scale(scaleX: number, scaleY: number, origin?: Vector): void;
    protected abstract _rotate(rotation: number, origin?: Vector): void;
    abstract project(direction: Vector): Projection;
    abstract render(context: CanvasRenderingContext2D): void;

    setScale(scaleX: number, scaleY = scaleX) {
        const deltaScaleX = scaleX / this.scaleX,
            deltaScaleY = scaleY / this.scaleY,
            scale = deltaScaleX * deltaScaleY;
        (this.area as number) *= scale;
        (this.mass as number) *= scale;
        this._scale(deltaScaleX, deltaScaleY);
        (this.scaleX as number) = scaleX;
        (this.scaleY as number) = scaleY;
        this.position.scale(deltaScaleX, deltaScaleY);
        return this;
    }

    scale(scaleX: number, scaleY = scaleX, origin?: Vector) {
        const scale = scaleX * scaleY;
        (this.area as number) *= scale;
        (this.mass as number) *= scale;
        this._scale(scaleX, scaleY, origin);
        (this.scaleX as number) *= scaleX;
        (this.scaleY as number) *= scaleY;
        this.position.scale(scaleX, scaleY, origin);
        return this;
    }

    shrink(shrinkX: number, shrinkY = shrinkX, origin?: Vector) {
        const shrink = shrinkX * shrinkY;
        (this.area as number) /= shrink;
        (this.mass as number) /= shrink;
        this._scale(1 / shrinkX, 1 / shrinkY, origin);
        (this.scaleX as number) /= shrinkX;
        (this.scaleY as number) /= shrinkY;
        this.position.shrink(shrinkX, shrinkY, origin);
        return this;
    }

    setRotation(rotation: number, origin?: Vector) {
        const deltaRotation = rotation - this.rotation;
        this._rotate(deltaRotation, origin);
        (this.rotation as number) = rotation;
        this.position.rotate(deltaRotation, origin);
        return this;
    }

    rotate(rotation: number, origin?: Vector) {
        this._rotate(rotation, origin);
        (this.rotation as number) += rotation;
        this.position.rotate(rotation, origin);
        return this;
    }

    applyForce(force: Vector) {
        this.acceleration.addVector(
            force.clone().shrink(this.mass)
        );
        return this;
    }

    update(timeScale: number) {
        this.emit('willUpdate', timeScale);
        if (this.active) {
            const { velocity } = this;
            this.position.addVector(
                velocity.addVector(
                    Vector.mix([
                        this.acceleration,
                        this.gravity
                    ]).scale(timeScale)
                ).clone().scale(timeScale)
            );
            this.bounds.moveVector(velocity);
        }
        this.emit('didUpdate', timeScale);
        return this;
    }

}
