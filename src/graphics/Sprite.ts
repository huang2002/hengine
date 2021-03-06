import { Renderable, RendererLike } from "../renderer/Renderer";
import { Vector } from "../geometry/Vector";
import { Utils } from "../common/Utils";
import { Style, CommonStyle } from "./Style";

export type ImageLike = Exclude<CanvasImageSource, SVGImageElement>;

export type SpriteOptions = Partial<{
    visible: boolean;
    position: Vector;
    image: ImageLike;
    style: Partial<CommonStyle>;
    clipX: number;
    clipY: number;
    clipWidth: number;
    clipHeight: number;
    width: number;
    height: number;
    rotation: number;
}>;

export class Sprite implements Required<SpriteOptions>, Renderable {

    static defaults: SpriteOptions = {
        visible: true,
        rotation: 0,
    };

    static defaultStyle: CommonStyle = Object.assign({} as CommonStyle, Style.Common.defaults);

    static of(src: string, options?: Readonly<SpriteOptions>) {
        return (new Sprite(options)).load(src);
    }

    constructor(options: Readonly<SpriteOptions> = Utils.Const.EMPTY_OBJECT) {
        Object.assign(this, options);

        if (!this.position) {
            this.position = new Vector();
        }

        this.style = Object.assign({}, Sprite.defaultStyle, this.style);

    }

    visible!: boolean;
    position!: Vector;
    image!: ImageLike;
    style!: CommonStyle;
    clipX!: number;
    clipY!: number;
    clipWidth!: number;
    clipHeight!: number;
    width!: number;
    height!: number;
    rotation!: number;

    load(
        src: string,
        onSuccess?: Utils.Callback<GlobalEventHandlers, Event, void>,
        onFailure?: Utils.Callback<GlobalEventHandlers, [Event | string], void>
    ) {
        const image = this.image = document.createElement('img');
        image.src = src;
        if (onSuccess) {
            image.onload = onSuccess;
        }
        if (onFailure) {
            image.onabort = image.onerror = onFailure;
        }
        return this;
    }

    render(renderer: RendererLike) {
        if (!this.visible) {
            return;
        }
        const { image } = this;
        if (image) {
            const { position, rotation } = this,
                { width, height } = image,
                { context } = renderer,
                dstW = this.width || width,
                dstH = this.height || height;
            Style.Common.apply(renderer, this.style);
            context.rotate(rotation);
            context.drawImage(
                image,
                (this.clipX || 0) - dstW / 2, (this.clipY || 0) - dstH / 2,
                this.clipWidth || width, this.clipHeight || height,
                position.x, position.y,
                dstW, dstH
            );
            context.rotate(-rotation);
        }
    }

}
