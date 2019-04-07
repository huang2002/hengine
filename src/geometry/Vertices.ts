import { _cos, _sin, _PI, _Infinity } from "../common/references";
import { Vector, VectorLike } from "./Vector";
import { Utils } from "../common/Utils";

export interface VerticesObject {
    fromArray(array: number[]): Vector[];
    findClosest(target: VectorLike, vertices: ReadonlyArray<Vector>): Vector;
    createPolygon: Utils.CacheWrapper<(edges: number, radius: number, rotation?: number) => Vector[]>;
    createStar: Utils.CacheWrapper<
        (angles: number, innerRadius: number, outerRadius: number, rotation?: number) => Vector[]
    >;
    createRectangle: Utils.CacheWrapper<(width: number, height: number, rotation?: number) => Vector[]>;
}

export const Vertices: VerticesObject = {

    fromArray(array) {
        const vertices = [];
        for (let i = 0; i < array.length; i += 2) {
            vertices.push(Vector.of(array[i], array[i + 1]));
        }
        return vertices;
    },

    findClosest(target, vertices) {
        let min = _Infinity,
            closest!: Vector;
        vertices.forEach(vertex => {
            const current = Utils.quadraticSum(target.x - vertex.x, target.y - vertex.y);
            if (current < min) {
                min = current;
                closest = vertex;
            }
        });
        return closest;
    },

    createPolygon: Utils.cache(function (edges, radius, rotation = -Utils.Const.HALF_PI) {
        const angle = Utils.Const.DOUBLE_PI / edges,
            results = [];
        for (let i = 0; i < edges; i++) {
            results.push(Vector.of(_cos(rotation), _sin(rotation)).setModulus(radius));
            rotation += angle;
        }
        return results;
    }),

    createStar: Utils.cache(function (angles, innerRadius, outerRadius, rotation = -Utils.Const.HALF_PI) {
        const angle = _PI / angles,
            results = [];
        for (let i = 0; i < angles; i++) {
            results.push(Vector.of(_cos(rotation), _sin(rotation)).setModulus(innerRadius));
            rotation += angle;
            results.push(Vector.of(_cos(rotation), _sin(rotation)).setModulus(outerRadius));
            rotation += angle;
        }
        return results;
    }),

    createRectangle: Utils.cache(function (width, height, rotation) {
        const x0 = width / 2,
            y0 = height / 2;
        if (rotation) {
            const cos = _cos(rotation),
                sin = _sin(rotation),
                x1 = x0 * cos - y0 * sin,
                y1 = x0 * sin + y0 * sin,
                x2 = -x0 * cos - y0 * sin,
                y2 = -x0 * sin + y0 * sin;
            return [
                Vector.of(x1, y1),
                Vector.of(x2, y2),
                Vector.of(-x1, -y1),
                Vector.of(-x2, -y2)
            ];
        } else {
            return [
                Vector.of(x0, y0),
                Vector.of(-x0, y0),
                Vector.of(-x0, -y0),
                Vector.of(x0, -y0)
            ];
        }
    }),

};
