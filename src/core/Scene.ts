import { Renderable, Renderer } from "../renderer/Renderer";
import { _assign, _null } from "../common/references";
import { EventEmitter } from "../common/EventEmitter";
import { RenderingStyle } from "../graph/Style";
import { Utils } from "../common/Utils";
import { Body } from "../physics/Body";
import { Collision, CollisionChecker } from "../physics/Collision";
import { Pointer } from "./Pointer";

// TODO: add `pointer` to `scene`

export type SceneObject = Body | Renderable;

export type SceneOptions = Partial<{
    delay: number;
    fps: number;
    timeScale: number;
    background: RenderingStyle | null;
    clean: boolean
    pointer: Pointer | null;
    objects: SceneObject[];
    attachments: Renderable[];
    collisionChecker: CollisionChecker | null;
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
        collisionChecker: Collision.Checker.Smart,
        pointer: _null,
    };

    constructor(options: SceneOptions = Utils.Const.EMPTY_OBJECT) {
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
    pointer!: Pointer | null;
    objects!: SceneObject[];
    attachments!: Renderable[];
    collisionChecker!: CollisionChecker;

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
            Utils.removeIndex(objects, index);
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
            Utils.removeIndex(attachments, index);
        }
        return this;
    }

    update(timeScale: number) {
        timeScale *= this.timeScale;

        this.emit('willUpdate', timeScale);

        const collidableBodies = new Array<Body>();

        this.objects.forEach(object => {
            if (object.update) {
                object.update(timeScale);
                if ((object as Body).category && (object as Body).collisionFilter) {
                    collidableBodies.push(object as Body);
                }
            }
        });

        const { collisionChecker } = this;
        if (collisionChecker) {
            Collision.check(collidableBodies, collisionChecker);
        }

        this.emit('didUpdate', timeScale);

    }

    render(renderer: Renderer) {
        const { context } = renderer;
        this.emit('willRender', context);
        if (renderer.restoration) {
            context.save();
        }
        if (this.background) {
            context.fillStyle = this.background;
            context.fillRect(renderer.left, renderer.top, renderer.width, renderer.height);
        } else {
            context.clearRect(renderer.left, renderer.top, renderer.width, renderer.height);
        }
        this.objects.concat(this.attachments).forEach(renderable => {
            renderable.render(renderer);
        });
        if (renderer.restoration) {
            context.restore();
        }
        this.emit('didRender', context);
    }

}
