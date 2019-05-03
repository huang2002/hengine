import { Body, BodyLike } from "./Body";
import { Vector } from "../geometry/Vector";
import { _null, _Infinity, _min, _max } from "../common/references";

// TODO: interface CollisionInfo { point: Vector; vector: Vector; }
export type CollisionInfo = Vector;

export type CollisionChecker = (body1: BodyLike, body2: BodyLike) => CollisionInfo | null;

export interface CollisionObject {
    check(bodies: Body[], checker: CollisionChecker): void;
    Checker: {
        AABB: CollisionChecker;
        SAT: CollisionChecker;
        Distance: CollisionChecker;
        Smart: CollisionChecker;
    };
}

export const Collision: CollisionObject = {

    // TODO: fix bounce
    check(bodies, checker) {
        const bodiesCount = bodies.length;
        for (let i = 0; i < bodiesCount; i++) {
            const body1 = bodies[i],
                { category: category1,
                    velocity: v1,
                    active: active1,
                    sensorFilter: sensorFilter1,
                    mass: m1,
                    elasticity: elasticity1,
                    stiffness: stiffness1,
                    roughness: roughness1,
                    _v: _v1 } = body1;
            for (let j = i + 1; j < bodiesCount; j++) {
                const body2 = bodies[j];

                if (!(category1 & body2.collisionFilter && body1.collisionFilter & body2.category)) {
                    continue;
                }

                const overlapVector = checker(body1, body2);
                if (!overlapVector) {
                    continue;
                }

                body1.emit('collision', body2, overlapVector.clone().reverse());
                body2.emit('collision', body1, overlapVector);

                if (category1 & body2.sensorFilter || sensorFilter1 & body2.category) {
                    continue;
                }

                const { velocity: v2, _v: _v2, stiffness: stiffness2, mass: m2, active: active2 } = body2,
                    elasticity = _min(elasticity1, body2.elasticity),
                    roughness = _min(roughness1, body2.roughness),
                    edgeVector = overlapVector.clone().turn();
                if (active1) {
                    if (active2) {
                        const stiffness = _max(stiffness1, stiffness2) / 2;
                        body1.impulse.plusVector(overlapVector, -stiffness);
                        body2.impulse.plusVector(overlapVector, stiffness);
                        const deltaMass = m1 - m2,
                            totalMass = m1 + m2,
                            velocityScale = 1 - elasticity;
                        v1.plusVector(_v1, deltaMass * velocityScale - 1)
                            .plusVector(_v2, 2 * m2 * velocityScale)
                            .shrink(totalMass);
                        v2.plusVector(_v2, -deltaMass * velocityScale - 1)
                            .plusVector(_v1, 2 * m1 * velocityScale)
                            .shrink(totalMass);
                        const relativeVelocity = Vector.minus(_v2, _v1);
                        if (elasticity) {
                            const bounceVector =
                                Vector.projectVector(relativeVelocity, overlapVector).scale(elasticity / 2);
                            v1.plusVector(bounceVector);
                            v2.minusVector(bounceVector);
                        }
                        if (roughness) {
                            const relativeEdgeVelocity =
                                Vector.projectVector(relativeVelocity, edgeVector).scale(roughness / 2);
                            v1.plusVector(relativeEdgeVelocity);
                            v2.minusVector(relativeEdgeVelocity);
                        }
                        // TODO: solve the rotations of body1 & body2 here
                    } else {
                        body1.impulse.plusVector(overlapVector, -(stiffness1 + stiffness2) / 2);
                        const edgeVelocity = Vector.projectVector(_v1, edgeVector);
                        v1.setVector(edgeVelocity);
                        if (elasticity) {
                            v1.minusVector(Vector.projectVector(_v1, overlapVector), elasticity);
                        }
                        if (roughness) {
                            v1.minusVector(edgeVelocity, roughness);
                        }
                        // TODO: solve the rotation of body1 here
                    }
                } else {
                    if (active2) {
                        body2.impulse.plusVector(overlapVector, (stiffness1 + stiffness2) / 2);
                        const edgeVelocity = Vector.projectVector(_v2, edgeVector);
                        v2.setVector(edgeVelocity);
                        if (elasticity) {
                            v2.minusVector(Vector.projectVector(_v2, overlapVector), elasticity);
                        }
                        if (roughness) {
                            v2.minusVector(edgeVelocity, roughness);
                        }
                        // TODO: solve the rotation of body2 here
                    }
                }

            }
        }
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

            return Vector.of(x, y);
        },

        // TODO: fix this
        SAT(body1, body2) {

            const { position: position1 } = body1;

            if (body2.isCircle && !body1.isCircle) {
                const result = Collision.Checker.SAT(body2, body1);
                if (result) {
                    result.reverse();
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

            /* if (minDirection && normals.indexOf(minDirection) < body2.normals.length) {
                minDirection.reverse();
            } */

            return minDirection && minDirection.clone().scale(minOverlap);

        },

        Distance(body1, body2) {
            const offset = Vector.minus(body2.position, body1.position),
                delta = offset.getModulus() - body1.radius - body2.radius;
            return delta > 0 ? _null : offset.setModulus(-delta);
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
