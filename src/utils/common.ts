import { _PI, _sqrt, _pow, _window, _now, _Date, _undefined, _clearTimeout, _setTimeout } from "./refs";

export const removeIndex = function rmIndex(array: unknown[], index: number) {
    const end = array.length - 1;
    for (; index < end; index++) {
        array[index] = array[index + 1];
    }
    array.length--;
};

export const mix = (a: number, b: number, k: number) => a * k + b * (1 - k);

export const rad2deg = (rad: number) => rad / _PI * 180;

export const deg2rad = (deg: number) => deg / 180 * _PI;

export const quadraticSum = (a: number, b: number) => _pow(a, 2) + _pow(b, 2);

export const distance = (x1: number, y1: number, x2: number, y2: number) =>
    _sqrt(quadraticSum(x2 - x1, y2 - y1));

export const now = (_window.performance || _Date).now;

export type Callback<T=void, A = unknown[], R = unknown> =
    (this: T, ...args: A extends any[] ? A : [A]) => R;

export type DebounceCallback = Callback;

export interface DebounceWrapper<F extends DebounceCallback> {
    (...args: Parameters<F>): void;
    delay: number;
}

export const debounce = <F extends DebounceCallback>(callback: F, initDelay?: number) => {
    let timer: any;
    const wrapper: DebounceWrapper<F> = function () {
        if (timer !== _undefined) {
            _clearTimeout(timer);
        }
        type ApplyArgs = [Callback<void>, number, ...any[]];
        timer = _setTimeout.apply(
            _window,
            ([callback, wrapper.delay] as ApplyArgs).concat(arguments) as ApplyArgs
        );
    };
    wrapper.delay = initDelay || debounce.DEFAULT_DELAY;
    return wrapper;
};

debounce.DEFAULT_DELAY = 100;

export type ThresholdCallback = Callback<any>;

export interface ThresholdWrapper<F extends ThresholdCallback> {
    (...args: Parameters<F>): ReturnType<F> | void;
    threshold: number;
}

export const threshold = <F extends ThresholdCallback>(callback: F, initThreshold?: number) => {
    let lastCallTime = 0;
    const wrapper: ThresholdWrapper<F> = function (this: any) {
        const currentTime = _now();
        if (currentTime - lastCallTime >= wrapper.threshold) {
            lastCallTime = currentTime;
            return callback.apply(this, arguments as unknown as unknown[]) as ReturnType<F>;
        }
    };
    wrapper.threshold = initThreshold || threshold.DEFAULT_THRESHOLD;
    return wrapper;
};

threshold.DEFAULT_THRESHOLD = 100;

export type ToArray<T> = T extends any[] ? T : [T];
