import { Renderable, RendererLike } from "../renderer/Renderer";
import { Vector } from "../geometry/Vector";
import { SceneObject } from "../core/Scene";
import { Pool } from "./Pool";
import { Utils } from "../common/Utils";

export type ParticleInitializer<T extends SceneObject = SceneObject, U = unknown> =
    (particle: T, life: number) => U;
export type ParticleCleaner<T extends SceneObject = SceneObject, U = unknown> =
    (particle: T, legacy: U) => void;

export type ParticlesOptions<T extends SceneObject = SceneObject, U = unknown> = Partial<{
    visible: boolean;
    active: boolean;
    offset: Vector;
    pool: Pool<T> | null;
    minLife: number;
    maxLife: number;
    life: number;
    items: T[];
    minCount: number;
    maxCount: number;
    count: number;
    threshold: number;
    initializer: ParticleInitializer<T, U> | null;
    cleaner: ParticleCleaner<T, U> | null;
    sequential: boolean;
    loop: boolean;
}>;

export class Particles<T extends SceneObject = SceneObject, U = unknown>
    implements Required<ParticlesOptions<T, U>>, Renderable {

    static defaults: ParticlesOptions = {
        visible: true,
        active: true,
        pool: null,
        minCount: 0,
        maxCount: Infinity,
        minLife: Infinity,
        maxLife: Infinity,
        initializer: null,
        cleaner: null,
        sequential: false,
        loop: true,
    };

    constructor(options?: Readonly<ParticlesOptions<T, U>>) {
        Object.assign(this, Particles.defaults, options);

        if (!this.offset) {
            this.offset = new Vector();
        }
        if (!this.items) {
            this.items = [];
        }

    }

    visible!: boolean;
    active!: boolean;
    offset!: Vector;
    pool!: Pool<T> | null;
    minLife!: number;
    maxLife!: number;
    items!: T[];
    minCount!: number;
    maxCount!: number;
    initializer!: ParticleInitializer<T, U> | null;
    cleaner!: ParticleCleaner<T, U> | null;
    sequential!: boolean;
    loop!: boolean;
    private _items: T[] = [];
    private readonly _deadlines = new Map<T, number>();
    private readonly _legacies = new Map<T, U>();

    set life(value: number) {
        this.minLife = this.maxLife = value;
    }

    set count(value: number) {
        this.minCount = this.maxCount = value;
    }

    private _spawn() {
        const { pool } = this;
        if (!pool) {
            return;
        }
        const { items, _deadlines, initializer } = this,
            particle = pool.get(),
            life = Utils.mix(this.minLife, this.maxLife, Math.random());
        _deadlines.set(particle, Date.now() + life);
        if (initializer) {
            this._legacies.set(particle, initializer(particle, life));
        }
        this._items.push(particle);
        if (this.sequential) {
            items.push(particle);
        } else {
            Utils.insert(items, Math.round(items.length * Math.random()), particle);
        }
    }

    spawn = Utils.throttle(this._spawn);

    set threshold(value: number) {
        this.spawn.threshold = value;
    }

    get threshold() {
        return this.spawn.threshold;
    }

    clear() {
        const { pool, cleaner, _legacies } = this;
        this.items.forEach(item => {
            if (pool) {
                pool.add(item);
            }
            if (cleaner) {
                cleaner(item, _legacies.get(item)!);
            }
        });
        this.items = [];
        this._items.length = 0;
        this._deadlines.clear();
        this._legacies.clear();
    }

    private _remove(item: T) {
        const { _deadlines, pool, cleaner, _legacies, _items } = this;
        Utils.removeIndex(_items, _items.indexOf(item));
        _deadlines.delete(item);
        if (pool) {
            pool.add(item);
        }
        if (cleaner) {
            cleaner(item, _legacies.get(item)!);
        }
        _legacies.delete(item);
    }

    update(timeScale: number) {
        if (!this.active) {
            return;
        }
        const { _deadlines } = this,
            now = Date.now();
        this.items = this.items.filter(item => {
            if (_deadlines.get(item)! <= now) {
                return this._remove(item);
            }
            if (item.update) {
                item.update(timeScale);
            }
            return true;
        });
        if (this.loop) {
            this.spawn();
        }
        const currentCount = this.items.length;
        if (currentCount > this.maxCount) {
            const { items } = this;
            if (this.sequential) {
                for (let i = this.maxCount; i < currentCount; i++) {
                    this._remove(items.shift()!);
                }
            } else {
                const { _items } = this;
                for (let i = this.maxCount; i < currentCount; i++) {
                    const item = _items[0]!;
                    this._remove(item);
                    Utils.removeIndex(items, items.indexOf(item));
                }
            }
        } else if (currentCount < this.minCount) {
            for (let i = currentCount; i < this.minCount; i++) {
                this._spawn();
            }
        }
    }

    render(renderer: RendererLike) {
        if (!this.visible) {
            return;
        }
        const { items, offset } = this,
            { context } = renderer;
        context.translate(offset.x, offset.y);
        items.forEach(item => {
            item.render(renderer);
        });
        context.translate(-offset.x, -offset.y);
    }

}
