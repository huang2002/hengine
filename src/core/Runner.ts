import { EMPTY_OBJECT, _assign } from "../utils/refs";

export type RunnerOptions = Partial<{

}>;

export class Runner implements Required<RunnerOptions> {

    static Defaults: RunnerOptions = {

    };

    constructor(options: Readonly<RunnerOptions> = EMPTY_OBJECT) {
        _assign(this, options);



    }



}
