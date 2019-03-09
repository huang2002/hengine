export const _null = null,
    _undefined = undefined,
    _Infinity = Infinity;

export const _window = window,
    { document: _document } = _window,
    _Object = Object,
    { assign: _assign } = _Object,
    _Map = Map,
    _Set = Set,
    _Math = Math,
    { sqrt: _sqrt, pow: _pow, sin: _sin, cos: _cos, PI: _PI,
        max: _max, min: _min, abs: _abs } = _Math,
    _Date = Date,
    { now: _now } = _Date,
    _setTimeout = setTimeout,
    _clearTimeout = clearTimeout;

export const EMPTY_OBJECT = _Object.create(_null) as Readonly<{}>;
