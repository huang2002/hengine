import { _assign, _null } from "../common/references";
import { Runner } from "./Runner";
import { Renderer } from "../renderer/Renderer";
import { Scene } from "./Scene";
import { Inspector } from "./Inspector";
import { Utils } from "../common/Utils";

export type EngineOptions = Partial<{
    runner: Runner;
    renderer: Renderer;
    inspector: Inspector | null;
    baseTime: number;
    maxDelay: number;
    currentScene: Scene | null;
}>;

export class Engine implements Required<EngineOptions> {

    static defaults: EngineOptions = {
        baseTime: 100,
        maxDelay: 2000,
    };

    constructor(options: Readonly<EngineOptions> = Utils.EMPTY_OBJECT) {
        _assign(this, Engine.defaults, options);

        if (!options.runner) {
            this.runner = new Runner();
        }
        if (!options.renderer) {
            this.renderer = new Renderer();
        }

        this.runner.on('tick', this.tick = this.tick.bind(this));

    }

    runner!: Runner;
    renderer!: Renderer;
    inspector: Inspector | null = _null;
    baseTime!: number;
    maxDelay!: number;
    currentScene: Scene | null = _null;

    enter(scene: Scene | null) {
        if (this.currentScene) {
            this.currentScene.emit('exit');
        }
        this.currentScene = scene;
        if (scene) {
            const { runner } = this;
            runner.delay = scene.delay;
            if (!runner.isRunning) {
                runner.start();
            }
            scene.emit('enter');
        }
    }

    tick(deltaTime: number) {
        if (deltaTime > this.maxDelay) {
            return;
        }
        const { currentScene, inspector, renderer } = this;
        if (currentScene) {
            this.runner.delay = currentScene.delay;
            currentScene.update(deltaTime / this.baseTime);
            currentScene.render(renderer);
        }
        if (inspector) {
            inspector.update(this);
            inspector.render(renderer);
        }
    }

}
