import { _assign, _undefined, _clearTimeout, _setTimeout, _max, _window } from "../common/references";
import { EventEmitter } from "../common/EventEmitter";
import { Utils } from "../common/Utils";

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
    readonly isRunning: boolean = false;
    delay!: number;
    allowRAF!: boolean;
    fixDelay!: boolean;

    private _timer?: number;
    private _usedRAF?: boolean;
    private _lastTickTime!: number;

    private _tick(startTime = Utils.now()) {

        const deltaTime = (this.lastFrameDelay as number) = startTime - this._lastTickTime;
        this._lastTickTime = startTime;
        this.emit('tick', deltaTime);

        const duration = (this.lastFrameDuration as number) = Utils.now() - startTime,
            delay = this.delay - (this.fixDelay ? duration : 0);
        this._timer = (this._usedRAF = delay <= Runner.RAFThreshold && this.allowRAF) ?
            _window.requestAnimationFrame(this._tick) :
            _setTimeout(this._tick, _max(delay, 0));

    }

    start() {
        (this.isRunning as boolean) = true;
        this._tick(this._lastTickTime = Utils.now());
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
