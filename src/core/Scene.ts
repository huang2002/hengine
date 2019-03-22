import { Renderable, Renderer } from "../renderer/Renderer";
import { _assign, EMPTY_OBJECT } from "../utils/references";
import { EventEmitter } from "../utils/EventEmitter";
import { RenderingStyle } from "../graph/CommonStyle";
import { removeIndex } from "../utils/common";
import { Body } from "../physics/Body";

export type SceneObject = Body | Renderable;

export type SceneOptions = Partial<{
    delay: number;
    fps: number;
    timeScale: number;
    background: RenderingStyle | null;
    clean: boolean;
    objects: SceneObject[];
    attachments: Renderable[];
}>;

export interface SceneEvents {
    enter: [];
    willUpdate: number;
    didUpdate: number;
    willRender: CanvasRenderingContext2D;
    didRender: CanvasRenderingContext2D;
    exit: [];
}

export class Scene extends EventEmitter<SceneEvents> implements Required<SceneOptions> {

    static defaults: SceneOptions = {
        delay: 0,
        timeScale: 1,
        background: '#fff',
        clean: false,
    };

    constructor(options: SceneOptions = EMPTY_OBJECT) {
        super();

        _assign(this, Scene.defaults, options);

        if (!options.objects) {
            this.objects = [];
        }
        if (!options.attachments) {
            this.attachments = [];
        }

    }

    delay!: number;
    timeScale!: number;
    background!: RenderingStyle | null;
    clean!: boolean;
    objects!: SceneObject[];
    attachments!: Renderable[];

    set fps(fps: number) {
        this.delay = 1000 / fps;
    }
    get fps() {
        return 1000 / this.delay;
    }

    add(object: SceneObject) {
        this.objects.push(object);
        return this;
    }

    remove(object: SceneObject) {
        const { objects } = this,
            index = objects.indexOf(object);
        if (~index) {
            removeIndex(objects, index);
        }
        return this;
    }

    attach(renderable: Renderable) {
        this.attachments.push(renderable);
        return this;
    }

    detach(renderable: Renderable) {
        const { attachments } = this,
            index = attachments.indexOf(renderable);
        if (~index) {
            removeIndex(attachments, index);
        }
        return this;
    }

    update(timeScale: number) {
        timeScale *= this.timeScale;
        this.emit('willUpdate', timeScale);
        this.objects.forEach(object => {
            if ((object as Body).update) {
                (object as Body).update(timeScale);
            }
        });

        this.emit('didUpdate', timeScale);
    }

    render(renderer: Renderer) {
        const { background } = this,
            { context } = renderer;
        this.emit('willRender', context);
        if (renderer.restoration) {
            context.save();
        }
        if (background) {
            context.fillStyle = background;
            context.fillRect(renderer.left, renderer.top, renderer.width, renderer.height);
        } else {
            context.clearRect(renderer.left, renderer.top, renderer.width, renderer.height);
        }
        this.objects.concat(this.attachments).forEach(renderable => {
            renderable.render(context);
        });
        if (renderer.restoration) {
            context.restore();
        }
        this.emit('didRender', context);
    }

}
