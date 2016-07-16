/* 
 * Class: PressureBody
 */

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// External Dependencies
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
import vec2 from 'gl-matrix/src/gl-matrix/vec2'

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// Internal Dependencies
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
import SpringBody from './SpringBody'
import Utils from './Utils'

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// Class Definition
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

class PressureBody extends SpringBody {

    constructor(
        shape,
        massPerPoint,
        gasPressure,
        shapeSpringK    = 0,
        shapeSpringDamp = 0,
        edgeSpringK     = 0,
        edgeSpringDamp  = 0,
        position        = vec2.create(),
        angleInRadians  = 0,
        scale           = vec2.fromValues(1, 1),
        kinematic       = false
    ) {
        super(
            shape,
            massPerPoint,
            shapeSpringK,
            shapeSpringDamp,
            edgeSpringK,
            edgeSpringDamp,
            position,
            angleInRadians,
            scale,
            kinematic
        );

        this.volume         = 0;
        this.gasPressure    = gasPressure;
        this.edgeLengthList = [];
        this.normalList     = this.globalShape.map((o) => vec2.create());
    }

    accumulateInternalForces() {
        super.accumulateInternalForces();

        this.volume = 0;

        const edge1N = vec2.create();
        const edge2N = vec2.create();
        const normal = vec2.create();

        const len = this.pointMassList.length;
        for(let i = 0; i < len; i++) {
            const prev = (i > 0) ? i - 1 : len - 1;
            const next = (i < len - 1) ? i + 1 : 0;

            edge1N[0] = this.pointMassList[i].position[0] - this.pointMassList[prev].position[0];
            edge1N[1] = this.pointMassList[i].position[1] - this.pointMassList[prev].position[1];
            edge2N[0] = this.pointMassList[next].position[0] - this.pointMassList[i].position[0];
            edge2N[1] = this.pointMassList[next].position[1] - this.pointMassList[i].position[1];

            Utils.perpendicularVector(edge1N, edge1N);
            Utils.perpendicularVector(edge2N, edge2N);

            normal[0] = edge1N[0] + edge2N[0],
            normal[1] = edge1N[1] + edge2N[1]
            const nL = Math.sqrt((normal[0] * normal[0])+(normal[1] * normal[1]));
            if (nL > 0.001) {
                normal[0] /= nL;
                normal[1] /= nL;
            }

            const edgeL = Math.sqrt((edge2N[0] * edge2N[0])+(edge2N[1] * edge2N[1]));
            
            this.normalList[i][0]  = normal[0];
            this.normalList[i][1]  = normal[1];
            this.edgeLengthList[i] = edgeL;

            const xdist         = Math.abs(this.pointMassList[i].position[0] - this.pointMassList[next].position[0]);
            const volumeProduct = xdist * Math.abs(normal[0]) * edgeL;

            this.volume += 0.5 * volumeProduct;
        }

        const invVolume = 1 / this.volume;
        for(let i = 0; i < len; i++) {
            let j = (i < len - 1) ? i + 1 : 0;

            const pressureV = (invVolume * this.edgeLengthList[i] * this.gasPressure);

            this.pointMassList[i].force[0] += this.normalList[i][0] * pressureV;
            this.pointMassList[i].force[1] += this.normalList[i][1] * pressureV;
            this.pointMassList[j].force[0] += this.normalList[j][0] * pressureV;
            this.pointMassList[j].force[1] += this.normalList[j][1] * pressureV;
        }

    }
}

export default PressureBody;
