import { _assign } from "../common/references";
import { Renderer } from "../renderer/Renderer";
import { Paragraph } from "../graph/Paragraph";
import { Utils } from "../common/Utils";
import { Vector } from "../geometry/Vector";
import { Engine } from "./Engine";

export type InspectorCallback = Utils.Callback<void, Engine, string>;

export type InspectorOptions = Partial<{
    paragraph: Paragraph;
    callbacks: InspectorCallback[];
}>;

export class Inspector implements Required<InspectorOptions> {

    static defaults: InspectorOptions = {
        callbacks: [
            engine => `FPS: ${(1000 / engine.timer.lastFrameDelay).toFixed(3)}`,
            engine => `Frame Duration: ${engine.timer.lastFrameDuration.toFixed(3)}`,
            engine => `Objects: ${engine.currentScene ? engine.currentScene.objects.length : 0}`,
            engine => `Attachments: ${engine.currentScene ? engine.currentScene.attachments.length : 0}`,
            engine => {
                const { pointer: { position } } = engine;
                return `Pointer Position: ${position.x.toFixed()},${position.y.toFixed()}`;
            }
        ],
    };

    constructor(options: InspectorOptions = Utils.Const.EMPTY_OBJECT) {
        _assign(this, Inspector.defaults, options);

        if (!options.paragraph) {
            this.paragraph = new Paragraph({
                position: Vector.of(-230, -150),
                lineHeight: 15,
                style: {
                    font: '10px Consolas',
                    textAlign: 'left',
                    textBaseline: 'top',
                    fillStyle: '#0ff',
                    strokeStyle: '#00f',
                },
            });
        }

    }

    readonly paragraph!: Paragraph;
    callbacks!: InspectorCallback[];

    update(engine: Engine) {
        this.paragraph.lines = this.callbacks.map(callback => callback(engine));
    }

    render(renderer: Renderer) {
        renderer.render(this.paragraph);
    }

}
