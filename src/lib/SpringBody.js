/* 
 * Class: SpringBody
 */

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// External Dependencies
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
import vec2 from 'gl-matrix/src/gl-matrix/vec2'

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// Internal Dependencies
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
import Body from './Body'
import Spring from './Spring'
import Utils from './Utils'

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// Class Definition
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

class SpringBody extends Body {

    constructor(
        shape,
        massPerPoint,
        edgeSpringK,
        edgeSpringDamp,
        shapeSpringK    = 0,
        shapeSpringDamp = 0,
        position        = vec2.create(),
        angleInRadians  = 0,
        scale           = vec2.fromValues(1, 1),
        kinematic       = false
    ) {
        super(shape, massPerPoint, position, angleInRadians, scale, kinematic);

        this.edgeSpringK     = edgeSpringK;
        this.edgeSpringDamp  = edgeSpringDamp;
        this.shapeSpringK    = shapeSpringK;
        this.shapeSpringDamp = shapeSpringDamp;

        this.shapeMatchingOn = shapeSpringK ? true : false;

        this.springs = [];
        this.setPositionAngleScale(position, angleInRadians, scale);

        this.generateEdgeSprings();
    }

    generateEdgeSprings() {
        const len = this.pointMassList.length;

        for(var i = 0; i < len; i++) {
            const a = i;
            const b = i < (len - 1) ? i + 1 : 0;

            const pmA = this.pointMassList[a];
            const pmB = this.pointMassList[b];

            this.addSpring(pmA, pmB, this.edgeSpringK, this.edgeSpringDamp);
        }
    }

    addSpring(pmA, pmB, k, damping) {
        const dist   = vec2.distance(pmA.position, pmA.position);
        const spring = new Spring(pmA, pmB, dist, k, damping);

        this.springs.push(spring);
    }

    setShapeMatchingConstants(k, damping) {
        this.shapeSpringK    = k;
        this.shapeSpringDamp = damping;
    }

    setEdgeSpringConstants(k, damping) {
        this.edgeSpringK    = k;
        this.edgeSpringDamp = damping;

        const len = this.springs.length;
        for(var i = 0; i < len; i++) {
            this.springs[i].K       = k;
            this.springs[i].damping = damping;
        }
    }

    accumulateInternalForces() {
        super.accumulateInternalForces();

        const len   = this.springs.length;
        const force = vec2.create();

        for(var i = 0; i < len; i++) {
            const spring = this.springs[i];

            const pmA = spring.pointMassA;
            const pmB = spring.pointMassB;

            Utils.calculateSpringForce(spring, force);

            pmA.force[0] += force[0];
            pmA.force[1] += force[1];
            pmB.force[0] -= force[0];
            pmB.force[1] -= force[1];
        }

        if (this.shapeMatchingOn) {
            this.baseShape.transformVertices(this.derivedPosition, this.derivedAngle, this.scale, this.globalShape);

            const zeroVector = vec2.create();
            for (let i = 0; i < this.pointMassList.length; i++) {

                if (this.shapeSpringK > 0) {
                    const velocity = this.isKinematic ? zeroVector : this.pointMassList[i].velocity;

                    Utils.calculateSpringForceFromValues(
                        this.pointMassList[i].position, 
                        this.pointMassList[i].velocity,
                        this.globalShape[i],
                        velocity, 
                        0,
                        this.shapeSpringK,
                        this.shapeSpringDamp,
                        force);

                    this.pointMassList[i].force[0] += force[0];
                    this.pointMassList[i].force[1] += force[1];
                }
            }
        }
    }

    accumulateExternalForces() {
        super.accumulateExternalForces();

        const len   = this.pointMassList.length;
        for(var i = 0; i < len; i++) {
            this.pointMassList[i].force[1] += 0.9;
        }
    }
}



export default SpringBody;
