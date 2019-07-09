import { _assign, _null } from "../common/references";
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
    maxTimeScale: number;
    currentScene: Scene | null;
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
        maxTimeScale: 2,
    };

    constructor(options: Readonly<EngineOptions> = Utils.Const.EMPTY_OBJECT) {
        super();

        _assign(this, Engine.defaults, options);

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
        this.pointer.transform = this.renderer.outer2inner.bind(this.renderer);

    }

    timer!: Timer;
    renderer!: Renderer;
    pointer!: Pointer;
    inspector: Inspector | null = _null;
    baseTime!: number;
    maxTimeScale!: number;
    currentScene: Scene | null = _null;

    createScene(options?: SceneOptions) {
        return new Scene(_assign({ pointer: this.pointer }, options));
    }

    enter(scene: Scene | null) {
        const { currentScene } = this;
        if (currentScene) {
            currentScene.active = false;
            currentScene.emit('exit');
        }
        this.currentScene = scene;
        if (scene) {
            const { timer } = this;
            if (timer.delay !== scene.delay) {
                timer.reschedule(scene.delay);
            }
            scene.active = true;
            scene.emit('enter');
            if (!timer.isRunning) {
                timer.start();
            }
        }
    }

    tick(deltaTime: number) {
        const timeScale = deltaTime / this.baseTime;
        if (timeScale > this.maxTimeScale) {
            return;
        }
        const { currentScene, inspector, renderer } = this;
        if (currentScene) {
            this.emit('willUpdate', timeScale);
            const { timer } = this;
            if (timer.delay !== currentScene.delay) {
                timer.reschedule(currentScene.delay);
            }
            currentScene.update(timeScale);
            this.emit('didUpdate', timeScale);
            this.emit('willRender', renderer);
            renderer.render(currentScene);
            this.emit('didRender', renderer);
        }
        if (inspector) {
            inspector.update(this);
            renderer.render(inspector);
        }
    }

}
