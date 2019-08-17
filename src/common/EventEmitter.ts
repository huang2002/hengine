import { _Map, _undefined } from "./references";
import { Utils } from "./Utils";

export type EventListener<T, A> = Utils.Callback<T, A, void>;

export type EventListenerRecord<T, A> = [EventListener<T, A>, boolean];

export class EventEmitter<E extends object = any> {

    constructor() {
        this.on = this.on.bind(this);
        this.off = this.off.bind(this);
        this.once = this.once.bind(this);
        this.emit = this.emit.bind(this as any);
        this.clearEvent = this.clearEvent.bind(this);
        this.clearEvents = this.clearEvents.bind(this);
    }

    private _listenerMap = new _Map<keyof E, EventListenerRecord<this, any>[]>();

    on<T extends keyof E>(event: T, listener: EventListener<this, E[T]>, once?: boolean) {
        const { _listenerMap } = this;
        if (_listenerMap.has(event)) {
            _listenerMap.get(event)!.push([listener, !once]);
        } else {
            _listenerMap.set(event, [[listener, !once]]);
        }
        return this;
    }

    off<T extends keyof E>(event: T, listener: EventListener<this, E[T]>, once?: boolean) {
        once = !once;
        const { _listenerMap } = this;
        if (_listenerMap.has(event)) {
            const records = _listenerMap.get(event)!,
                index = records.findIndex(
                    record =>
                        record[0] === listener &&
                        record[1] === once
                );
            if (~index) {
                Utils.removeIndex(records, index);
            }
        }
        return this;
    }

    once<T extends keyof E>(event: T, listener: EventListener<this, E[T]>) {
        return this.on(event, listener, true);
    }

    emit<T extends keyof E>(event: T, ...args: Utils.ToArray<E[T]>) {
        const { _listenerMap } = this;
        if (_listenerMap.has(event)) {
            const records = _listenerMap.get(event)!;
            if (records.length) {
                _listenerMap.set(event, records.filter(record => {
                    record[0].apply(this, args);
                    return record[1] && records.includes(record);
                }));
                return true;
            }
        }
        return false;
    }

    clearEvent<T extends keyof E>(event: T) {
        this._listenerMap.delete(event);
        return this;
    }

    clearEvents() {
        this._listenerMap.clear();
        return this;
    }

}
