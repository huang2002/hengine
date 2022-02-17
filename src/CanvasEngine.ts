import { Resizer, ResizerOptions, Sizing, SizingOutput } from '3h-resize';
import { type CanvasNode, CanvasNodeEvents, CanvasRoot, CanvasRootOptions, Event, Schedule } from 'canvasom';
import type { SceneNode, SceneNodeEnterEvent, SceneNodeExitEvent } from './SceneNode';

/**
 * Type of options of canvas engines.
 */
export type CanvasEngineOptions<Events extends CanvasNodeEvents> = (
    & CanvasRootOptions<Events>
    & Partial<{
        /**
         * The resizer options.
         * @default
         * ```js
         * {
         *     width: this.renderer.width,
         *     height: this.renderer.height,
         *     target: this.renderer.canvas,
         *     sizing: HR.Sizing.contain,
         *     callback: this.onResize,
         * }
         * ```
         */
        resizerOptions: ResizerOptions;
    }>
);
/** dts2md break */
/**
 * Class of canvas engines.
 */
export class CanvasEngine<Events extends CanvasNodeEvents = CanvasNodeEvents>
    extends CanvasRoot<Events> {
    /** dts2md break */
    /**
     * Constructor of {@link CanvasEngine}.
     */
    constructor(options?: CanvasEngineOptions<Events>) {

        super(options);

        this.onResize = this.onResize.bind(this);

        const resizerOptions: ResizerOptions = {
            width: this.renderer.width,
            height: this.renderer.height,
            target: this.renderer.canvas,
            sizing: Sizing.contain,
            callback: this.onResize,
        };
        if (options?.resizerOptions) {
            Object.assign(
                resizerOptions,
                options.resizerOptions,
            );
        }
        this.resizer = new Resizer(resizerOptions);

        this.renderer.autoStyle = false;

    }
    /** dts2md break */
    /**
     * The resizer in use.
     */
    readonly resizer: Resizer;
    /** dts2md break */
    /**
     * Current scene.
     */
    currentScene: SceneNode | null = null;
    /** dts2md break */
    /**
     * Resize callback.
     * (Remember to invoke this in your implemention
     * of `resizer.callback` if you have one.)
     */
    onResize(result: SizingOutput) {
        const { scale } = result;
        this.renderer.resize(
            result.width / scale,
            result.height / scale,
        );
        Schedule.updateAndRender(this);
    }
    /** dts2md break */
    /**
     * Enter specific scene.
     * (Pass `null` to exit current scene
     * without entering another scene.)
     * @returns Whether the scene change is successful.
     */
    enter(nextScene: SceneNode | null): boolean {

        const { currentScene } = this;

        if (currentScene) {

            const exitEvent: SceneNodeExitEvent = new Event({
                name: 'exit',
                stoppable: true,
                cancelable: true,
                data: {
                    nextScene,
                },
            });

            currentScene.emit(exitEvent);
            if (exitEvent.canceled) {
                return false;
            }

        }

        if (nextScene) {

            const enterEvent: SceneNodeEnterEvent = new Event({
                name: 'enter',
                stoppable: true,
                cancelable: true,
                data: {
                    currentScene,
                },
            });

            nextScene.emit(enterEvent);
            if (enterEvent.canceled) {
                return false;
            }

            this.appendChild(nextScene as CanvasNode<any>);

        }

        if (currentScene) {
            this.removeChild(currentScene as CanvasNode<any>);
        }

        this.currentScene = nextScene;

        if (currentScene || nextScene) {
            Schedule.updateAndRender(this);
        }

        return true;

    }

}
