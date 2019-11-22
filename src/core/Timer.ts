import { EventEmitter } from "../common/EventEmitter";
import { Utils } from "../common/Utils";

export type ScheduleCallback<T extends any[] = any[]> = Utils.Callback<void, T, void>;

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

        Object.assign(this, Timer.defaults, options);

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
    private _lastStopTime!: number;
    private _timeoutId = 0;
    private _timeoutCallbacks = new Map<number, [ScheduleCallback<any>, number, any[]]>();
    private _intervalId = 0;
    private _intervalCallbacks = new Map<number, [ScheduleCallback<any>, number, number, any[]]>();

    private _requestTick(delay: number) {
        this._timer = (this._usedRAF = this.delay <= Timer.RAFThreshold && this.allowRAF) ?
            requestAnimationFrame(this._tick) :
            setTimeout(this._tick, Math.max(delay, 0)) as unknown as number;
    }

    private _tick() {
        const startTime = Date.now(),
            deltaTime = (this.lastFrameDelay as number) = startTime - this._lastTickTime,
            { _timer } = this;
        this._lastTickTime = startTime;
        const { _timeoutCallbacks } = this;
        _timeoutCallbacks.forEach((record, id) => {
            if (startTime >= record[1]) {
                record[0].apply(undefined, record[2]);
                _timeoutCallbacks.delete(id);
            }
        });
        this._intervalCallbacks.forEach(record => {
            if (startTime >= record[1]) {
                record[0].apply(undefined, record[3]);
                while (startTime >= record[1]) {
                    record[1] += record[2];
                }
            }
        });
        this.emit('tick', deltaTime);
        if (!this.isRunning) {
            return;
        }
        const duration = (this.lastFrameDuration as number) = Date.now() - startTime;
        if (this._timer === _timer) {
            this._requestTick(Math.max(this.delay - (this.fixDelay ? duration : 0), 0));
        }
    }

    start() {
        (this.isRunning as boolean) = true;
        const now = (this._lastTickTime = Date.now()),
            { _lastStopTime } = this;
        if (_lastStopTime !== undefined) {
            const delay = now - _lastStopTime;
            this._timeoutCallbacks.forEach(record => {
                record[1] += delay;
            });
            this._intervalCallbacks.forEach(record => {
                record[1] += delay;
            });
        }
        this._tick();
    }

    stop() {
        if (!this.isRunning) {
            return;
        }
        (this.isRunning as boolean) = false;
        this._lastStopTime = Date.now();
        const { _timer } = this;
        if (_timer !== undefined) {
            (this._usedRAF ? cancelAnimationFrame : clearTimeout)(_timer);
            this._timer = undefined;
        }
    }

    reschedule(delay: number) {
        this.delay = delay;
        if (delay < 0) {
            return this.stop();
        }
        if (this.isRunning) {
            this.stop();
            (this.isRunning as boolean) = true;
            const now = Date.now();
            this._requestTick(Math.max(delay - (now - this._lastTickTime), 0));
            this._lastTickTime = now;
        }
    }

    setTimeout<T extends any[] = any[]>(callback: ScheduleCallback<T>, timeout: number, ...args: T) {
        const id = this._timeoutId++;
        this._timeoutCallbacks.set(id, [callback, Date.now() + timeout, args]);
        return id;
    }

    clearTimeout(id: number) {
        this._timeoutCallbacks.delete(id);
    }

    setInterval<T extends any[] = any[]>(callback: ScheduleCallback<T>, interval: number, ...args: T) {
        const id = this._intervalId++;
        this._intervalCallbacks.set(id, [callback, Date.now() + interval, interval, args]);
        return id;
    }

    clearInterval(id: number) {
        this._intervalCallbacks.delete(id);
    }

}
