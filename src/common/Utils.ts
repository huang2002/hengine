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
        lastCallTime: number;
    }

    export type CacheWrapper<T extends Callback<any>> =
        Callback<ThisParameterType<T>, Parameters<T>, ReturnType<T>> &
        { cache: Map<string, ReturnType<T>>; };

}

export const Utils = {

    Const: {
        EMPTY_OBJECT: Object.create(null) as {},
        DOUBLE_PI: Math.PI * 2,
        HALF_PI: Math.PI / 2,
        TRANSPARENT: 'rgba(0,0,0,0)',
        IS_TOUCH_MODE: navigator.maxTouchPoints > 0 || /iOS|iPhone|iPod|iPad/.test(navigator.userAgent),
    } as const,

    removeIndex(array: unknown[], index: number) {
        if (!index) {
            array.shift();
        } else {
            const end = array.length - 1;
            if (index < end) {
                for (; index < end; index++) {
                    array[index] = array[index + 1];
                }
                array.length--;
            } else {
                array.pop();
            }
        }
    },

    insert<T = unknown>(array: T[], index: number, item: T) {
        if (!index) {
            array.unshift(item);
        } else if (index < array.length) {
            const end = array.length++ - 1;
            for (let i = end; i >= index; i--) {
                array[i + 1] = array[i];
            }
            array[index] = item;
        } else {
            array.push(item);
        }
    },

    mix(a: number, b: number, k: number) {
        if (a === Infinity) {
            if (b === a) {
                return a;
            } else if (b === -a) {
                return NaN;
            }
        } else if (a === -Infinity) {
            if (b === a) {
                return a;
            } else if (b === -a) {
                return NaN;
            }
        }
        return a + (b - a) * k;
    },

    random(min: number, max: number) {
        return Utils.mix(min, max, Math.random());
    },

    pick<T = unknown>(options: T[]) {
        return options[Math.floor(options.length * Math.random())];
    },

    rad2deg(rad: number) {
        return rad / Math.PI * 180;
    },

    deg2rad(deg: number) {
        return deg / 180 * Math.PI;
    },

    quadraticSum(a: number, b: number) {
        return a * a + b * b;
    },

    distance(x1: number, y1: number, x2: number, y2: number) {
        return Math.sqrt(Utils.quadraticSum(x2 - x1, y2 - y1));
    },

    debounce: Object.assign(
        function debounce<T extends Utils.DebounceCallback>(callback: T, delay?: number) {
            let timer: any;
            const wrapper: Utils.DebounceWrapper<T> = function debounceWrapper() {
                if (timer !== undefined) {
                    clearTimeout(timer);
                }
                type ApplyArgs = [Utils.Callback<void>, number, ...any[]];
                timer = setTimeout.apply(
                    window,
                    ([callback, wrapper.delay] as ApplyArgs).concat(arguments) as ApplyArgs
                );
            };
            wrapper.delay = delay || Utils.debounce.defaultDelay;
            return wrapper;
        }, {
        defaultDelay: 100
    }
    ),

    throttle: Object.assign(
        function throttle<T extends Utils.ThrottleCallback>(callback: T, threshold?: number) {
            const wrapper: Utils.ThrottleWrapper<T> = function throttleWrapper(this: any) {
                const currentTime = Date.now();
                if (currentTime - wrapper.lastCallTime >= wrapper.threshold) {
                    wrapper.lastCallTime = currentTime;
                    return callback.apply(this, arguments as unknown as unknown[]) as ReturnType<T>;
                }
            };
            wrapper.lastCallTime = 0;
            wrapper.threshold = threshold || Utils.throttle.defaultThreshold;
            return wrapper;
        }, {
        defaultThreshold: 100
    }
    ),

    cache<T extends Utils.Callback<any>>(fn: T): Utils.CacheWrapper<T> {
        const map = new Map<string, ReturnType<T>>();
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
