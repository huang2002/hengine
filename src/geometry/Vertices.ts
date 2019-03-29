import { _cos, _sin, _PI, _Infinity } from "../utils/references";
import { Vector, VectorLike } from "./Vector";
import { DOUBLE_PI, HALF_PI, CachedFunction, cache, quadraticSum } from "../utils/common";

export interface VerticesObject {
    fromArray(array: number[]): Vector[];
    findClosest(target: VectorLike, vertices: ReadonlyArray<Vector>): Vector;
    createPolygon: CachedFunction<(edges: number, radius: number, rotation?: number) => Vector[]>;
    createStar: CachedFunction<
        (angles: number, innerRadius: number, outerRadius: number, rotation?: number) => Vector[]
    >;
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
            const current = quadraticSum(target.x - vertex.x, target.y - vertex.y);
            if (current < min) {
                min = current;
                closest = vertex;
            }
        });
        return closest;
    },

    createPolygon: cache(function (edges, radius, rotation = -HALF_PI) {
        const angle = DOUBLE_PI / edges,
            results = [];
        for (let i = 0; i < edges; i++) {
            results.push(Vector.of(_cos(rotation), _sin(rotation)).setModulus(radius));
            rotation += angle;
        }
        return results;
    }),

    createStar: cache(function (angles, innerRadius, outerRadius, rotation = -HALF_PI) {
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

};
