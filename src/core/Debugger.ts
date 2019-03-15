import { _assign } from "../utils/refs";

export type DebuggerOptions = Partial<{

}>;

export class Debugger implements Required<DebuggerOptions> {

    static Defaults: DebuggerOptions = {

    };

    constructor(options?: DebuggerOptions) {
        _assign(this, Debugger.Defaults, options);
    }



}
