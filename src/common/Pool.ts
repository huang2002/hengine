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
        const { _items } = this,
            { length: currentSize } = _items;
        _items.length = value;
        if (currentSize < value) {
            for (let i = currentSize; i < value; i++) {
                _items[i] = new this.factory(this.options);
            }
        }
    }

    get() {
        const { _items } = this;
        if (_items.length) {
            return _items.shift()!;
        } else {
            const item = new this.factory(this.options);
            return item;
        }
    }

    add(item: T) {
        this._items.push(item);
        return this;
    }

}
