import { _Map, _undefined } from "./refs";
import { removeIndex } from "./common";

export interface Events {
    [event: string]: any[];
}

export type EventListenerRecord<T extends any[]> = [EventListener<T>, boolean];

export type EventListener<T extends any[]> = (...args: T) => void;

export class EventEmitter<E extends Events = Events> {

    private _listenerMap = new _Map<keyof E, EventListenerRecord<any>[]>();

    on<T extends keyof E>(event: T, listener: EventListener<E[T]>, once?: boolean) {
        const { _listenerMap } = this;
        if (_listenerMap.has(event)) {
            _listenerMap.get(event)!.push([listener, !!once]);
        } else {
            _listenerMap.set(event, [[listener, !!once]]);
        }
        return this;
    }

    off<T extends keyof E>(event: T, listener: EventListener<E[T]>, once?: boolean) {
        once = !!once;
        const { _listenerMap } = this;
        if (_listenerMap.has(event)) {
            const records = _listenerMap.get(event)!,
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

    emit<T extends keyof E>(event: T, ...args: E[T]) {
        const { _listenerMap } = this;
        if (_listenerMap.has(event)) {
            const records = _listenerMap.get(event)!;
            if (records.length) {
                _listenerMap.set(event, records.filter(record => {
                    record[0].apply(_undefined, args);
                    return record[1];
                }));
                return true;
            }
        }
        return false;
    }

    clear<T extends keyof E>(event: T) {
        this._listenerMap.delete(event);
        return this;
    }

    clearAll() {
        this._listenerMap.clear();
        return this;
    }

}
