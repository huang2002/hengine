import { Renderable, Renderer } from "../renderer/Renderer";
import { _assign, EMPTY_OBJECT, _null } from "../utils/references";
import { EventEmitter } from "../utils/EventEmitter";
import { RenderingStyle } from "../graph/CommonStyle";
import { removeIndex } from "../utils/common";
import { Body } from "../physics/Body";
import { CollisionChecker } from "../physics/CollisionChecker";
import { Vector } from "../geometry/Vector";

export type SceneObject = Body | Renderable;

export type SceneOptions = Partial<{
    delay: number;
    fps: number;
    timeScale: number;
    background: RenderingStyle | null;
    clean: boolean;
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
        collisionChecker: CollisionChecker.Smart,
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

        const filteredObjects = new Array<Body>();

        this.objects.forEach(object => {
            if ((object as Body).update) {
                (object as Body).update(timeScale);
                if ((object as Body).filter && (object as Body).collisionFilter) {
                    filteredObjects.push(object as Body);
                }
            }
        });

        const { collisionChecker } = this;
        if (collisionChecker) {
            const filteredObjectCount = filteredObjects.length;
            for (let i = 0; i < filteredObjectCount; i++) {
                const body1 = filteredObjects[i];
                for (let j = i + 1; j < filteredObjectCount; j++) {
                    const body2 = filteredObjects[j];

                    if (!(body1.filter & body2.collisionFilter && body1.collisionFilter & body2.filter)) {
                        continue;
                    }

                    const separatingVector = collisionChecker(body1, body2);
                    if (!separatingVector) {
                        continue;
                    }

                    // TODO: emit collision events

                    const { velocity: v1, position: p1 } = body1,
                        { velocity: v2, position: p2 } = body2;

                    // TODO: solve static bodies
                    Vector.distribute(separatingVector, p1, p2, -body1.stiffness, body2.stiffness);

                    // TODO: finish collision checking

                }
            }
        }

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
