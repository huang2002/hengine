import { Timer } from "./Timer";
import { Renderer } from "../renderer/Renderer";
import { Scene, SceneOptions } from "./Scene";
import { Inspector } from "./Inspector";
import { Utils } from "../common/Utils";
import { Pointer } from "./Pointer";
import { EventEmitter } from "../common/EventEmitter";

export type EngineOptions = Partial<{
    timer: Timer;
    renderer: Renderer;
    pointer: Pointer;
    inspector: Inspector | null;
    baseTime: number;
    maxDelay: number;
    currentScene: Scene | null;
    rerenderOnResize: boolean;
    restoration: boolean;
}>;

export interface EngineEvents {
    willUpdate: number;
    didUpdate: number;
    willRender: Renderer;
    didRender: Renderer;
}

export class Engine extends EventEmitter<EngineEvents> implements Required<EngineOptions> {

    static defaults: EngineOptions = {
        baseTime: 50,
        maxDelay: 1500,
        rerenderOnResize: true,
        restoration: true,
    };

    constructor(options: Readonly<EngineOptions> = Utils.Const.EMPTY_OBJECT) {
        super();

        Object.assign(this, Engine.defaults, options);

        if (!this.timer) {
            this.timer = new Timer();
        }
        if (!this.renderer) {
            this.renderer = new Renderer();
        }
        if (!this.pointer) {
            this.pointer = new Pointer();
        }

        this.timer.on('tick', this.tick = this.tick.bind(this));
        const { renderer } = this;
        this.pointer.pretransform = renderer.toInnerPosition.bind(this.renderer);
        renderer.on('resize', () => {
            if (this.rerenderOnResize) {
                const { currentScene } = this;
                if (currentScene) {
                    const { context } = renderer;
                    this.emit('willRender', renderer);
                    context.save();
                    renderer.render(currentScene);
                    context.restore();
                    this.emit('didRender', renderer);
                }
            }
        });

    }

    readonly timer!: Timer;
    readonly renderer!: Renderer;
    readonly pointer!: Pointer;
    inspector: Inspector | null = null;
    baseTime!: number;
    maxDelay!: number;
    currentScene: Scene | null = null;
    rerenderOnResize!: boolean;
    restoration!: boolean;

    createScene(options?: SceneOptions) {
        return new Scene(Object.assign({ pointer: this.pointer }, options));
    }

    enter(scene: Scene | null) {
        const { currentScene } = this;
        if (currentScene) {
            currentScene.active = false;
            currentScene.emit('exit');
        }
        const { pointer } = this;
        this.currentScene = scene;
        if (scene) {
            const { timer } = this;
            if (timer.delay !== scene.delay) {
                timer.reschedule(scene.delay);
            }
            pointer.transform = scene.toViewPosition;
            scene.active = true;
            scene.emit('enter');
            if (!timer.isRunning) {
                timer.start();
            }
        } else {
            pointer.transform = null;
        }
    }

    tick(deltaTime: number) {
        if (deltaTime > this.maxDelay) {
            return;
        }
        const { currentScene, inspector, renderer } = this,
            { context } = renderer;
        if (currentScene) {
            const timeScale = deltaTime / this.baseTime;
            this.emit('willUpdate', timeScale);
            const { timer } = this;
            if (timer.delay !== currentScene.delay) {
                timer.reschedule(currentScene.delay);
            }
            currentScene.update(timeScale);
            this.emit('didUpdate', timeScale);
            this.emit('willRender', renderer);
            context.save();
            renderer.render(currentScene);
            context.restore();
            this.emit('didRender', renderer);
        }
        if (inspector) {
            inspector.update(this);
            renderer.render(inspector);
        }
    }

}
