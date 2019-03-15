import { EMPTY_OBJECT, _assign, _null } from "../utils/refs";
import { Runner } from "./Runner";
import { Renderer } from "../renderer/Renderer";
import { Scene } from "./Scene";

export type EngineOptions = Partial<{
    runner: Runner;
    renderer: Renderer;
    baseTime: number;
    maxDelay: number;
    currentScene: Scene | null;
}>;

export class Engine implements Required<EngineOptions> {

    static Defaults: EngineOptions = {
        baseTime: 100,
        maxDelay: 2000,
    };

    constructor(options: Readonly<EngineOptions> = EMPTY_OBJECT) {
        _assign(this, options);

        if (!options.runner) {
            this.runner = new Runner();
        }
        if (!options.renderer) {
            this.renderer = new Renderer();
        }

        this.runner.on('tick', this.update = this.update.bind(this));

    }

    runner!: Runner;
    renderer!: Renderer;
    baseTime!: number;
    maxDelay!: number;
    currentScene: Scene | null = _null;

    enter(scene: Scene | null) {
        if (this.currentScene) {
            this.currentScene.emit('exit');
        }
        this.currentScene = scene;
        if (scene) {
            this.runner.delay = scene.delay;
            scene.emit('enter');
        }
    }

    update(deltaTime: number) {
        if (deltaTime > this.maxDelay) {
            return;
        }
        const { currentScene } = this;
        if (currentScene) {
            this.runner.delay = currentScene.delay;
            currentScene.update(deltaTime / this.baseTime);
            currentScene.render(this.renderer);
        }
    }

}
