/* 
 * Class: ClosedShape
 */

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// External Dependencies
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
import vec2 from 'gl-matrix/src/gl-matrix/vec2'

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// Internal Dependencies
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
import Utils from './Utils'

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// Class Definition
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

class ClosedShape {

    constructor(vertices) {

        this.vertices = vertices || [];

        if (vertices) {
            this.finish();
        }
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // Methods
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    begin() {
        this.vertices = [];
    }

    addVertex(vec) {
        this.vertices.push(vec);
        return this.vertices.length;
    }

    finish(recenter = true) {
        if (recenter) {
            const center = vec2.create();

            for (let i = 0; i < this.vertices.length; i++) {
                center[0] += this.vertices[i][0];
                center[1] += this.vertices[i][1];
            }

            center[0] /= this.vertices.length;
            center[1] /= this.vertices.length;

            for (let i = 0; i < this.vertices.length; i++) {
                this.vertices[i][0] -= center[0];
                this.vertices[i][1] -= center[1];
            }
        }
    }

    transformVertices(worldPosition, angleInRadians, scale, outVertexList) {
        const c = Math.cos(angleInRadians);
        const s = Math.sin(angleInRadians);

        for (let i = 0; i < this.vertices.length; i++) {
            const x   = this.vertices[i][0] * scale[0];
            const y   = this.vertices[i][1] * scale[1];

            const vec = vec2.fromValues(
                (c * x) - (s * y) + worldPosition[0],
                (c * y) + (s * x) + worldPosition[1]
            );

            outVertexList[i][0] = vec[0];
            outVertexList[i][1] = vec[1];
        }

        return outVertexList;
    }
}

export default ClosedShape;
