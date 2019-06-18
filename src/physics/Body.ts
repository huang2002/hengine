import { EventEmitter } from "../common/EventEmitter";
import { _assign, _undefined, _abs, _Infinity } from "../common/references";
import { Vector, VectorLike } from "../geometry/Vector";
import { CategoryTag, Category } from "./Category";
import { Bounds } from "../geometry/Bounds";
import { Renderable, RendererLike } from "../renderer/Renderer";
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
    draggable: boolean;
    defer: boolean;
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
    slop: number;
    elasticity: number;
    friction: number;
    staticFriction: number;
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
    dragStart: PointerEventParameters | [];
    dragEnd: PointerEventParameters | [];
}

export abstract class Body extends EventEmitter<BodyEvents>
    implements Required<BodyOptions>, BodyLike, Renderable {

    static normalPrecision = 3;
    static maxStaticSpeed = 1;

    static defaults: BodyOptions = {
        category: 0,
        collisionFilter: Category.FULL_MASK,
        sensorFilter: 0,
        isCircle: false,
        active: false,
        interactive: false,
        draggable: false,
        defer: false,
        maxSpeed: 200,
        angularSpeed: 0,
        maxAngularSpeed: 100,
        gravity: Vector.of(0, 2),
        density: 1,
        stiffness: 1,
        slop: .2,
        elasticity: .3,
        friction: .4,
        staticFriction: .5,
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

        if (this.draggable) {
            this.interactive = true;
        }

        if (this.friction > this.staticFriction) {
            this.friction = this.staticFriction;
        }

    }

    readonly tag: CategoryTag = '';
    readonly category!: number;
    readonly bounds = new Bounds();
    readonly area: number = 0;
    readonly normals: ReadonlyArray<Vector> = [];
    readonly scaleX: number = 1;
    readonly scaleY: number = 1;
    readonly rotation: number = 0;
    readonly density!: number;
    readonly mass: number = 0;
    readonly isStatic!: boolean;
    readonly speed: number = 0;
    active!: boolean;
    interactive!: boolean;
    draggable!: boolean;
    collisionFilter!: number;
    sensorFilter!: number;
    isCircle!: boolean;
    defer!: boolean;
    position!: Vector;
    acceleration!: Vector;
    velocity!: Vector;
    maxSpeed!: number;
    angularSpeed !: number;
    maxAngularSpeed!: number;
    gravity!: Vector;
    stiffness!: number;
    slop!: number;
    elasticity!: number;
    friction!: number;
    staticFriction!: number;
    airFriction!: number;
    fixRotation!: boolean;
    radius!: number;
    impulse = new Vector();

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

    protected _setArea(area: number) {
        (this.area as number) = area;
        (this.mass as number) = this.density * area;
    }

    activate(active = true) {
        (this.mass as number) = ((this.active as boolean) = active) ? this.area * this.density : _Infinity;
        return this;
    }

    protected _scale?(scaleX: number, scaleY: number, origin?: VectorLike): void;
    protected _rotate?(rotation: number, origin?: VectorLike): void;
    abstract getClosest(target: VectorLike): Vector;
    abstract project(direction: Vector): Projection;
    abstract render(renderer: RendererLike): void;

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
        if (origin) {
            this.position.scale(scaleX, scaleY, origin);
        }
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
        if (origin) {
            this.position.shrink(shrinkX, shrinkY, origin);
        }
        return this;
    }

    setRotation(rotation: number, origin?: VectorLike) {
        const deltaRotation = rotation - this.rotation;
        if (this._rotate) {
            this._rotate(deltaRotation, origin);
        }
        (this.rotation as number) = rotation;
        if (origin) {
            this.position.rotate(deltaRotation, origin);
        }
        return this;
    }

    rotate(rotation: number, origin?: VectorLike) {
        if (this._rotate) {
            this._rotate(rotation, origin);
        }
        (this.rotation as number) += rotation;
        if (origin) {
            this.position.rotate(rotation, origin);
        }
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
        return this;
    }

    moveVector(vector: VectorLike, scale?: number) {
        this.position.plusVector(vector, scale);
        this.bounds.moveVector(vector, scale);
        return this;
    }

    moveTo(x: number, y: number) {
        const { position } = this,
            deltaX = x - position.x,
            deltaY = y - position.y;
        this.position.plus(deltaX, deltaY);
        this.bounds.move(deltaX, deltaY);
        return this;
    }

    moveToVector(vector: VectorLike) {
        const deltaVector = Vector.minus(vector, this.position);
        this.position.plusVector(deltaVector);
        this.bounds.moveVector(deltaVector);
        return this;
    }

    update(timeScale: number) {
        this.emit('willUpdate', timeScale);
        const { velocity, impulse, bounds, position } = this;
        if (this.active) {
            const maxSpeed = this.maxSpeed;
            let speed = velocity.getNorm() / timeScale;
            if (speed > maxSpeed) {
                velocity.scale(maxSpeed / speed);
                speed = maxSpeed;
            }
            position.plusVector(velocity, timeScale);
            bounds.moveVector(velocity, timeScale);
            (this.isStatic as boolean) = ((this.speed as number) = speed) <= Body.maxStaticSpeed;
            const { acceleration } = this,
                maxAngularSpeed = this.maxAngularSpeed * timeScale,
                airSpeedScale = 1 - this.airFriction,
                angularSpeed = (this.angularSpeed *= airSpeedScale) * timeScale;
            velocity.plusVector(acceleration, timeScale)
                .plusVector(this.gravity, timeScale)
                .scale(airSpeedScale);
            acceleration.reset();
            if (angularSpeed > maxAngularSpeed) {
                (this.rotation as number) += (this.angularSpeed = maxAngularSpeed);
            } else {
                (this.rotation as number) += angularSpeed;
            }
            if (this.fixRotation) {
                (this.rotation as number) %= Utils.Const.DOUBLE_PI;
            }
        } else {
            (this.isStatic as boolean) = false;
        }
        position.plusVector(impulse);
        bounds.moveVector(impulse);
        impulse.reset();
        this.emit('didUpdate', timeScale);
    }

}
