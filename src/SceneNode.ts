import { CanvasNode, CanvasNodeEvents, CanvasNodeOptions, Event } from "canvasom";

/**
 * Data type of `enter` events on scene nodes.
 */
export interface SceneNodeEnterEventData {
    currentScene: SceneNode<any> | null;
}
/** dts2md break */
/**
 * Emits on entering a scene. (stoppable & cancelable)
 */
export type SceneNodeEnterEvent = Event<'enter', SceneNodeEnterEventData>;
/** dts2md break */
/**
 * Data type of `exit` events on scene nodes.
 */
export interface SceneNodeExitEventData {
    nextScene: SceneNode<any> | null;
}
/** dts2md break */
/**
 * Emits on exiting a scene. (stoppable & cancelable)
 */
export type SceneNodeExitEvent = Event<'exit', SceneNodeExitEventData>;
/** dts2md break */
/**
 * Event map of {@link SceneNode}.
 */
export interface SceneNodeEvents extends CanvasNodeEvents {
    enter: SceneNodeEnterEvent;
    exit: SceneNodeExitEvent;
}
/** dts2md break */
/**
 * Type of options of {@link SceneNode}.
 */
export type SceneNodeOptions<Events extends SceneNodeEvents> = (
    & CanvasNodeOptions<Events>
    & Partial<{
        /**
         * @override CanvasNodeOptions.stretch
         * @default 1
         */
        stretch: number;
        /**
         * @override CanvasNodeOptions.penetrable
         * @default true
         */
        penetrable: boolean;
    }>
);
/** dts2md break */
/**
 * Class of scene nodes.
 */
export class SceneNode<Events extends SceneNodeEvents = SceneNodeEvents>
    extends CanvasNode<Events>{
    /** dts2md break */
    /**
     * Constructor of {@link SceneNode}.
     */
    constructor(options?: SceneNodeOptions<Events>) {
        super({
            stretch: 1,
            penetrable: true,
            ...options,
        });
    }
    /** dts2md break */
    /**
     * @override CanvasNodeOptions.penetrable
     * @default true
     */
    declare penetrable: boolean;

}
