import { _assign, _window, _null, _Map } from "../common/references";
import { Vector, VectorLike } from "../geometry/Vector";
import { EventEmitter } from "../common/EventEmitter";
import { BodyLike } from "../physics/Body";
import { Bounds } from "../geometry/Bounds";

export type PointerTransform = (position: Vector) => Vector;

export type PointerOptions = Partial<{
    target: EventTarget;
    transform: null | PointerTransform;
    isTouchMode: boolean;
    holdOnly: boolean;
    clickThreshold: number;
    radius: number;
}>;

export type PointerEventParameters = [Vector, number, Event];

export interface PointerEvents {
    start: PointerEventParameters;
    move: PointerEventParameters;
    end: PointerEventParameters;
    click: PointerEventParameters;
}

export class Pointer extends EventEmitter<PointerEvents> implements Required<PointerOptions>, BodyLike {

    static defaults: PointerOptions = {
        target: _window,
        transform: _null,
        isTouchMode: navigator.maxTouchPoints > 0,
        clickThreshold: 1000,
    };

    constructor(options?: PointerOptions) {
        super();
        _assign(this, Pointer.defaults, options);

        const { target } = this;
        if (this.isTouchMode) {
            target.addEventListener('touchstart', this.startListener = ((event: TouchEvent) => {
                const touchPoint = event.changedTouches[0];
                this._start(touchPoint.identifier, Vector.of(touchPoint.clientX, touchPoint.clientY), event);
            }) as EventListener);
            target.addEventListener('touchmove', this.moveListener = ((event: TouchEvent) => {
                const touchPoint = event.changedTouches[0];
                this._move(touchPoint.identifier, Vector.of(touchPoint.clientX, touchPoint.clientY), event);
            }) as EventListener);
            target.addEventListener('touchend', this.endListener = ((event: TouchEvent) => {
                const touchPoint = event.changedTouches[0];
                this._end(touchPoint.identifier, Vector.of(touchPoint.clientX, touchPoint.clientY), event);
            }) as EventListener);
        } else {
            target.addEventListener('mousedown', this.startListener = ((event: MouseEvent) => {
                this._start(-1, Vector.of(event.clientX, event.clientY), event);
            }) as EventListener);
            target.addEventListener('mousemove', this.moveListener = ((event: MouseEvent) => {
                this._move(-1, Vector.of(event.clientX, event.clientY), event);
            }) as EventListener);
            target.addEventListener('mouseup', this.endListener = ((event: MouseEvent) => {
                this._end(-1, Vector.of(event.clientX, event.clientY), event);
            }) as EventListener);
        }

    }

    readonly target!: EventTarget;
    readonly isTouchMode!: boolean;
    readonly isCircle = true;
    readonly position = new Vector();
    readonly bounds = new Bounds();
    readonly normals: [] = [];
    readonly active: boolean = true;
    readonly isHolding: boolean = false;
    readonly startTimeStamps = new _Map<number, number>();
    readonly positions = new _Map<number, Vector>();
    private startListener: EventListener;
    private moveListener: EventListener;
    private endListener: EventListener;
    holdOnly!: boolean;
    clickThreshold!: number;
    transform!: null | PointerTransform;
    radius!: number;

    private _setPosition(id: number, rawPosition: Vector, endFlag?: boolean) {
        const { bounds, radius, positions } = this,
            newPosition = this.transform ? this.transform(rawPosition) : rawPosition;
        this.position.setVector(newPosition);
        if (endFlag) {
            positions.delete(id);
        } else {
            positions.set(id, newPosition);
        }
        bounds.left = newPosition.x - radius;
        bounds.right = newPosition.x + radius;
        bounds.top = newPosition.y - radius;
        bounds.bottom = newPosition.y + radius;
    }

    private _start(id: number, rawPosition: Vector, event: Event) {
        (this.isHolding as boolean) = true;
        this.startTimeStamps.set(id, event.timeStamp);
        this._setPosition(id, rawPosition);
        this.emit('start', this.position, id, event);
    }

    private _move(id: number, rawPosition: Vector, event: Event) {
        if (this.holdOnly && !this.isHolding) {
            return;
        }
        this._setPosition(id, rawPosition);
        this.emit('move', this.position, id, event);
    }

    private _end(id: number, rawPosition: Vector, event: Event) {
        this._setPosition(id, rawPosition, true);
        (this.isHolding as boolean) = false;
        const { startTimeStamps } = this,
            startTimeStamp = startTimeStamps.get(id)!;
        startTimeStamps.delete(id);
        this.emit('end', this.position, id, event);
        if (event.timeStamp - startTimeStamp <= this.clickThreshold) {
            this.emit('click', this.position, id, event);
        }
    }

    getClosest(target: VectorLike) {
        return Vector.minus(target, this.position).setNorm(this.radius);
    }

    project(direction: Vector) {
        const { radius } = this,
            positionProjection = Vector.project(this.position, direction);
        return {
            min: positionProjection - radius,
            max: positionProjection + radius
        };
    }

    destroy() {
        (this.active as boolean) = false;
        const { target } = this;
        if (this.isTouchMode) {
            target.removeEventListener('touchstart', this.startListener);
            target.removeEventListener('touchmove', this.moveListener);
            target.removeEventListener('touchend', this.endListener);
        } else {
            target.removeEventListener('mousedown', this.startListener);
            target.removeEventListener('mousemove', this.moveListener);
            target.removeEventListener('mouseup', this.endListener);
        }
    }

}

Pointer.defaults.radius = Pointer.defaults.isTouchMode ? 5 : 0;
