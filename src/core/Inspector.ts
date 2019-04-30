import { _assign, _null } from "../common/references";
import { Renderer } from "../renderer/Renderer";
import { Paragraph } from "../graph/Paragraph";
import { Utils } from "../common/Utils";
import { Vector } from "../geometry/Vector";
import { Engine } from "./Engine";
import { RenderingStyle } from "../graph/Style";
import { BodyLike } from "../physics/Body";
import { Bounds } from "../geometry/Bounds";

export type InspectorCallback = Utils.Callback<void, Engine, string>;

export type InspectorOptions = Partial<{
    paragraph: Paragraph;
    callbacks: InspectorCallback[];
    boundsStroke: RenderingStyle | null;
    boundsWidth: number;
}>;

export class Inspector implements Required<InspectorOptions> {

    static defaults: InspectorOptions = {
        callbacks: [
            engine => `FPS: ${(1000 / engine.timer.lastFrameDelay).toFixed(3)}`,
            engine => `Frame Duration: ${engine.timer.lastFrameDuration.toFixed(3)}`,
            engine => `Objects: ${engine.currentScene ? engine.currentScene.objects.length : 0}`,
            engine => `Attachments: ${engine.currentScene ? engine.currentScene.attachments.length : 0}`,
            engine => `Pointer Position: ${engine.pointer.position}`,
        ],
        boundsStroke: _null,
        boundsWidth: 1,
    };

    constructor(options: InspectorOptions = Utils.Const.EMPTY_OBJECT) {
        _assign(this, Inspector.defaults, options);

        if (!this.paragraph) {
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
    boundsStroke!: RenderingStyle | null;
    boundsWidth!: number;
    private _boundaries?: Bounds[] | null;

    update(engine: Engine) {
        const { currentScene } = engine;
        this._boundaries = currentScene && currentScene.objects
            .concat(currentScene.attachments)
            .map(object => (object as BodyLike).bounds)
            .filter(Boolean) as Bounds[];
        this.paragraph.lines = this.callbacks.map(callback => callback(engine));
    }

    render(renderer: Renderer) {
        const { _boundaries } = this;
        if (this.boundsStroke && _boundaries && _boundaries.length) {
            const { context } = renderer;
            context.strokeStyle = this.boundsStroke;
            context.lineWidth = this.boundsWidth;
            _boundaries.forEach(bounds => {
                context.strokeRect(bounds.left, bounds.top, bounds.width, bounds.height);
            });
        }
        renderer.render(this.paragraph);
    }

}
