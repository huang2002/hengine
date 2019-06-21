import { _undefined, _assign } from "./references";

export class Pool<T, O = any> {

    constructor(
        readonly factory: new (options?: O) => T,
        public options?: O
    ) { }

    private _items = new Array<T>();

    get size() {
        return this._items.length;
    }
    set size(value: number) {
        this._items.length = value;
    }

    get() {
        const { _items } = this;
        if (_items.length) {
            return _items.shift()!;
        } else {
            const item = new this.factory(this.options);
            _items.push(item);
            return item;
        }
    }

    add(item: T) {
        this._items.push(item);
        return this;
    }

}
