import { EMPTY_OBJECT, _assign } from "../utils/refs";

export type EngineOptions = Partial<{

}>;

export class Engine implements Required<EngineOptions> {

    constructor(options: Readonly<EngineOptions> = EMPTY_OBJECT) {
        _assign(this, options);



    }



}
