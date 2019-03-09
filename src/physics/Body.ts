import { EventEmitter, Events } from "../utils/index";
import { EMPTY_OBJECT, _assign, _undefined, _abs, _Infinity } from "../utils/refs";
import { Vector, Bounds } from "../geometry/index";
import { FilterTag, Filter } from "./Filter";

export interface Projection {
    min: number;
    max: number;
}

export type BodyOptions = Partial<{
    tag: FilterTag;
    filter: number;
    collisionFilter: number;
    isStatic: boolean;
    position: Vector;
    velocity: Vector;
    acceleration: Vector;
    density: number;
    mass: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
}>;

export interface BodyEvents extends Events {
    update: [number];
}

export abstract class Body extends EventEmitter<BodyEvents> implements Required<BodyOptions> {

    static NORMAL_PRECISION = 3;

    static Defaults: BodyOptions = {
        filter: 0,
        collisionFilter: 0,
        isStatic: false,
        density: .01,
    };

    constructor(options: Readonly<BodyOptions> = EMPTY_OBJECT) {
        super();

        _assign(this, Body.Defaults, options);

        if (!options.position) {
            this.position = new Vector();
        }
        if (!options.velocity) {
            this.velocity = new Vector();
        }
        if (!options.acceleration) {
            this.acceleration = new Vector();
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
    tag: FilterTag = '';
    filter!: number;
    collisionFilter!: number;
    isStatic!: boolean;
    bounds = new Bounds();
    position!: Vector;
    velocity!: Vector;
    acceleration!: Vector;
    density!: number;
    mass = 0;
    scaleX = 1;
    scaleY = 1;
    rotation = 0;

    setDensity(density: number) {
        this.density = density;
        if (!this.isStatic) {
            this.mass = this.area * density;
        }
        return this;
    }

    setMass(mass: number) {
        if (!this.isStatic) {
            this.mass = mass;
        }
        this.density = mass / this.area;
        return this;
    }

    setStatic(isStatic = true) {
        this.mass = (this.isStatic = isStatic) ? _Infinity : this.area * this.density;
        return this;
    }

    protected abstract _scale(scaleX: number, scaleY: number, origin?: Vector): void;
    protected abstract _rotate(rotation: number, origin?: Vector): void;
    abstract project(direction: Vector): Projection;

    setScale(scaleX: number, scaleY = scaleX) {
        const deltaScaleX = scaleX / this.scaleX,
            deltaScaleY = scaleY / this.scaleY,
            scale = deltaScaleX * deltaScaleY;
        (this.area as number) *= scale;
        this.mass *= scale;
        this._scale(deltaScaleX, deltaScaleY);
        this.scaleX = scaleX;
        this.scaleY = scaleY;
        this.position.scale(deltaScaleX, deltaScaleY);
        return this;
    }

    scale(scaleX: number, scaleY = scaleX, origin?: Vector) {
        const scale = scaleX * scaleY;
        (this.area as number) *= scale;
        this.mass *= scale;
        this._scale(scaleX, scaleY, origin);
        this.scaleX *= scaleX;
        this.scaleY *= scaleY;
        this.position.scale(scaleX, scaleY, origin);
        return this;
    }

    shrink(shrinkX: number, shrinkY = shrinkX, origin?: Vector) {
        const shrink = shrinkX * shrinkY;
        (this.area as number) /= shrink;
        this.mass /= shrink;
        this._scale(1 / shrinkX, 1 / shrinkY, origin);
        this.scaleX /= shrinkX;
        this.scaleY /= shrinkY;
        this.position.shrink(shrinkX, shrinkY, origin);
        return this;
    }

    setRotation(rotation: number, origin?: Vector) {
        const deltaRotation = rotation - this.rotation;
        this._rotate(deltaRotation, origin);
        this.rotation = rotation;
        this.position.rotate(deltaRotation, origin);
        return this;
    }

    rotate(rotation: number, origin?: Vector) {
        this._rotate(rotation, origin);
        this.rotation += rotation;
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
        if (!this.isStatic) {
            const { velocity } = this;
            this.position.addVector(
                velocity.addVector(
                    this.acceleration.clone().scale(timeScale)
                ).clone().scale(timeScale)
            );
            this.bounds.moveVector(velocity);
        }
        this.emit('update', timeScale);
        return this;
    }

}
