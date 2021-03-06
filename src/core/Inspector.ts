import { Renderer } from "../renderer/Renderer";
import { Paragraph } from "../graphics/Paragraph";
import { Utils } from "../common/Utils";
import { Vector } from "../geometry/Vector";
import { Engine } from "./Engine";
import { RenderingStyle } from "../graphics/Style";
import { Body } from "../physics/Body";
import { SceneObject } from "./Scene";
import { Camera } from "./Camera";

export type InspectorCallback = Utils.Callback<void, Engine, string>;

export type InspectorOptions = Partial<{
    paragraph: Paragraph;
    callbacks: InspectorCallback[];
    boundsStroke: RenderingStyle | null;
    boundsStrokeWidth: number;
    velocityStroke: RenderingStyle | null;
    velocityStrokeWidth: number;
    velocityStrokeScale: number;
}>;

export class Inspector implements Required<InspectorOptions> {

    static defaults: InspectorOptions = {
        callbacks: [
            engine => {
                const { currentScene: scene } = engine;
                return `FPS: ${scene && scene.delay >= 0 ?
                    (1000 / engine.timer.lastFrameDelay).toFixed(3) : 0}`;
            },
            engine => `Frame Duration: ${engine.timer.lastFrameDuration}`,
            engine => `Objects: ${engine.currentScene ? engine.currentScene.objects.length : 0}`,
            engine => `Effects: ${engine.currentScene ? engine.currentScene.effects.length : 0}`,
            engine => `Attachments: ${engine.currentScene ? engine.currentScene.attachments.length : 0}`,
            engine => `Pointer Position: ${engine.pointer.position}`,
        ],
        boundsStroke: null,
        boundsStrokeWidth: 1,
        velocityStroke: null,
        velocityStrokeWidth: 1,
        velocityStrokeScale: 1,
    };

    constructor(options?: Readonly<InspectorOptions>) {
        Object.assign(this, Inspector.defaults, options);

        if (!this.paragraph) {
            this.paragraph = new Paragraph({
                position: Vector.of(-230, -150),
                lineHeight: 15,
                style: {
                    font: '10px Consolas',
                    textAlign: 'left',
                    textBaseline: 'top',
                    fillStyle: '#00f',
                    strokeStyle: null,
                },
            });
        }

    }

    readonly paragraph!: Paragraph;
    callbacks!: InspectorCallback[];
    boundsStroke!: RenderingStyle | null;
    boundsStrokeWidth!: number;
    private _objects?: SceneObject[] | null;
    private _camera!: Camera | null;
    velocityStroke!: RenderingStyle | null;
    velocityStrokeWidth!: number;
    velocityStrokeScale!: number;

    update(engine: Engine) {
        const { currentScene } = engine;
        this._objects = currentScene && currentScene.objects
            .concat(currentScene.attachments);
        this._camera = currentScene && currentScene.camera;
        this.paragraph.lines = this.callbacks.map(callback => callback(engine));
    }

    render(renderer: Renderer) {
        const { _objects, _camera } = this,
            { context } = renderer;
        if (_objects) {
            if (_camera) {
                _camera.applyTo(context);
            }
            if (this.boundsStroke && _objects.length) {
                context.beginPath();
                _objects.forEach(object => {
                    const { bounds } = object as Body;
                    if (bounds) {
                        context.rect(bounds.left, bounds.top, bounds.width, bounds.height);
                    }
                });
                context.strokeStyle = this.boundsStroke;
                context.lineWidth = this.boundsStrokeWidth;
                context.stroke();
            }
            if (this.velocityStroke) {
                const { velocityStrokeScale } = this;
                context.beginPath();
                _objects.forEach(object => {
                    const { velocity } = object as Body;
                    if (velocity) {
                        const { position } = object as Body,
                            { x, y } = position;
                        context.moveTo(x, y);
                        context.lineTo(
                            x + velocity.x * velocityStrokeScale,
                            y + velocity.y * velocityStrokeScale
                        );
                    }
                });
                context.strokeStyle = this.velocityStroke;
                context.lineWidth = this.velocityStrokeWidth;
                context.stroke();
            }
            if (_camera) {
                _camera.restore(context);
            }
        }
        renderer.render(this.paragraph);
    }

}
