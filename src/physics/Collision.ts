import { Body, BodyLike } from "./Body";
import { Vector } from "../geometry/Vector";
import { _null, _Infinity, _min, _max, _assign, _abs, _Set, _sign } from "../common/references";

export interface CollisionResult {
    overlap: number;
    overlapVector: Vector;
    // TODO: point: Vector;
}

export interface CollisionInfo extends CollisionResult {
    body1: Body;
    body2: Body;
    edgeVector: Vector | null;
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

    // TODO: fix bounce
    check(bodies, checker) {

        const { maxStaticSpeed } = Body,
            collisionBodies = new _Set<Body>();

        const collisions = Collision.find(bodies, checker).filter(collisionInfo => {

            const { body1, body2, overlap, overlapVector } = collisionInfo,
                { velocity: v1, stiffness: stiffness1, slop: slop1,
                    mass: m1, _v: _v1, impulse: impulse1 } = body1;

            overlapVector.reverse();
            body1.emit('collision', body2, collisionInfo);
            overlapVector.reverse();
            body2.emit('collision', body1, collisionInfo);

            if (body1.category & body2.sensorFilter || body1.sensorFilter & body2.category) {
                return false;
            }

            const { velocity: v2, _v: _v2, mass: m2,
                stiffness: stiffness2, impulse: impulse2 } = body2,
                elasticity = _min(body1.elasticity, body2.elasticity) + 1,
                slop = slop1 + body2.slop,
                impulseScale = overlap > slop ? (overlap - slop) / overlap : 0,
                { edgeVector } = collisionInfo;
            if (body1.active) {
                if (body2.active) {
                    if (impulseScale) {
                        Vector.distribute(
                            overlapVector,
                            impulse1, impulse2,
                            -stiffness1, stiffness2,
                            impulseScale
                        );
                    }
                    if (edgeVector) {
                        const relativeVelocity = Vector.minus(_v2, _v1);
                        if (Vector.dot(relativeVelocity, overlapVector) < 0) {
                            Vector.distribute(
                                Vector.projectVector(relativeVelocity, overlapVector),
                                v1, v2,
                                m2, -m1,
                                elasticity
                            );
                        }
                    }
                } else {
                    if (impulseScale) {
                        impulse1.minusVector(
                            overlapVector,
                            (stiffness1 + stiffness2) * impulseScale
                        );
                    }
                    if (edgeVector && Vector.dot(_v1, overlapVector) > 0) {
                        v1.minusVector(Vector.projectVector(_v1, overlapVector), elasticity);
                    }
                }
            } else {
                if (body2.active) {
                    if (impulseScale) {
                        impulse2.plusVector(
                            overlapVector,
                            (stiffness1 + stiffness2) * impulseScale
                        );
                    }
                    if (edgeVector && Vector.dot(_v2, overlapVector) < 0) {
                        v2.minusVector(Vector.projectVector(_v2, overlapVector), elasticity);
                    }
                } else {
                    return false;
                }
            }

            collisionBodies.add(body1).add(body2);

            return edgeVector;

        });

        collisionBodies.forEach(body => {
            body._v.setVector(body.velocity);
        });

        collisions.forEach(collisionInfo => {
            // TODO: solve rotation
            const { body1, body2, overlap, overlapVector, edgeVector } =
                collisionInfo as CollisionInfo & { edgeVector: Vector },
                { velocity: v1, _v: _v1 } = body1,
                { velocity: v2, _v: _v2 } = body2,
                friction = _min(body1.friction, body2.friction),
                staticFriction = _min(body1.staticFriction, body2.staticFriction);
            if (!staticFriction) {
                return;
            }
            if (body1.active) {
                if (body2.active) {
                    const relativeEdgeSpeed = Vector.project(Vector.minus(_v2, _v1), edgeVector),
                        absRelativeEdgeSpeed = _abs(relativeEdgeSpeed);
                    if (
                        absRelativeEdgeSpeed < maxStaticSpeed &&
                        overlap * staticFriction >= absRelativeEdgeSpeed ||
                        overlap * friction >= absRelativeEdgeSpeed
                    ) {
                        v1.setVector(Vector.projectVector(_v1, overlapVector));
                        v2.setVector(Vector.projectVector(_v2, overlapVector));
                    } else if (friction) {
                        Vector.distribute(
                            edgeVector,
                            v1, v2,
                            body2.mass, -body1.mass,
                            overlap * friction * _sign(relativeEdgeSpeed) * 2
                        );
                    }
                } else {
                    const edgeSpeed = Vector.project(_v1, edgeVector),
                        absEdgeSpeed = _abs(edgeSpeed);
                    if (
                        absEdgeSpeed < maxStaticSpeed &&
                        overlap * staticFriction >= absEdgeSpeed ||
                        overlap * friction >= absEdgeSpeed
                    ) {
                        v1.setVector(Vector.projectVector(_v1, overlapVector));
                    } else if (friction) {
                        v1.minusVector(edgeVector, overlap * friction * _sign(edgeSpeed));
                    }
                }
            } else {
                const edgeSpeed = Vector.project(_v2, edgeVector),
                    absEdgeSpeed = _abs(edgeSpeed);
                if (
                    absEdgeSpeed < maxStaticSpeed &&
                    overlap * staticFriction >= absEdgeSpeed ||
                    overlap * friction >= absEdgeSpeed
                ) {
                    v2.setVector(Vector.projectVector(_v2, overlapVector));
                } else if (friction) {
                    v2.minusVector(edgeVector, overlap * friction * _sign(edgeSpeed));
                }
            }
        });

        collisionBodies.forEach(body => {
            (body.speed as number) = body.velocity.getNorm();
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
                const { overlapVector } = collisionInfo;
                results.push(_assign(collisionInfo, {
                    body1, body2,
                    edgeVector: overlapVector.isZero() ? _null : overlapVector.clone().turn().normalize()
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
                delta = body1.radius + body2.radius - offset.getNorm();
            return delta < 0 ? _null : {
                overlap: delta,
                overlapVector: offset.setNorm(delta)
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
