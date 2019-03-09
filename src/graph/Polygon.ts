import { Renderable } from "../renderer/index";
import { Vector } from "../geometry/index";
import { _abs, EMPTY_OBJECT, _assign, _Set } from "../utils/refs";
import { Shape, ShapeOptions } from "./Shape";
import { Body } from "../physics/Body";

export type PolygonOptions = ShapeOptions & Partial<{
    vertices: ReadonlyArray<Vector>;
    clockwise: boolean;
    centerAdjustment: boolean;
}>;

export class Polygon extends Shape implements Renderable, Required<PolygonOptions> {

    static Defaults: PolygonOptions = {
        vertices: [],
        clockwise: true,
        centerAdjustment: true,
    };

    constructor(options: Readonly<PolygonOptions> = EMPTY_OBJECT) {
        super(_assign({}, Polygon.Defaults, options));

        if (this.vertices.length) {
            this.updateVertices();
        }

    }

    vertices!: ReadonlyArray<Vector>;
    clockwise!: boolean;
    centerAdjustment!: boolean;

    updateVertices(vertices?: ReadonlyArray<Vector>) {
        if (vertices) {
            this.vertices = vertices;
        } else {
            vertices = this.vertices;
        }
        const { bounds } = this;
        if (vertices.length > 1) {
            const { clockwise, centerAdjustment } = this,
                { NORMAL_PRECISION } = Body,
                areas = new Array<number>(),
                normals = new Array<Vector>(),
                centers = new Array<Vector>(),
                normalCache = new _Set<string>();
            let totalArea = 0;
            vertices.reduce(
                (vertex1, vertex2) => {
                    const area = Vector.cross(vertex1, vertex2) / 2;
                    totalArea += area;
                    const normal = Vector.subtract(vertex2, vertex1).turn(clockwise).normalize(),
                        stringifiedNormal = normal.toString(NORMAL_PRECISION);
                    if (!normalCache.has(stringifiedNormal)) {
                        normalCache.add(stringifiedNormal);
                        normals.push(normal);
                    }
                    if (centerAdjustment) {
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
            if (centerAdjustment) {
                const offset = Vector.mix(
                    centers.map((center, i) => center.scale(areas[i] / totalArea))
                ).reverse();
                vertices.forEach(vertex => {
                    vertex.addVector(offset);
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
            this.mass = totalArea * this.density;
        } else {
            (this.area as number) = this.mass = 0;
            const { position } = this;
            bounds.left = bounds.right = position.x;
            bounds.top = bounds.bottom = position.y;
        }
        return this;
    }

    protected _scale(scaleX: number, scaleY: number, origin?: Vector) {
        this.vertices.forEach(vertex => {
            vertex.scale(scaleX, scaleY, origin);
        });
    }

    protected _rotate(rotation: number, origin?: Vector) {
        this.vertices.forEach(vertex => {
            vertex.rotate(rotation, origin);
        });
        this.normals.forEach(normal => {
            normal.rotate(rotation, origin);
        });
    }

    project(direction: Vector) {
        const { vertices } = this;
        let min!: number, max!: number,
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
        } else {
            min = max = Vector.project(this.position, direction);
        }
        return { min, max };
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
