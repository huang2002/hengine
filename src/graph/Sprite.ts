import { Renderable, RendererLike } from "../renderer/Renderer";
import { Vector } from "../geometry/Vector";
import { _assign, _document, _undefined } from "../common/references";
import { Utils } from "../common/Utils";
import { Style, CommonStyle } from "./Style";

export type ImageLike = Exclude<CanvasImageSource, SVGImageElement>;

export type SpriteOptions = Partial<{
    visible: boolean;
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

    static defaults: SpriteOptions = {
        visible: true,
    };

    static defaultStyle: CommonStyle = _assign({} as CommonStyle, Style.Common.defaults);

    static of(src: string, options?: Readonly<SpriteOptions>) {
        return (new Sprite(options)).load(src);
    }

    constructor(options: Readonly<SpriteOptions> = Utils.Const.EMPTY_OBJECT) {
        _assign(this, options);

        if (!this.position) {
            this.position = new Vector();
        }

        this.style = _assign({}, Sprite.defaultStyle, this.style);

    }

    visible!: boolean;
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
        onSuccess?: Utils.Callback<GlobalEventHandlers, Event, void>,
        onFailure?: Utils.Callback<GlobalEventHandlers, [Event | string], void>
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

    render(renderer: RendererLike) {
        if (!this.visible) {
            return;
        }
        const { image } = this;
        if (image) {
            const { position } = this,
                { width, height } = image,
                { context } = renderer,
                dstW = this.width || width,
                dstH = this.height || height;
            Style.Common.apply(renderer, this.style);
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
