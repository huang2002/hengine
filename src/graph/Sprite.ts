import { Renderable } from "../renderer/Renderer";
import { Vector } from "../geometry/Vector";
import { EMPTY_OBJECT, _assign, _document, _undefined } from "../utils/references";
import { Callback } from "../utils/common";
import { CommonStyle } from "./CommonStyle";

export type ImageLike = Exclude<CanvasImageSource, SVGImageElement>;

export type SpriteOptions = Partial<{
    position: Vector;
    image: ImageLike;
    style: Partial<CommonStyle>;
    srcX: number;
    srcY: number;
    srcW: number;
    srcH: number;
    width: number;
    height: number;
}>;

export class Sprite implements Required<SpriteOptions>, Renderable {

    static defaultStyle: CommonStyle = _assign({} as CommonStyle, CommonStyle.defaults);

    static of(src: string, options?: Readonly<SpriteOptions>) {
        return (new Sprite(options)).load(src);
    }

    constructor(options: Readonly<SpriteOptions> = EMPTY_OBJECT) {
        _assign(this, options);

        if (!options.position) {
            this.position = new Vector();
        }

        this.style = _assign({}, Sprite.defaultStyle, options.style);

    }

    position!: Vector;
    image!: ImageLike;
    style!: CommonStyle;
    srcX!: number;
    srcY!: number;
    srcW!: number;
    srcH!: number;
    width!: number;
    height!: number;

    load(
        src: string,
        onSuccess?: Callback<unknown, Event, void>,
        onFailure?: Callback<unknown, [Event | string], void>
    ) {
        const image = this.image = _document.createElement('img');
        image.src = src;
        if (onSuccess) {
            image.onload = onSuccess;
        }
        if (onFailure) {
            image.onabort = image.onerror = onFailure;
        }
        return this;
    }

    render(context: CanvasRenderingContext2D) {
        const { image } = this;
        if (image) {
            const { position } = this,
                { width, height } = image,
                dstW = this.width || width,
                dstH = this.height || height;
            CommonStyle.apply(context, this.style);
            context.drawImage(
                image,
                (this.srcX || 0) - dstW / 2, (this.srcY || 0) - dstH / 2,
                this.srcW || width, this.srcH || height,
                position.x, position.y,
                dstW, dstH
            );
        }
    }

}
