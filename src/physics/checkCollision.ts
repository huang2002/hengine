import { Body } from "./Body";
import { Vector } from "../geometry/Vector";
import { _null, _Infinity, _abs } from "../utils/references";

export const checkCollision = function chkColl(body1: Body, body2: Body): Vector | null {

    if (body2.isCircle) {
        if (body1.isCircle) {
            const offset = Vector.minus(body2.position, body1.position),
                delta = offset.getModulus() - body1.radius - body2.radius;
            return delta > 0 ?
                offset.setModulus(delta) :
                _null;
        } else {
            return checkCollision(body2, body1);
        }
    }

    let normals = body2.normals.slice();
    if (body1.isCircle) {
        normals.push(body2.getClosest(body1.position));
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

    return minDirection;

};
