import { EventEmitter } from "../utils/EventEmitter";
import { _assign, _undefined, _abs, _Infinity } from "../utils/references";
import { Vector, VectorLike } from "../geometry/Vector";
import { FilterTag, Filter } from "./Filter";
import { Bounds } from "../geometry/Bounds";
import { Renderable } from "../renderer/Renderer";
import { EMPTY_OBJECT, DOUBLE_PI } from "../utils/common";

export interface Projection {
    min: number;
    max: number;
}

export type BodyOptions = Partial<{
    tag: FilterTag;
    filter: number;
    collisionFilter: number;
    isSensor: boolean;
    isCircle: boolean;
    active: boolean;
    position: Vector;
    acceleration: Vector;
    velocity: Vector;
    maxSpeed: number;
    angularSpeed: number;
    maxAngularSpeed: number;
    gravity: Vector;
    density: number;
    mass: number;
    stiffness: number;
    elasticity: number;
    roughness: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    fixRotation: boolean;
    radius: number;
}>;

export interface BodyEvents {
    willUpdate: number;
    didUpdate: number;
    collision: [Body, Vector];
}

export abstract class Body extends EventEmitter<BodyEvents> implements Required<BodyOptions>, Renderable {

    static normalPrecision = 3;

    static defaults: BodyOptions = {
        filter: 0,
        collisionFilter: 0,
        isSensor: false,
        isCircle: false,
        active: false,
        maxSpeed: 100,
        maxAngularSpeed: 0,
        gravity: Vector.of(0, 5),
        density: .01,
        stiffness: .9,
        elasticity: .5,
        roughness: .6,
        fixRotation: true,
        radius: 0,
    };

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

        if (options.filter) {
            this.tag = Filter.tagFor(options.filter) || '';
        } else if (options.tag) {
            this.filter = Filter.for(options.tag);
        }

        if (options.scaleX !== _undefined || options.scaleY !== _undefined) {
            this.scale(this.scaleX, this.scaleY);
        }

    }

    readonly active!: boolean;
    readonly tag: FilterTag = '';
    readonly filter!: number;
    readonly collisionFilter!: number;
    readonly isSensor!: boolean;
    readonly isCircle!: boolean;
    readonly bounds = new Bounds();
    readonly area = 0;
    readonly normals: ReadonlyArray<Vector> = [];
    readonly scaleX = 1;
    readonly scaleY = 1;
    readonly rotation = 0;
    readonly density!: number;
    readonly mass = 0;
    position!: Vector;
    acceleration!: Vector;
    velocity!: Vector;
    maxSpeed!: number;
    angularSpeed = 0;
    maxAngularSpeed!: number;
    gravity!: Vector;
    stiffness!: number;
    elasticity!: number;
    roughness!: number;
    fixRotation!: boolean;
    radius!: number;

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

    protected _scale?(scaleX: number, scaleY: number, origin?: VectorLike): void;
    protected _rotate?(rotation: number, origin?: VectorLike): void;
    abstract getClosest(target: VectorLike): Vector;
    abstract project(direction: Vector): Projection;
    abstract render(context: CanvasRenderingContext2D): void;

    setScale(scaleX: number, scaleY = scaleX) {
        const deltaScaleX = scaleX / this.scaleX,
            deltaScaleY = scaleY / this.scaleY,
            scale = deltaScaleX * deltaScaleY;
        (this.area as number) *= scale;
        (this.mass as number) *= scale;
        if (this._scale) {
            this._scale(deltaScaleX, deltaScaleY);
        }
        (this.scaleX as number) = scaleX;
        (this.scaleY as number) = scaleY;
        this.position.scale(deltaScaleX, deltaScaleY);
        return this;
    }

    scale(scaleX: number, scaleY = scaleX, origin?: VectorLike) {
        const scale = scaleX * scaleY;
        (this.area as number) *= scale;
        (this.mass as number) *= scale;
        if (this._scale) {
            this._scale(scaleX, scaleY, origin);
        }
        (this.scaleX as number) *= scaleX;
        (this.scaleY as number) *= scaleY;
        this.position.scale(scaleX, scaleY, origin);
        return this;
    }

    shrink(shrinkX: number, shrinkY = shrinkX, origin?: VectorLike) {
        const shrink = shrinkX * shrinkY;
        (this.area as number) /= shrink;
        (this.mass as number) /= shrink;
        if (this._scale) {
            this._scale(1 / shrinkX, 1 / shrinkY, origin);
        }
        (this.scaleX as number) /= shrinkX;
        (this.scaleY as number) /= shrinkY;
        this.position.shrink(shrinkX, shrinkY, origin);
        return this;
    }

    setRotation(rotation: number, origin?: VectorLike) {
        const deltaRotation = rotation - this.rotation;
        if (this._rotate) {
            this._rotate(deltaRotation, origin);
        }
        (this.rotation as number) = rotation;
        this.position.rotate(deltaRotation, origin);
        return this;
    }

    rotate(rotation: number, origin?: VectorLike) {
        if (this._rotate) {
            this._rotate(rotation, origin);
        }
        (this.rotation as number) += rotation;
        this.position.rotate(rotation, origin);
        return this;
    }

    applyForce(force: VectorLike, point?: VectorLike) {
        const { mass } = this;
        this.acceleration.plus(force.x / mass, force.y / mass);
        // TODO: update angular speed

        return this;
    }

    update(timeScale: number) {
        this.emit('willUpdate', timeScale);
        if (this.active) {
            const { velocity, maxSpeed, angularSpeed, maxAngularSpeed } = this;
            velocity.plusVector(this.acceleration, timeScale);
            velocity.plusVector(this.gravity, timeScale);
            const speed = velocity.getModulus();
            if (speed > maxSpeed) {
                velocity.scale(maxSpeed / speed);
            }
            this.position.plusVector(velocity, timeScale);
            this.bounds.moveVector(velocity);
            if (angularSpeed > maxAngularSpeed) {
                (this.rotation as number) += (this.angularSpeed = maxAngularSpeed);
            } else {
                (this.rotation as number) += angularSpeed;
            }
            if (this.fixRotation) {
                (this.rotation as number) %= DOUBLE_PI;
            }
        }
        this.emit('didUpdate', timeScale);
        return this;
    }

}
