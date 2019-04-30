import { EventEmitter } from "../common/EventEmitter";
import { _assign, _undefined, _abs, _Infinity } from "../common/references";
import { Vector, VectorLike } from "../geometry/Vector";
import { CategoryTag, Category } from "./Category";
import { Bounds } from "../geometry/Bounds";
import { Renderable, Renderer } from "../renderer/Renderer";
import { Utils } from "../common/Utils";
import { PointerEventParameters } from "../core/Pointer";
import { CollisionInfo } from "./Collision";

export interface Projection {
    min: number;
    max: number;
}

export interface BodyLike {
    isCircle: boolean;
    radius: number;
    position: Vector;
    bounds: Bounds;
    normals: ReadonlyArray<Vector>;
    getClosest(target: VectorLike): Vector;
    project(direction: Vector): Projection;
}

export type BodyOptions = Partial<{
    tag: CategoryTag;
    category: number;
    collisionFilter: number;
    sensorFilter: number;
    isCircle: boolean;
    active: boolean;
    interactive: boolean;
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
    airFriction: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    fixRotation: boolean;
    radius: number;
}>;

export interface BodyEvents {
    willUpdate: number;
    didUpdate: number;
    collision: [Body, CollisionInfo];
    click: PointerEventParameters;
    // TODO: add drag events
}

export abstract class Body extends EventEmitter<BodyEvents>
    implements Required<BodyOptions>, BodyLike, Renderable {

    static normalPrecision = 3;

    static defaults: BodyOptions = {
        category: 0,
        collisionFilter: Category.FULL_MASK,
        sensorFilter: 0,
        isCircle: false,
        active: false,
        interactive: false,
        maxSpeed: 100,
        maxAngularSpeed: 0,
        gravity: Vector.of(0, 10),
        density: .01,
        stiffness: 1,
        elasticity: .5,
        roughness: .1,
        airFriction: 0,
        fixRotation: true,
        radius: 0,
    };

    constructor(options: Readonly<BodyOptions> = Utils.Const.EMPTY_OBJECT) {
        super();

        _assign(this, Body.defaults, options);

        if (!this.position) {
            this.position = new Vector();
        }
        if (!this.velocity) {
            this.velocity = new Vector();
        }
        if (!this.acceleration) {
            this.acceleration = new Vector();
        }

        if (this.category) {
            this.tag = Category.tagFor(this.category) || '';
        } else if (this.tag) {
            this.category = Category.for(this.tag);
        }

        const { scaleX, scaleY, rotation } = this;
        if (scaleX !== _undefined || scaleY !== _undefined) {
            this.scale(scaleX, scaleY);
        }
        if (rotation) {
            this.rotate(rotation);
        }

    }

    readonly tag: CategoryTag = '';
    readonly category!: number;
    readonly bounds = new Bounds();
    readonly area = 0;
    readonly normals: ReadonlyArray<Vector> = [];
    readonly scaleX = 1;
    readonly scaleY = 1;
    readonly rotation = 0;
    readonly density!: number;
    readonly mass = 0;
    active!: boolean;
    interactive!: boolean;
    collisionFilter!: number;
    sensorFilter!: number;
    isCircle!: boolean;
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
    airFriction!: number;
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
    abstract render(renderer: Renderer): void;

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

    move(deltaX: number, deltaY: number) {
        this.position.plus(deltaX, deltaY);
        this.bounds.move(deltaX, deltaY);
    }

    moveVector(vector: VectorLike, scale?: number) {
        this.position.plusVector(vector, scale);
        this.bounds.moveVector(vector, scale);
    }

    update(timeScale: number) {
        this.emit('willUpdate', timeScale);
        if (this.active) {
            const { velocity, maxSpeed, maxAngularSpeed } = this,
                airSpeedScale = 1 - this.airFriction,
                angularSpeed = this.angularSpeed *= airSpeedScale;
            velocity.plusVector(this.acceleration, timeScale)
                .plusVector(this.gravity, timeScale)
                .scale(airSpeedScale);
            const speed = velocity.getModulus();
            if (speed > maxSpeed) {
                velocity.scale(maxSpeed / speed);
            }
            this.position.plusVector(velocity, timeScale);
            this.bounds.moveVector(velocity, timeScale);
            if (angularSpeed > maxAngularSpeed) {
                (this.rotation as number) += (this.angularSpeed = maxAngularSpeed);
            } else {
                (this.rotation as number) += angularSpeed;
            }
            if (this.fixRotation) {
                (this.rotation as number) %= Utils.Const.DOUBLE_PI;
            }
        }
        this.emit('didUpdate', timeScale);
        return this;
    }

}
