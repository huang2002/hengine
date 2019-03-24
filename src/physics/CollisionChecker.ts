import { Body } from "./Body";
import { Vector } from "../geometry/Vector";
import { _null, _Infinity, _abs } from "../utils/references";

export type CollisionChecker = (body1: Body, body2: Body) => Vector | null;

export interface CollisionCheckerObject {
    AABB: CollisionChecker;
    SAT: CollisionChecker;
    Distance: CollisionChecker;
    Smart: CollisionChecker;
}

export const CollisionChecker: CollisionCheckerObject = {

    AABB(body1, body2) {
        const { bounds: bounds1 } = body1,
            { bounds: bounds2 } = body2;
        let delta = bounds1.right - bounds2.left,
            min = delta,
            x = delta, y = 0;
        if (delta < 0) {
            return _null;
        }
        if ((delta = bounds1.left - bounds2.right) < 0) {
            return _null;
        } else if (-delta < min) {
            min = -delta;
            x = delta;
        }
        x = 0;
        if ((delta = bounds1.bottom - bounds2.top) < 0) {
            return _null;
        } else if (delta < min) {
            min = delta;
            y = delta;
        }
        if ((delta = bounds1.top - bounds2.bottom) < 0) {
            return _null;
        } else if (-delta < min) {
            min = -delta;
            y = delta;
        }
        return Vector.of(x, y);
    },

    SAT(body1, body2) {

        const { position: position1 } = body1;

        if (body2.isCircle && !body1.isCircle) {
            return CollisionChecker.SAT(body2, body1);
        }

        let normals = body2.normals.slice();
        if (body1.isCircle) {
            normals.push(Vector.minus(position1, body2.getClosest(position1)).normalize());
        } else {
            normals = normals.concat(body1.normals);
        }

        let minDirection: Vector | null = _null,
            minOverlap = _Infinity;

        for (let i = 0; i < normals.length; i++) {
            const direction = normals[i],
                projection1 = body1.project(direction),
                projection2 = body2.project(direction);
            if (projection1.min > projection2.max || projection1.max < projection2.min) {
                return _null;
            }
            const delta1 = projection1.max - projection2.min,
                delta2 = projection1.min - projection2.max,
                overlap1 = _abs(delta1),
                overlap2 = _abs(delta2);
            if (overlap1 < overlap2) {
                if (overlap1 < minOverlap) {
                    minOverlap = overlap1;
                    minDirection = direction;
                }
            } else {
                if (overlap2 < minOverlap) {
                    minOverlap = overlap2;
                    minDirection = direction;
                }
            }
        }

        return minDirection && minDirection.clone().scale(minOverlap);

    },

    Distance(body1, body2) {
        const offset = Vector.minus(body2.position, body1.position),
            delta = offset.getModulus() - body1.radius - body2.radius;
        return delta < 0 ? _null : offset.setModulus(delta);
    },

    Smart(body1, body2) {
        if (body1.bounds.overlaps(body2.bounds)) {
            return (body1.isCircle && body2.isCircle) ?
                CollisionChecker.Distance(body1, body2) :
                CollisionChecker.SAT(body1, body2);
        } else {
            return _null;
        }
    },

};
