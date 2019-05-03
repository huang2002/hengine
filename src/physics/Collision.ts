import { Body, BodyLike } from "./Body";
import { Vector } from "../geometry/Vector";
import { _null, _Infinity, _min, _max, _assign } from "../common/references";

export interface CollisionResult {
    overlap: number;
    overlapVector: Vector;
    // TODO: point: Vector;
}

export interface CollisionInfo extends CollisionResult {
    body1: Body;
    body2: Body;
    edgeVector: Vector;
}

export type CollisionChecker = (body1: BodyLike, body2: BodyLike) => CollisionResult | null;

export interface CollisionObject {
    check(bodies: Body[], checker: CollisionChecker): void;
    find(bodies: Body[], checker: CollisionChecker): CollisionInfo[];
    Checker: {
        AABB: CollisionChecker;
        SAT: CollisionChecker;
        Distance: CollisionChecker;
        Smart: CollisionChecker;
    };
}

export const Collision: CollisionObject = {

    check(bodies, checker) {

        const collisionInfoArray = Collision.find(bodies, checker);

        collisionInfoArray.forEach(collisionInfo => {

            const { body1, body2, overlapVector } = collisionInfo,
                { velocity: v1, stiffness: stiffness1, mass: m1, _v: _v1 } = body1;

            overlapVector.reverse();
            body1.emit('collision', body2, collisionInfo);
            overlapVector.reverse();
            body2.emit('collision', body1, collisionInfo);

            if (body1.category & body2.sensorFilter || body1.sensorFilter & body2.category) {
                return;
            }

            const { velocity: v2, _v: _v2, mass: m2, stiffness: stiffness2 } = body2,
                elasticity = _min(body1.elasticity, body2.elasticity),
                { edgeVector } = collisionInfo;
            if (body1.active) {
                if (body2.active) {
                    const stiffness = _max(stiffness1, stiffness2) / 2;
                    body1.impulse.plusVector(overlapVector, -stiffness);
                    body2.impulse.plusVector(overlapVector, stiffness);
                    const deltaMass = m1 - m2,
                        totalMass = m1 + m2,
                        oneMinusElasticity = 1 - elasticity;
                    v1.plusVector(_v1, deltaMass * oneMinusElasticity - 1)
                        .plusVector(_v2, 2 * m2 * oneMinusElasticity)
                        .shrink(totalMass);
                    v2.plusVector(_v2, -deltaMass * oneMinusElasticity - 1)
                        .plusVector(_v1, 2 * m1 * oneMinusElasticity)
                        .shrink(totalMass);
                    if (elasticity) {
                        Vector.distribute(Vector.minus(_v2, _v1), v1, v2, m2, -m1, elasticity);
                    }
                } else {
                    body1.impulse.plusVector(overlapVector, -(stiffness1 + stiffness2) / 2);
                    const edgeVelocity = Vector.projectVector(_v1, edgeVector);
                    v1.setVector(edgeVelocity);
                    if (elasticity) {
                        v1.minusVector(Vector.projectVector(_v1, overlapVector), elasticity);
                    }
                }
            } else {
                if (body2.active) {
                    body2.impulse.plusVector(overlapVector, (stiffness1 + stiffness2) / 2);
                    const edgeVelocity = Vector.projectVector(_v2, edgeVector);
                    v2.setVector(edgeVelocity);
                    if (elasticity) {
                        v2.minusVector(Vector.projectVector(_v2, overlapVector), elasticity);
                    }
                }
            }

        });

        collisionInfoArray.forEach(collisionInfo => {
            // TODO: solve rotation
            const { body1, body2, overlapVector, overlap, edgeVector } = collisionInfo,
                { velocity: v1 } = body1,
                { velocity: v2 } = body2,
                roughness = _min(body1.roughness, body2.roughness);
            // TODO: solve friction
        });

    },

    find(bodies, checker) {
        const results = new Array<CollisionInfo>(),
            bodiesCount = bodies.length;
        for (let i = 0; i < bodiesCount; i++) {
            const body1 = bodies[i],
                { category: category1 } = body1;
            for (let j = i + 1; j < bodiesCount; j++) {
                const body2 = bodies[j];
                if (!(category1 & body2.collisionFilter && body1.collisionFilter & body2.category)) {
                    continue;
                }
                const collisionInfo = checker(body1, body2);
                if (!collisionInfo) {
                    continue;
                }
                results.push(_assign(collisionInfo, {
                    body1, body2,
                    edgeVector: collisionInfo.overlapVector.clone().turn()
                }));
            }
        }
        return results;
    },

    Checker: {

        AABB(body1, body2) {
            const { bounds: bounds1 } = body1,
                { bounds: bounds2 } = body2;
            let delta = bounds1.right - bounds2.left,
                min = delta,
                x = delta, y = 0;

            if (delta < 0) {
                return _null;
            }

            delta = bounds1.left - bounds2.right;
            if (delta > 0) {
                return _null;
            } else if (-delta < min) {
                min = -delta;
                x = delta;
            }

            delta = bounds1.bottom - bounds2.top;
            if (delta < 0) {
                return _null;
            } else if (delta < min) {
                min = delta;
                x = 0;
                y = delta;
            }

            delta = bounds1.top - bounds2.bottom;
            if (delta > 0) {
                return _null;
            } else if (-delta < min) {
                min = -delta;
                x = 0;
                y = delta;
            }

            return {
                overlap: min,
                overlapVector: Vector.of(x, y)
            };
        },

        // TODO: fix this
        SAT(body1, body2) {

            const { position: position1 } = body1;

            if (body2.isCircle && !body1.isCircle) {
                const result = Collision.Checker.SAT(body2, body1);
                if (result) {
                    result.overlapVector.reverse();
                }
                return result;
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
                const overlap1 = projection1.max - projection2.min,
                    overlap2 = projection1.min - projection2.max;
                if (overlap1 < -overlap2) {
                    if (overlap1 < minOverlap) {
                        minOverlap = overlap1;
                        minDirection = direction;
                    }
                } else {
                    if (-overlap2 < minOverlap) {
                        minOverlap = -overlap2;
                        minDirection = direction.reverse();
                    }
                }
            }

            return minDirection && {
                overlap: minOverlap,
                overlapVector: minDirection.clone().scale(minOverlap)
            };

        },

        Distance(body1, body2) {
            const offset = Vector.minus(body2.position, body1.position),
                delta = body1.radius + body2.radius - offset.getModulus();
            return delta < 0 ? _null : {
                overlap: delta,
                overlapVector: offset.setModulus(delta)
            };
        },

        // TODO: fix this
        Smart(body1, body2) {
            if (body1.bounds.overlaps(body2.bounds)) {
                return (body1.isCircle && body2.isCircle) ?
                    Collision.Checker.Distance(body1, body2) :
                    Collision.Checker.SAT(body1, body2);
            } else {
                return _null;
            }
        },

    },

};
