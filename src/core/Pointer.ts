import { _assign, _window } from "../common/references";
import { Vector } from "../geometry/Vector";
import { EventEmitter } from "../common/EventEmitter";

// TODO: implement `Pointer`

export type PointerOptions = Partial<{
    target: EventTarget;
}>;

export interface PointerEvents {

}

export class Pointer extends EventEmitter<PointerEvents> implements Required<PointerOptions> {

    static defaults: PointerOptions = {
        target: _window,
    };

    constructor(options?: PointerOptions) {
        super();
        _assign(this, Pointer.defaults, options);



    }

    readonly position = new Vector();
    target!: EventTarget;



}