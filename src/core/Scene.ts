import { Renderable, Renderer } from "../renderer/Renderer";
import { _assign, _null, _undefined } from "../common/references";
import { EventEmitter } from "../common/EventEmitter";
import { RenderingStyle } from "../graph/Style";
import { Utils } from "../common/Utils";
import { Body } from "../physics/Body";
import { Collision, CollisionChecker } from "../physics/Collision";
import { Pointer } from "./Pointer";
import { Vector } from "../geometry/Vector";
import { Constraint } from "../physics/Constraint";

export interface SceneEffect {
    defer?: boolean;
    update(timeScale: number): void;
}

export type SceneObject = Body | Renderable & Partial<SceneEffect>;

export type SceneOptions = Partial<{
    delay: number;
    fps: number;
    timeScale: number;
    background: RenderingStyle | null;
    clean: boolean
    pointer: Pointer | null;
    objects: SceneObject[];
    attachments: SceneObject[];
    effects: SceneEffect[];
    collisionChecker: CollisionChecker | null;
    pointerChecker: CollisionChecker | null;
    pointerConstraint: Constraint | null;
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
        pointer: _null,
        collisionChecker: Collision.Checker.Smart,
        pointerChecker: Collision.Checker.Smart,
    };

    constructor(options: SceneOptions = Utils.Const.EMPTY_OBJECT) {
        super();

        this._onPointerClick = this._onPointerClick.bind(this);
        this._onPointerStart = this._onPointerStart.bind(this);
        this._onPointerEnd = this._onPointerEnd.bind(this);

        _assign(this, Scene.defaults, options);

        if (!this.pointerConstraint) {
            this.pointerConstraint = new Constraint();
        }
        if (!this.objects) {
            this.objects = [];
        }
        if (!this.attachments) {
            this.attachments = [];
        }
        if (!this.effects) {
            this.effects = [];
        }

    }

    active = false;
    delay!: number;
    timeScale!: number;
    background!: RenderingStyle | null;
    clean!: boolean;
    objects!: SceneObject[];
    attachments!: SceneObject[];
    effects!: SceneEffect[];
    collisionChecker!: CollisionChecker | null;
    pointerChecker!: CollisionChecker | null;
    pointerConstraint!: Constraint | null;
    private _pointer!: Pointer | null;
    private _pointerPosition = new Vector();

    set fps(fps: number) {
        this.delay = 1000 / fps;
    }
    get fps() {
        return 1000 / this.delay;
    }

    set pointer(pointer: Pointer | null) {
        const { pointerConstraint, _pointer } = this;
        if (_pointer) {
            _pointer.off('click', this._onPointerClick);
            _pointer.off('start', this._onPointerStart);
            _pointer.off('end', this._onPointerEnd);
            if (!pointer && pointerConstraint && pointerConstraint.target) {
                pointerConstraint.target.emit('dragEnd');
            }
        }
        if (this._pointer = pointer) {
            pointer!.on('click', this._onPointerClick);
            pointer!.on('start', this._onPointerStart);
            pointer!.on('end', this._onPointerEnd);
        }
        if (pointerConstraint) {
            pointerConstraint.origin = pointer && pointer.position;
        }
    }
    get pointer() {
        return this._pointer;
    }

    private _onPointerClick(position: Vector, id: number, event: Event) {
        if (!this.active) {
            return;
        }
        const { pointerChecker } = this;
        if (!pointerChecker) {
            return;
        }
        const focus = this.getFocus();
        if (focus) {
            focus.emit('click', position, id, event);
        }
    }

    private _draggableFilter(body: Body) {
        return body.draggable;
    }

    private _onPointerStart(position: Vector, id: number, event: Event) {
        const { pointerConstraint } = this;
        if (!pointerConstraint) {
            return;
        }
        this._pointerPosition.setVector(position);
        if (pointerConstraint.target) {
            pointerConstraint.target.emit('dragEnd', position, id, event);
        }
        const focus = this.getFocus(this._draggableFilter);
        if (focus) {
            pointerConstraint.target = focus;
            pointerConstraint.targetOffset.setVector(position).minusVector(focus.position);
            focus.emit('dragStart', position, id, event);
        } else {
            pointerConstraint.target = _null;
        }
    }

    private _onPointerEnd(position: Vector, id: number, event: Event) {
        const { pointerConstraint } = this,
            target = pointerConstraint && pointerConstraint.target;
        if (target) {
            pointerConstraint!.target = _null;
            target.emit('dragEnd', position, id, event);
            if (!target.active) {
                target.velocity.reset();
            }
        }
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

    attach(object: SceneObject) {
        this.attachments.push(object);
        return this;
    }

    detach(object: SceneObject) {
        const { attachments } = this,
            index = attachments.indexOf(object);
        if (~index) {
            Utils.removeIndex(attachments, index);
        }
        return this;
    }

    use(effect: SceneEffect) {
        this.effects.push(effect);
        return this;
    }

    disuse(effect: SceneEffect) {
        const { effects } = this,
            index = effects.indexOf(effect);
        if (~index) {
            Utils.removeIndex(effects, index);
        }
        return this;
    }

    getFocus(filter?: Utils.Callback<void, Body, any>) {
        const { pointerChecker } = this;
        if (!pointerChecker) {
            return;
        }
        const { _pointer } = this,
            bodies = this.objects.concat(this.attachments)
                .filter(
                    object => (object as Body).interactive && (!filter || filter(object as Body))
                ) as Body[];
        for (let i = bodies.length; i--;) {
            const body = bodies[i];
            if (pointerChecker(_pointer!, body)) {
                return body;
            }
        }
        return _null;
    }

    update(timeScale: number) {
        timeScale *= this.timeScale;

        this.emit('willUpdate', timeScale);

        const deferredEffects = this.effects.filter(effect => {
            if (effect.defer) {
                return true;
            } else {
                effect.update(timeScale);
            }
        });

        const { pointerConstraint } = this;

        if (pointerConstraint) {
            pointerConstraint.update(timeScale);
        }

        const collidableBodies = new Array<Body>();

        this.objects.filter(object => {
            if (object.update) {
                if (object.defer) {
                    return true;
                } else {
                    object.update!(timeScale);
                }
                if ((object as Body).category && (object as Body).collisionFilter) {
                    collidableBodies.push(object as Body);
                }
            }
        }).forEach(object => {
            object.update!(timeScale);
        });

        const target = pointerConstraint && pointerConstraint.target,
            { _pointer } = this;
        if (target && _pointer) {
            const { position } = _pointer;
            target.velocity.setVector(position).minusVector(this._pointerPosition);
            this._pointerPosition.setVector(position);
        }

        const { collisionChecker } = this;
        if (collisionChecker) {
            Collision.check(collidableBodies, collisionChecker);
        }

        deferredEffects.forEach(effect => {
            effect.update(timeScale);
        });

        this.emit('didUpdate', timeScale);

    }

    render(renderer: Renderer) {
        const { context } = renderer;
        this.emit('willRender', context);
        renderer.fill(this.background);
        this.objects.concat(this.attachments).forEach(renderable => {
            renderer.render(renderable);
        });
        this.emit('didRender', context);
    }

}
