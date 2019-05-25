import { _assign, _undefined, _clearTimeout, _setTimeout, _max, _window, _now } from "../common/references";
import { EventEmitter } from "../common/EventEmitter";

export type TimerOptions = Partial<{
    delay: number;
    allowRAF: boolean;
    fixDelay: boolean;
}>;

export interface TimerEvents {
    tick: number;
}

export class Timer extends EventEmitter<TimerEvents> implements Required<TimerOptions> {

    static RAFThreshold = 1000 / 60;

    static defaults: TimerOptions = {
        delay: Timer.RAFThreshold,
        allowRAF: true,
        fixDelay: true,
    };

    constructor(options?: Readonly<TimerOptions>) {
        super();

        _assign(this, Timer.defaults, options);

        this._tick = this._tick.bind(this);

    }

    readonly lastFrameDelay: number = 0;
    readonly lastFrameDuration: number = 0;
    readonly isRunning: boolean = false;
    delay!: number;
    allowRAF!: boolean;
    fixDelay!: boolean;

    private _timer?: number;
    private _usedRAF?: boolean;
    private _lastTickTime!: number;

    private _tick() {

        const startTime = _now(),
            deltaTime = (this.lastFrameDelay as number) = startTime - this._lastTickTime;

        this._lastTickTime = startTime;
        this.emit('tick', deltaTime);

        if (!this.isRunning) {
            return;
        }

        const duration = (this.lastFrameDuration as number) = _now() - startTime,
            delay = _max(this.delay - (this.fixDelay ? duration : 0), 0);
        this._timer = (this._usedRAF = delay <= Timer.RAFThreshold && this.allowRAF) ?
            _window.requestAnimationFrame(this._tick) :
            _setTimeout(this._tick, _max(delay, 0)) as unknown as number;

    }

    start() {
        (this.isRunning as boolean) = true;
        this._lastTickTime = _now();
        this._tick();
    }

    stop() {
        (this.isRunning as boolean) = false;
        const { _timer } = this;
        if (_timer !== _undefined) {
            (this._usedRAF ? _window.cancelAnimationFrame : _clearTimeout)(_timer);
            this._timer = _undefined;
        }
    }

}
