import { EventEmitter } from "../common/EventEmitter";
import { TimingFunction, Timing } from "./Timing";
import { Utils } from "../common/Utils";
import { SceneEffect } from "../core/Scene";

export type TransitionOptions<T extends object = any> = Partial<{
    active: boolean;
    from: number;
    to: number;
    duration: number;
    delay: number;
    loop: boolean;
    timing: TimingFunction;
    target: T | null;
    key: keyof T;
}>;

export interface TransitionEvents {
    start: [];
    update: number;
    end: [];
}

export class Transition<T extends object = any>
    extends EventEmitter<TransitionEvents>
    implements Required<TransitionOptions>, SceneEffect {

    static defaults: TransitionOptions = {
        active: true,
        from: 0,
        to: 1,
        duration: 1000,
        delay: 0,
        loop: false,
        timing: Timing.linear,
        target: null,
    };

    constructor(options: Readonly<TransitionOptions<T>> = Utils.Const.EMPTY_OBJECT) {
        super();
        Object.assign(this, Transition.defaults, options);

        if (this.active) {
            this._startTime = Date.now();
        }
        const { target, key } = this;
        if (options.from === undefined && target) {
            this.from = target[key] as unknown as number;
        }
        if (options.to === undefined && target) {
            this.to = target[key] as unknown as number;
        }

    }

    active!: boolean;
    from!: number;
    to!: number;
    duration!: number;
    delay!: number;
    loop!: boolean;
    timing!: TimingFunction;
    target!: T | null;
    key!: keyof T;
    private _startTime!: number;
    private _pauseTime!: number;
    private _delay = 0;

    start() {
        this._startTime = Date.now();
        this.active = true;
        this._delay = 0;
        this.emit('start');
    }

    update() {
        if (!this.active) {
            return;
        }
        const { from, to } = this;
        let x = (Date.now() - this._startTime - this.delay - this._delay) / this.duration,
            value: number;
        if (x >= 1) {
            value = to;
        } else if (x <= 0) {
            value = from;
        } else {
            value = Utils.mix(from, to, this.timing(x));
        }
        const { target } = this;
        if (target) {
            (target[this.key] as unknown as number) = value;
        }
        this.emit('update', value);
        if (x >= 1) {
            this.active = false;
            this.emit('end');
            if (this.loop) {
                this.start();
            }
        }
    }

    pause() {
        this.active = false;
        this._pauseTime = Date.now();
    }

    resume() {
        this._delay += Date.now() - this._pauseTime;
        this.active = true;
    }

    finish() {
        this.emit('update', this.to);
        this.active = false;
        this.emit('end');
    }

}
