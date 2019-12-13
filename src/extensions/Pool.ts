export type PoolCallback<T> = (item: T) => void;

export interface PoolOptions<T, O = any> {
    options?: O;
    initializer?: PoolCallback<T> | null;
    cleaner?: PoolCallback<T> | null;
}

export class Pool<T, O = any> implements Required<PoolOptions<T, O>>{

    constructor(
        readonly factory: new (options?: O) => T,
        options?: PoolOptions<T, O>
    ) {
        Object.assign(this, options);
    }

    options!: O;
    initializer!: PoolCallback<T> | null;
    cleaner!: PoolCallback<T> | null;
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
        const { _items } = this,
            item = _items.length ? _items.shift()! : new this.factory(this.options);
        if (this.initializer) {
            this.initializer(item);
        }
        return item;
    }

    add(item: T) {
        this._items.push(item);
        if (this.cleaner) {
            this.cleaner(item);
        }
        return this;
    }

}
