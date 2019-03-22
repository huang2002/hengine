import { _Map, _undefined } from "./refs";
import { removeIndex, ToArray, Callback } from "./common";

export type EventListener<T> = Callback<void, T, void>;

export type EventListenerRecord<T> = [EventListener<T>, boolean];

export class EventEmitter<E extends object = any> {

    constructor() {
        this.on = this.on.bind(this);
        this.off = this.off.bind(this);
        this.once = this.once.bind(this);
        this.emit = this.emit.bind(this as any);
        this.clear = this.clear.bind(this);
        this.clearAll = this.clearAll.bind(this);
    }

    private _recordMap = new _Map<keyof E, EventListenerRecord<any>[]>();

    on<T extends keyof E>(event: T, listener: EventListener<E[T]>, once?: boolean) {
        const { _recordMap } = this;
        if (_recordMap.has(event)) {
            _recordMap.get(event)!.push([listener, !!once]);
        } else {
            _recordMap.set(event, [[listener, !!once]]);
        }
        return this;
    }

    off<T extends keyof E>(event: T, listener: EventListener<E[T]>, once?: boolean) {
        once = !!once;
        const { _recordMap } = this;
        if (_recordMap.has(event)) {
            const records = _recordMap.get(event)!,
                index = records.findIndex(
                    record =>
                        record[0] === listener &&
                        record[1] === once
                );
            if (!~index) {
                removeIndex(records, index);
            }
        }
        return this;
    }

    once<T extends keyof E>(event: T, listener: EventListener<E[T]>) {
        return this.on(event, listener, true);
    }

    emit<T extends keyof E>(event: T, ...args: ToArray<E[T]>) {
        const { _recordMap } = this;
        if (_recordMap.has(event)) {
            const records = _recordMap.get(event)!;
            if (records.length) {
                _recordMap.set(event, records.filter(record => {
                    record[0].apply(_undefined, args);
                    return record[1];
                }));
                return true;
            }
        }
        return false;
    }

    clear<T extends keyof E>(event: T) {
        this._recordMap.delete(event);
        return this;
    }

    clearAll() {
        this._recordMap.clear();
        return this;
    }

}
