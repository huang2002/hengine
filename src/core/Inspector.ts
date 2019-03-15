import { _assign } from "../utils/refs";
import { Renderer } from "../renderer/Renderer";
import { Scene } from "./Scene";

export type InspectorOptions = Partial<{

}>;

export class Inspector implements Required<InspectorOptions> {

    static defaults: InspectorOptions = {

    };

    constructor(options?: InspectorOptions) {
        _assign(this, Inspector.defaults, options);
    }

    update(scene: Scene | null) {

    }

    render(renderer: Renderer) {

    }

}
