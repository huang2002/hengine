import {
    _PI, _sqrt, _pow, _window, _now, _undefined,
    _clearTimeout, _setTimeout, _Map, _Object, _null, _assign
} from "./references";

export namespace Utils {

    export type ToArray<T> = T extends any[] ? T : [T];

    export type Callback<T = void, A = any[], R = unknown> =
        (this: T, ...args: ToArray<A>) => R;

    export type DebounceCallback = Callback;

    export interface DebounceWrapper<T extends DebounceCallback> {
        (...args: Parameters<T>): void;
        delay: number;
    }

    export type ThrottleCallback = Callback<any>;

    export interface ThrottleWrapper<T extends ThrottleCallback> {
        (...args: Parameters<T>): ReturnType<T> | void;
        threshold: number;
    }

    export type CacheWrapper<T extends Callback<any>> =
        Callback<ThisParameterType<T>, Parameters<T>, ReturnType<T>> &
        { cache: Map<string, ReturnType<T>>; };

}

export const Utils = {

    Const: {
        EMPTY_OBJECT: _Object.create(_null) as {},
        DOUBLE_PI: _PI * 2,
        HALF_PI: _PI / 2,
        TRANSPARENT: 'rgba(0,0,0,0)',
    } as const,

    removeIndex(array: unknown[], index: number) {
        for (const end = array.length - 1; index < end; index++) {
            array[index] = array[index + 1];
        }
        array.length--;
    },

    mix(a: number, b: number, k: number) {
        return a + (b - a) * k;
    },

    rad2deg(rad: number) {
        return rad / _PI * 180;
    },

    deg2rad(deg: number) {
        return deg / 180 * _PI;
    },

    quadraticSum(a: number, b: number) {
        return a * a + b * b;
    },

    distance(x1: number, y1: number, x2: number, y2: number) {
        return _sqrt(Utils.quadraticSum(x2 - x1, y2 - y1));
    },

    debounce: _assign(
        function debounce<T extends Utils.DebounceCallback>(callback: T, delay?: number) {
            let timer: any;
            const wrapper: Utils.DebounceWrapper<T> = function debounceWrapper() {
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
        function throttle<T extends Utils.ThrottleCallback>(callback: T, threshold?: number) {
            let lastCallTime = 0;
            const wrapper: Utils.ThrottleWrapper<T> = function throttleWrapper(this: any) {
                const currentTime = _now();
                if (currentTime - lastCallTime >= wrapper.threshold) {
                    lastCallTime = currentTime;
                    return callback.apply(this, arguments as unknown as unknown[]) as ReturnType<T>;
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
        const wrapper = function cacheWrapper(
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
        wrapper.cache = map;
        return wrapper;
    },

} as const;
