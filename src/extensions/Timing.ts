
export type TimingFunction = (x: number) => number;

const interpolate = (p1: number, p2: number, t: number) => {
    const _t = 1 - t;
    return 3 * p1 * _t * _t * t + 3 * p2 * t * t * _t + t * t * t;
};

const cubic = (x1: number, y1: number, x2: number, y2: number): TimingFunction => x => {
    if (x <= 0) {
        return 0;
    } else if (x >= 1) {
        return 1;
    }
    const { accuracy } = cubic;
    let l = 0,
        r = 1,
        t = .5,
        cur: number;
    while (Math.abs((cur = (interpolate(x1, x2, t))) - x) > accuracy) {
        if (cur > x) {
            r = t;
        } else {
            l = t;
        }
        t = (l + r) / 2;
    }
    return interpolate(y1, y2, t);
};
cubic.accuracy = .001;

export const Timing = {
    linear: ((x: number) => x) as TimingFunction,
    cubic,
    ease: cubic(.25, .2, .25, 1),
    easeIn: cubic(.42, 0, 1, 1),
    easeOut: cubic(0, 0, .58, 1),
    easeInOut: cubic(.42, 0, 0.25, 1),
    steps(stepCount: number, start?: boolean): TimingFunction {
        const step = 1 / stepCount;
        return x => {
            let t = Math.floor(x / step);
            if (start && t < stepCount) {
                t += 1;
            }
            return t * step;
        };
    },
} as const;
