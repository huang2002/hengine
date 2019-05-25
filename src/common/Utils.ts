import {
    _PI, _sqrt, _pow, _window, _now, _undefined,
    _clearTimeout, _setTimeout, _Map, _Object, _null, _assign
} from "./references";

export namespace Utils {

    export type ToArray<T> = T extends any[] ? T : [T];

    export type Callback<T = void, A = any[], R = unknown> =
        (this: T, ...args: ToArray<A>) => R;

    export type DebounceCallback = Callback;

    export interface DebounceWrapper<F extends DebounceCallback> {
        (...args: Parameters<F>): void;
        delay: number;
    }

    export type ThrottleCallback = Callback<any>;

    export interface ThresholdWrapper<F extends ThrottleCallback> {
        (...args: Parameters<F>): ReturnType<F> | void;
        threshold: number;
    }

    export type CacheWrapper<T extends Callback<any>> =
        Callback<ThisParameterType<T>, Parameters<T>, ReturnType<T>> &
        { cache: Map<string, ReturnType<T>>; };

    export type ExcludeKeys<O, K extends keyof O> = Pick<O, Exclude<keyof O, K>>;

}

export const Utils = {

    Const: {
        EMPTY_OBJECT: _Object.create(_null) as {},
        DOUBLE_PI: _PI * 2,
        HALF_PI: _PI / 2,
        TRANSPARENT: 'rgba(0,0,0,0)',
    } as const,

    removeIndex(array: unknown[], index: number) {
        const end = array.length - 1;
        for (; index < end; index++) {
            array[index] = array[index + 1];
        }
        array.length--;
    },

    mix(a: number, b: number, k: number) {
        return a * k + b * (1 - k);
    },

    rad2deg(rad: number) {
        return rad / _PI * 180;
    },

    deg2rad(deg: number) {
        return deg / 180 * _PI;
    },

    quadraticSum(a: number, b: number) {
        return _pow(a, 2) + _pow(b, 2);
    },

    distance(x1: number, y1: number, x2: number, y2: number) {
        return _sqrt(Utils.quadraticSum(x2 - x1, y2 - y1));
    },

    debounce: _assign(
        function debounce<F extends Utils.DebounceCallback>(callback: F, delay?: number) {
            let timer: any;
            const wrapper: Utils.DebounceWrapper<F> = function debounceWrapper() {
                if (timer !== _undefined) {
                    _clearTimeout(timer);
                }
                type ApplyArgs = [Utils.Callback<void>, number, ...any[]];
                timer = _setTimeout.apply(
                    _window,
                    ([callback, wrapper.delay] as ApplyArgs).concat(arguments) as ApplyArgs
                );
            };
            wrapper.delay = delay || Utils.debounce.defaultDelay;
            return wrapper;
        }, {
            defaultDelay: 100
        }
    ),

    throttle: _assign(
        function throttle<F extends Utils.ThrottleCallback>(callback: F, threshold?: number) {
            let lastCallTime = 0;
            const wrapper: Utils.ThresholdWrapper<F> = function throttleWrapper(this: any) {
                const currentTime = _now();
                if (currentTime - lastCallTime >= wrapper.threshold) {
                    lastCallTime = currentTime;
                    return callback.apply(this, arguments as unknown as unknown[]) as ReturnType<F>;
                }
            };
            wrapper.threshold = threshold || Utils.throttle.defaultThreshold;
            return wrapper;
        }, {
            defaultThreshold: 100
        }
    ),

    cache<T extends Utils.Callback<any>>(fn: T): Utils.CacheWrapper<T> {
        const map = new _Map<string, ReturnType<T>>();
        const cacheWrapper = function cacheWrapper(
            this: ThisParameterType<T>, ...args: Utils.ToArray<Parameters<T>>
        ) {
            const parameters = args.join();
            if (map.has(parameters)) {
                return map.get(parameters) as ReturnType<T>;
            } else {
                const result = fn.apply(this, args) as ReturnType<T>;
                map.set(parameters, result);
                return result;
            }
        };
        cacheWrapper.cache = map;
        return cacheWrapper;
    },

} as const;
