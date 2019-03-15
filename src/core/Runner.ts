import { _assign, _undefined, _cancelAnimationFrame, _clearTimeout, _requestAnimationFrame, _setTimeout, _max } from "../utils/refs";
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

    static Defaults: RunnerOptions = {
        delay: Runner.RAFThreshold,
        allowRAF: true,
        fixDelay: true,
    };

    constructor(options?: Readonly<RunnerOptions>) {
        super();

        _assign(this, Runner.Defaults, options);

        this._tick = this._tick.bind(this);

    }

    delay!: number;
    allowRAF!: boolean;
    fixDelay!: boolean;

    private _timer?: number;
    private _usedRAF?: boolean;
    private _lastTickTime!: number;

    private _tick(timestamp = now()) {

        const deltaTime = timestamp - this._lastTickTime;
        this._lastTickTime = timestamp;
        this.emit('tick', deltaTime);

        const delay = this.delay - (this.fixDelay ? now() - timestamp : 0);
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
