import { Renderable } from "../renderer/Renderer";
import { Vector, VectorLike } from "../geometry/Vector";
import { _abs, EMPTY_OBJECT, _assign, _Set } from "../utils/references";
import { Shape, ShapeOptions } from "./Shape";
import { Body } from "../physics/Body";
import { Vertices } from "../geometry/Vertices";

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

    constructor(options: Readonly<PolygonOptions> = EMPTY_OBJECT) {
        super(_assign({}, Polygon.defaults, options));

        if (options.vertices) {
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
        const { bounds } = this;
        if (vertices.length > 1) {
            const { clockwise, adjustment } = this,
                { normalPrecision: NormalPrecision } = Body,
                areas = new Array<number>(),
                normals = new Array<Vector>(),
                centers = new Array<Vector>(),
                tangents = new _Set<string>();
            let totalArea = 0;
            vertices.reduce(
                (vertex1, vertex2) => {
                    const area = Vector.cross(vertex1, vertex2) / 2;
                    totalArea += area;
                    const normal = Vector.minus(vertex2, vertex1).turn(clockwise),
                        tangent = (normal.y / normal.x).toFixed(NormalPrecision);
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
                const offset = Vector.mix(centers.map((center, i) => center.scale(areas[i] / totalArea)));
                vertices.forEach(vertex => {
                    vertex.minusVector(offset);
                });
            }
            vertices.forEach(({ x, y }, i) => {
                if (i > 0) {
                    if (x < bounds.left) {
                        bounds.left = x;
                    } else if (x > bounds.right) {
                        bounds.right = x;
                    }
                    if (y < bounds.top) {
                        bounds.top = y;
                    } else if (y > bounds.bottom) {
                        bounds.bottom = y;
                    }
                } else {
                    bounds.left = bounds.right = x;
                    bounds.top = bounds.bottom = y;
                }
            });
            if (clockwise) {
                totalArea = -totalArea;
            }
            (this.area as number) = totalArea;
            (this.normals as Vector[]) = normals;
            (this.mass as number) = totalArea * this.density;
        } else {
            (this.area as number) = (this.mass as number) = 0;
            const { position } = this;
            bounds.left = bounds.right = position.x;
            bounds.top = bounds.bottom = position.y;
        }
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
