import { Vector, VectorLike } from "./Vector";
import { Utils } from "../common/Utils";

export const Vertices = {

    fromArray(array: number[]) {
        const vertices = [];
        for (let i = 0; i < array.length; i += 2) {
            vertices.push(Vector.of(array[i], array[i + 1]));
        }
        return vertices;
    },

    findClosest<T extends VectorLike>(target: VectorLike, vertices: ReadonlyArray<T>) {
        let min = Infinity,
            closest!: T;
        vertices.forEach(vertex => {
            const current = Utils.quadraticSum(target.x - vertex.x, target.y - vertex.y);
            if (current < min) {
                min = current;
                closest = vertex;
            }
        });
        return closest;
    },

    createPolygon: Utils.cache(function (
        this: void, edges: number, radius: number, rotation: number = -Utils.Const.HALF_PI
    ) {
        const angle = Utils.Const.DOUBLE_PI / edges,
            results = [];
        for (let i = 0; i < edges; i++) {
            results.push(
                Vector.of(
                    Math.cos(rotation) * radius,
                    Math.sin(rotation) * radius
                )
            );
            rotation += angle;
        }
        return results;
    }),

    createStar: Utils.cache(function (
        this: void, angles: number, innerRadius: number, outerRadius: number,
        rotation: number = -Utils.Const.HALF_PI
    ) {
        const angle = Math.PI / angles,
            results = [];
        for (let i = 0; i < angles; i++) {
            results.push(
                Vector.of(
                    Math.cos(rotation) * innerRadius,
                    Math.sin(rotation) * innerRadius
                )
            );
            rotation += angle;
            results.push(
                Vector.of(
                    Math.cos(rotation) * outerRadius,
                    Math.sin(rotation) * outerRadius
                )
            );
            rotation += angle;
        }
        return results;
    }),

    createRectangle: Utils.cache(function (
        this: void, width: number, height: number, rotation?: number
    ): Vector[] {
        const x0 = width / 2,
            y0 = height / 2;
        if (rotation) {
            const cos = Math.cos(rotation),
                sin = Math.sin(rotation),
                x1 = x0 * cos - y0 * sin,
                y1 = x0 * sin + y0 * sin,
                x2 = -x0 * cos - y0 * sin,
                y2 = -x0 * sin + y0 * sin;
            return Vertices.fromArray([
                x1, y1,
                x2, y2,
                -x1, -y1,
                -x2, -y2
            ]);
        } else {
            return Vertices.fromArray([
                x0, y0,
                -x0, y0,
                -x0, -y0,
                x0, -y0
            ]);
        }
    }),

} as const;
