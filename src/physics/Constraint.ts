import { _assign } from "../utils/references";
import { Renderable, Renderer } from "../renderer/Renderer";

// TODO: finish `Constraint` implementation

export type ConstraintOptions = Partial<{

}>;

export class Constraint implements Required<ConstraintOptions>, Renderable {

    static defaults: ConstraintOptions = {

    };

    constructor(options?: ConstraintOptions) {
        _assign(this, Constraint.defaults, options);
    }

    render(renderer: Renderer) {

    }

}
