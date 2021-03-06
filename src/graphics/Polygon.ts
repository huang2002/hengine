import { Renderable } from "../renderer/Renderer";
import { Vector, VectorLike } from "../geometry/Vector";
import { Shape, ShapeOptions } from "./Shape";
import { Body } from "../physics/Body";
import { Vertices } from "../geometry/Vertices";
import { Utils } from "../common/Utils";

export type PolygonOptions = ShapeOptions & Partial<{
    vertices: ReadonlyArray<Vector>;
    clockwise: boolean;
    adjustment: boolean;
}>;

export class Polygon extends Shape implements Required<PolygonOptions>, Renderable {

    static defaults: PolygonOptions = {
        clockwise: true,
        adjustment: true,
    };

    constructor(options: Readonly<PolygonOptions> = Utils.Const.EMPTY_OBJECT) {
        super(Object.assign({}, Polygon.defaults, options));

        if (this.vertices) {
            this.updateVertices();
        } else {
            this.vertices = [];
        }

    }

    vertices!: ReadonlyArray<Vector>;
    clockwise!: boolean;
    adjustment!: boolean;

    updateVertices(vertices?: ReadonlyArray<Vector>) {
        if (vertices) {
            this.vertices = vertices;
        } else {
            vertices = this.vertices;
        }
        if (vertices.length > 1) {
            const { clockwise, adjustment } = this,
                { normalPrecision } = Body,
                areas = new Array<number>(),
                normals = new Array<Vector>(),
                centers = new Array<Vector>(),
                tangents = new Set<string>();
            let totalArea = 0;
            vertices.reduce(
                (vertex1, vertex2) => {
                    const area = Vector.cross(vertex1, vertex2) / 2;
                    totalArea += area;
                    const normal = Vector.minus(vertex2, vertex1).turn(clockwise),
                        tangent = (normal.y / normal.x).toFixed(normalPrecision);
                    if (!tangents.has(tangent)) {
                        tangents.add(tangent);
                        normals.push(normal.normalize());
                    }
                    if (adjustment) {
                        centers.push(Vector.of(
                            (vertex1.x + vertex2.x) / 3,
                            (vertex1.y + vertex2.y) / 3
                        ));
                        areas.push(area);
                    }
                    return vertex2;
                },
                vertices[vertices.length - 1]
            );
            if (adjustment) {
                const offset = Vector.plus(centers.map((center, i) => center.scale(areas[i] / totalArea)));
                vertices.forEach(vertex => {
                    vertex.minusVector(offset);
                });
            }
            if (!clockwise) {
                totalArea = -totalArea;
            }
            (this.normals as Vector[]) = normals;
            this._setArea(totalArea);
        } else {
            this._setArea(0);
        }
        this.updateBounds();
        return this;
    }

    protected _scale(scaleX: number, scaleY: number, origin?: VectorLike) {
        this.vertices.forEach(vertex => {
            vertex.scale(scaleX, scaleY, origin);
        });
    }

    protected _rotate(rotation: number, origin?: VectorLike) {
        this.vertices.forEach(vertex => {
            vertex.rotate(rotation, origin);
        });
        this.normals.forEach(normal => {
            normal.rotate(rotation, origin);
        });
    }

    updateBounds() {
        const { vertices, bounds, position } = this;
        if (vertices.length) {
            bounds.updateVertices(vertices);
            bounds.moveVector(position);
        } else {
            bounds.left = bounds.right = position.x;
            bounds.top = bounds.bottom = position.y;
        }
    }

    getClosest(target: VectorLike) {
        return Vertices.findClosest(target, this.vertices);
    }

    project(direction: Vector) {
        const { vertices } = this;
        let min = 0,
            max = 0,
            projection;
        if (vertices.length) {
            vertices.forEach((vertex, i) => {
                projection = Vector.project(vertex, direction);
                if (i > 0) {
                    if (projection < min) {
                        min = projection;
                    } else if (projection > max) {
                        max = projection;
                    }
                } else {
                    min = max = projection;
                }
            });
        }
        const positionProjection = Vector.project(this.position, direction);
        return {
            min: min + positionProjection,
            max: max + positionProjection
        };
    }

    path(context: CanvasRenderingContext2D) {
        this.vertices.forEach((vertex, i) => {
            if (i > 0) {
                context.lineTo(vertex.x, vertex.y);
            } else {
                context.moveTo(vertex.x, vertex.y);
            }
        });
    }

}
