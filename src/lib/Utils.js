/* 
 * Class: Utils
 */

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// External Dependencies
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
import vec2 from 'gl-matrix/src/gl-matrix/vec2'

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// Internal Dependencies
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// Class Definition
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

class Utils {

    constructor() {
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // Methods
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    
    static perpendicularVector(vecIn, vecOut = vec2.create()) {
        const a = -vecIn[1];
        const b = vecIn[0];

        vecOut[0] = a;
        vecOut[1] = b;

        return vecOut;
    }

    static isCCW(a, b) {
        return vec2.dot(b, Utils.perpendicularVector(a)) > 0;
    }

    static findClosestPointOnEdgeSquared(
        pointQ,
        pointA,
        pointB,
        hitPoint = vec2.create(),
        normal   = vec2.create()
    ) {
        const AQ = vec2.create();
        AQ[0] = pointQ[0] - pointA[0];
        AQ[1] = pointQ[1] - pointA[1];

        const AB = vec2.create();
        AB[0] = pointB[0] - pointA[0];
        AB[1] = pointB[1] - pointA[1];

        const edgeLength = vec2.length(AB);
        if (edgeLength > 0.00001) {
            AB[0] /= edgeLength;
            AB[1] /= edgeLength;
        }

        Utils.perpendicularVector(AB, normal);

        var edgeD = 0;
        var dist  = 0;

        const k = vec2.dot(AQ, AB);
        if (k <= 0) {
            edgeD = 0;
            dist  = vec2.squaredDistance(pointQ, pointA);
            vec2.copy(hitPoint, pointA);
        } else if (k >= edgeLength) {
            edgeD = 1;
            dist  = vec2.squaredDistance(pointQ, pointB);
            vec2.copy(hitPoint, pointB);
        } else {
            const ax = AQ[0], ay = AQ[1], bx = AB[0], by = AB[1];

            dist  = ax * by - ay * bx;
            dist *= dist;

            edgeD = k / edgeLength;

            hitPoint[0] = pointA[0] + (AB[0] * k);
            hitPoint[1] = pointA[1] + (AB[1] * k);
        }

        return { dist, edgeD, hitPoint, normal };
    }

    static calculateSpringForce(spring, vecOut = vec2.create()) {
        var BtoAX = spring.pointMassA.position[0] - spring.pointMassB.position[0];
        var BtoAY = spring.pointMassA.position[1] - spring.pointMassB.position[1];

        var dist = Math.sqrt((BtoAX * BtoAX) + (BtoAY * BtoAY));
        if (dist > 0.0001) {
            BtoAX /= dist;
            BtoAY /= dist;
        } else {
            vecOut[0] = 0;
            vecOut[1] = 0;

            return vecOut;
        }

        dist = spring.D - dist;

        const relVelX = spring.pointMassA.velocity[0] - spring.pointMassB.velocity[0];
        const relVelY = spring.pointMassA.velocity[1] - spring.pointMassB.velocity[1];

        const totalRelVel = (relVelX * BtoAX) + (relVelY * BtoAY);

        vecOut[0] = BtoAX * ((dist * spring.K) - (totalRelVel * spring.damping));
        vecOut[1] = BtoAY * ((dist * spring.K) - (totalRelVel * spring.damping));

        return vecOut;
    }

    static calculateSpringForceFromValues(
        positionA,
        velocityA,
        positionB,
        velocityB,
        D       = 0,
        K       = 0,
        damping = 0,
        vecOut  = vec2.create()
    ) {
        var BtoAX = positionA[0] - positionB[0];
        var BtoAY = positionA[1] - positionB[1];

        var dist = Math.sqrt((BtoAX * BtoAX) + (BtoAY * BtoAY));
        if (dist > 0.0001) {
            BtoAX /= dist;
            BtoAY /= dist;
        } else {
            vecOut[0] = 0;
            vecOut[1] = 0;

            return vecOut;
        }

        dist = D - dist;

        const relVelX = velocityA[0] - velocityB[0];
        const relVelY = velocityA[1] - velocityB[1];

        const totalRelVel = (relVelX * BtoAX) + (relVelY * BtoAY);

        vecOut[0] = BtoAX * ((dist * K) - (totalRelVel * damping));
        vecOut[1] = BtoAY * ((dist * K) - (totalRelVel * damping));

        return vecOut;
    }


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // Properties
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    // ...
}

export default Utils;
