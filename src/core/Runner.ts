import { _assign, _undefined, _cancelAnimationFrame, _clearTimeout, _requestAnimationFrame, _setTimeout, _max } from "../utils/references";
import { EventEmitter } from "../utils/EventEmitter";
import { now } from "../utils/common";

export type RunnerOptions = Partial<{
    delay: number;
    allowRAF: boolean;
    fixDelay: boolean;
}>;

export interface RunnerEvents {
    tick: number;
}

export class Runner extends EventEmitter<RunnerEvents> implements Required<RunnerOptions> {

    static RAFThreshold = 1000 / 60;

    static defaults: RunnerOptions = {
        delay: Runner.RAFThreshold,
        allowRAF: true,
        fixDelay: true,
    };

    constructor(options?: Readonly<RunnerOptions>) {
        super();

        _assign(this, Runner.defaults, options);

        this._tick = this._tick.bind(this);

    }

    readonly lastFrameDelay: number = 0;
    readonly lastFrameDuration: number = 0;
    delay!: number;
    allowRAF!: boolean;
    fixDelay!: boolean;

    private _timer?: number;
    private _usedRAF?: boolean;
    private _lastTickTime!: number;

    private _tick(timestamp = now()) {

        const deltaTime = (this.lastFrameDelay as number) = timestamp - this._lastTickTime;
        this._lastTickTime = timestamp;
        this.emit('tick', deltaTime);

        const duration = (this.lastFrameDuration as number) = now() - timestamp,
            delay = this.delay - (this.fixDelay ? duration : 0);
        this._timer = (this._usedRAF = delay <= Runner.RAFThreshold && this.allowRAF) ?
            _requestAnimationFrame(this._tick) :
            _setTimeout(this._tick, _max(delay, 0));

    }

    start() {
        this._lastTickTime = now();
        this._tick();
    }

    stop() {
        const { _timer } = this;
        if (_timer !== _undefined) {
            (this._usedRAF ? _cancelAnimationFrame : _clearTimeout)(_timer);
            this._timer = _undefined;
        }
    }

}
