import { Body } from "./Body";
import { Vector } from "../geometry/Vector";
import { _null, _Infinity, _abs, _min } from "../common/references";

// TODO: interface CollisionCheckingResult { point: Vector; vector: Vector; }
export type CollisionCheckingResult = Vector;

export type CollisionChecker = (body1: Body, body2: Body) => CollisionCheckingResult | null;

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

    check(bodies, checker) {
        const bodiesCount = bodies.length;
        for (let i = 0; i < bodiesCount; i++) {
            const body1 = bodies[i],
                { category: category1,
                    velocity: v1,
                    position: p1,
                    active: active1,
                    sensorFilter: sensorFilter1,
                    elasticity: elasticity1,
                    stiffness: stiffness1,
                    roughness: roughness1 } = body1;
            for (let j = i + 1; j < bodiesCount; j++) {
                const body2 = bodies[j];

                if (!(category1 & body2.collisionFilter && body1.collisionFilter & body2.category)) {
                    continue;
                }

                const separatingVector = checker(body1, body2);
                if (!separatingVector) {
                    continue;
                }

                body1.emit('collision', body2, separatingVector);
                body2.emit('collision', body1, separatingVector);

                if (category1 & body2.sensorFilter || sensorFilter1 & body2.category) {
                    continue;
                }

                const { velocity: v2, position: p2 } = body2,
                    elasticity = _min(elasticity1, body2.elasticity),
                    roughness = _min(roughness1, body2.roughness),
                    edgeVector = separatingVector.clone().turn();
                if (active1) {
                    if (body2.active) {
                        Vector.distribute(separatingVector, p1, p2, -stiffness1, body2.stiffness);
                        if (elasticity) {
                            Vector.distribute(separatingVector, v1, v2, -elasticity, elasticity);
                        }
                        if (roughness) {
                            const relativeVelocity = Vector.minus(v2, v1),
                                relativeEdgeVelocity = Vector.projectVector(relativeVelocity, edgeVector)
                            v1.minusVector(relativeEdgeVelocity, roughness);
                            v2.minusVector(relativeEdgeVelocity, roughness);
                        }
                        // TODO: solve the rotations of body1 & body2 here
                    } else {
                        p1.minusVector(separatingVector, (stiffness1 + body2.stiffness) / 2);
                        if (elasticity) {
                            v1.minusVector(separatingVector, elasticity);
                        }
                        if (roughness) {
                            v1.minusVector(Vector.projectVector(v1, separatingVector), roughness);
                        }
                        // TODO: solve the rotation of body1 here
                    }
                } else {
                    if (body2.active) {
                        p2.plusVector(separatingVector, (stiffness1 + body2.stiffness) / 2);
                        if (elasticity) {
                            v2.plusVector(separatingVector, elasticity);
                        }
                        if (roughness) {
                            v2.plusVector(Vector.projectVector(v2, separatingVector), roughness);
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
                return Collision.Checker.SAT(body2, body1);
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
                    Collision.Checker.Distance(body1, body2) :
                    Collision.Checker.SAT(body1, body2);
            } else {
                return _null;
            }
        },

    },

};
