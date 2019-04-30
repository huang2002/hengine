import { _assign, _null } from "../common/references";
import { Timer } from "./Timer";
import { Renderer } from "../renderer/Renderer";
import { Scene, SceneOptions } from "./Scene";
import { Inspector } from "./Inspector";
import { Utils } from "../common/Utils";
import { Pointer } from "./Pointer";

export type EngineOptions = Partial<{
    timer: Timer;
    renderer: Renderer;
    pointer: Pointer;
    inspector: Inspector | null;
    baseTime: number;
    maxDelay: number;
    currentScene: Scene | null;
}>;

export class Engine implements Required<EngineOptions> {

    static defaults: EngineOptions = {
        baseTime: 25,
        maxDelay: 2000,
    };

    constructor(options: Readonly<EngineOptions> = Utils.Const.EMPTY_OBJECT) {
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
    maxDelay!: number;
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
            if (scene.delay) {
                timer.delay = scene.delay;
            }
            if (!timer.isRunning) {
                timer.start();
            }
            scene.active = true;
            scene.emit('enter');
        }
    }

    tick(deltaTime: number) {
        if (deltaTime > this.maxDelay) {
            return;
        }
        const { currentScene, inspector, renderer } = this;
        if (currentScene) {
            this.timer.delay = currentScene.delay;
            currentScene.update(deltaTime / this.baseTime);
            currentScene.render(renderer);
        }
        if (inspector) {
            inspector.update(this);
            inspector.render(renderer);
        }
    }

}
