import { Renderable, Renderer } from "../renderer/Renderer";
import { _assign, _null } from "../utils/references";
import { EventEmitter } from "../utils/EventEmitter";
import { RenderingStyle } from "../graph/Style";
import { EMPTY_OBJECT, removeIndex } from "../utils/Common";
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
            if (object.update) {
                object.update(timeScale);
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

                    body1.emit('collision', body2, separatingVector);
                    body2.emit('collision', body1, separatingVector);

                    const { velocity: v1, position: p1 } = body1,
                        { velocity: v2, position: p2 } = body2,
                        elasticity = body1.elasticity * body2.elasticity,
                        roughness = body1.roughness * body2.roughness,
                        edgeVector = separatingVector.clone().turn();
                    if (body1.active) {
                        if (body2.active) {
                            Vector.distribute(separatingVector, p1, p2, -body1.stiffness, body2.stiffness);
                            if (elasticity) {
                                Vector.distribute(separatingVector, v1, v2, -elasticity, elasticity);
                            }
                            if (roughness) {
                                const relativeVelocity = Vector.minus(v2, v1),
                                    relativeEdgeVelocity = Vector.projectVector(relativeVelocity, edgeVector)
                                v1.minusVector(relativeEdgeVelocity, roughness);
                                v2.minusVector(relativeEdgeVelocity, roughness);
                            }
                            // TODO: solve the rotations of body1 & body2 here
                        } else {
                            p1.minusVector(separatingVector, (body1.stiffness + body2.stiffness) / 2);
                            if (elasticity) {
                                v1.minusVector(separatingVector, elasticity);
                            }
                            if (roughness) {
                                v1.minusVector(Vector.projectVector(v1, separatingVector), roughness);
                            }
                            // TODO: solve the rotation of body1 here
                        }
                    } else {
                        if (body2.active) {
                            p2.plusVector(separatingVector, (body1.stiffness + body2.stiffness) / 2);
                            if (elasticity) {
                                v2.plusVector(separatingVector, elasticity);
                            }
                            if (roughness) {
                                v2.plusVector(Vector.projectVector(v2, separatingVector), roughness);
                            }
                            // TODO: solve the rotation of body2 here
                        }
                    }

                }
            }
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
