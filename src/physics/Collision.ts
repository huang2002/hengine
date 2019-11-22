import { Body, BodyLike } from "./Body";
import { Vector } from "../geometry/Vector";
import { _null, _Infinity, _min, _max, _assign, _abs, _Set, _sign } from "../common/references";

export type CollisionResult = Readonly<{
    overlap: number;
    overlapVector: Vector;
    // TODO: point: Vector;
}>;

export type CollisionInfo = CollisionResult & Readonly<{
    body1: Body;
    body2: Body;
    edgeVector: Vector | null;
    relativeVelocity: Vector;
}>;

export type CollisionChecker = (body1: BodyLike, body2: BodyLike) => CollisionResult | null;

export type CollisionObject = Readonly<{
    find(bodies: Body[], checker: CollisionChecker): CollisionInfo[];
    solve(bodies: Body[], checker: CollisionChecker): void;
    Checker: Readonly<{
        AABB: CollisionChecker;
        SAT: CollisionChecker;
        Distance: CollisionChecker;
        Smart: CollisionChecker;
    }>;
}>;

export const Collision: CollisionObject = {

    find(bodies, checker) {
        const results = new Array<CollisionInfo>(),
            bodiesCount = bodies.length;
        for (let i = 0; i < bodiesCount; i++) {
            const body1 = bodies[i],
                { category: category1, velocity: velocity1 } = body1;
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
                    edgeVector:
                        overlapVector.isZero() ? _null : overlapVector.clone().turn().normalize(),
                    relativeVelocity: Vector.minus(body2.velocity, velocity1)
                }));
            }
        }
        return results;
    },

    solve(bodies, checker) {

        const { maxStaticSpeed } = Body;

        Collision.find(bodies, checker).filter(collisionInfo => {

            const { body1, body2, overlapVector } = collisionInfo,
                { velocity: v1, stiffness: stiffness1, slop: slop1,
                    mass: m1, elasticity: elasticity1 } = body1;

            overlapVector.reverse();
            body1.emit('collision', body2, collisionInfo);
            overlapVector.reverse();
            body2.emit('collision', body1, collisionInfo);

            if (body1.category & body2.sensorFilter || body1.sensorFilter & body2.category) {
                return false;
            }

            const { velocity: v2, mass: m2 } = body2,
                slop = slop1 + body2.slop,
                impulse = collisionInfo.overlap * (stiffness1 + body2.stiffness) / 2,
                impulseScale = impulse > slop ? (impulse - slop) / impulse : 0,
                { edgeVector, relativeVelocity } = collisionInfo,
                isSeparating = Vector.dot(relativeVelocity, overlapVector) < 0,
                bounceScale = _max(elasticity1, body2.elasticity) + 1,
                relativeNormalVelocity = Vector.projectVector(relativeVelocity, overlapVector);
            if (body1.active) {
                if (body2.active) {
                    if (impulseScale) {
                        v1.minusVector(overlapVector, impulseScale / 2);
                        v2.plusVector(overlapVector, impulseScale / 2);
                    }
                    if (edgeVector && isSeparating) {
                        Vector.distribute(relativeNormalVelocity, v1, v2, m2, -m1, bounceScale);
                    }
                } else {
                    if (impulseScale) {
                        v1.minusVector(overlapVector, impulseScale);
                    }
                    if (edgeVector && isSeparating) {
                        v1.plusVector(relativeNormalVelocity, bounceScale);
                    }
                }
            } else {
                if (body2.active) {
                    if (impulseScale) {
                        v2.plusVector(overlapVector, impulseScale);
                    }
                    if (edgeVector && isSeparating) {
                        v2.minusVector(relativeNormalVelocity, bounceScale);
                    }
                } else {
                    return false;
                }
            }

            return edgeVector;

        }).forEach(collisionInfo => {
            // TODO: solve rotation
            const { body1, body2 } = collisionInfo;
            body1.contact.add(body2);
            body2.contact.add(body1);
            const { velocity: v1 } = body1,
                { velocity: v2 } = body2,
                friction = _min(body1.friction, body2.friction),
                staticFriction = _min(body1.staticFriction, body2.staticFriction);
            if (!staticFriction) {
                return;
            }
            const { overlap, edgeVector, relativeVelocity } =
                collisionInfo as CollisionInfo & { edgeVector: Vector },
                relativeEdgeSpeed = Vector.project(relativeVelocity, edgeVector),
                absRelativeEdgeSpeed = _abs(relativeEdgeSpeed);
            if (body1.active) {
                if (body2.active) {
                    if (
                        absRelativeEdgeSpeed < maxStaticSpeed &&
                        overlap * staticFriction >= absRelativeEdgeSpeed ||
                        overlap * friction >= absRelativeEdgeSpeed
                    ) {
                        const relativeEdgeVelocity =
                            Vector.projectVector(relativeVelocity, edgeVector).shrink(2);
                        v1.plusVector(relativeEdgeVelocity);
                        v2.minusVector(relativeEdgeVelocity);
                    } else if (friction) {
                        Vector.distribute(
                            edgeVector,
                            v1, v2,
                            body2.mass, -body1.mass,
                            overlap * friction * _sign(relativeEdgeSpeed)
                        );
                    }
                } else {
                    if (
                        absRelativeEdgeSpeed < maxStaticSpeed &&
                        overlap * staticFriction >= absRelativeEdgeSpeed ||
                        overlap * friction >= absRelativeEdgeSpeed
                    ) {
                        v1.plusVector(edgeVector, relativeEdgeSpeed);
                    } else if (friction) {
                        v1.plusVector(edgeVector, overlap * friction * _sign(relativeEdgeSpeed));
                    }
                }
            } else {
                if (
                    absRelativeEdgeSpeed < maxStaticSpeed &&
                    overlap * staticFriction >= absRelativeEdgeSpeed ||
                    overlap * friction >= absRelativeEdgeSpeed
                ) {
                    v2.minusVector(edgeVector, relativeEdgeSpeed);
                } else if (friction) {
                    v2.minusVector(edgeVector, overlap * friction * _sign(relativeEdgeSpeed));
                }
            }
        });

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

        SAT(body1, body2) {

            const { position: position1 } = body1;

            if (body2.isCircle && !body1.isCircle) {
                const result = Collision.Checker.SAT(body2, body1);
                if (result) {
                    result.overlapVector.reverse();
                }
                return result;
            }

            const normals = body1.normals.concat(
                body2.normals,
                Vector.minus(position1, body2.getClosest(position1)).normalize()
            );
            if (!body1.isCircle) {
                const { position: position2 } = body2;
                normals.push(Vector.minus(position2, body1.getClosest(position2)).normalize());
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
