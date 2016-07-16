/* 
 * Class: Body
 */

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// External Dependencies
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
import vec2 from 'gl-matrix/src/gl-matrix/vec2'

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// Internal Dependencies
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
import AABB from './AABB'
import Bitmask from './Bitmask'
import PointMass from './PointMass'
import Utils from './Utils'

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// Class Definition
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

class Body {

    constructor(
        shape,
        massPerPoint,
        position       = vec2.create(),
        angleInRadians = 0,
        scale          = vec2.fromValues(1, 1),
        kinematic      = true
    ) {

        this.aabb            = new AABB();
        this.baseShape       = shape;

        this.globalShape     = [];
        this.pointMassList   = [];

        this.scale           = scale;
        this.derivedOmega    = 0;
        this.derivedPosition = position;
        this.derivedVelocity = vec2.create();
        this.derivedAngle    = angleInRadians;
        this.lastAngle       = angleInRadians;

        this.isStatic        = false;
        this.isKinematic     = false;
        this.ignoreMe        = false;

        this.velocityDamping = 0.999;
        this.material        = 0;

        this.bitmaskX        = new Bitmask();
        this.bitmaskY        = new Bitmask();

        this.setShape(shape);

        for (var i = 0; i < this.pointMassList.length; i++) {
            this.pointMassList[i].mass = massPerPoint;
        }
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // Methods
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    
    setShape(shape) {
        this.baseShape = shape;

        if (this.baseShape.vertices.length != this.pointMassList.length) {
            this.pointMassList = [];
            this.globalShape   = this.baseShape.vertices.map((o) => vec2.clone(o));

            this.baseShape.transformVertices(this.derivedPosition, this.derivedAngle, this.scale, this.globalShape);

            for (var i = 0; i < this.baseShape.vertices.length; i++) {
                this.pointMassList.push(new PointMass(0, vec2.clone(this.globalShape[i])));
            }
        }
    }

    setMassAll(mass) {
        for (var i = 0; i < this.pointMassList.length; i++) {
            this.pointMassList[i].mass = mass;
        }

        if (!Number.isFinite(mass)) { this.isStatic = true; }
    }

    setPositionAngleScale(position, angleInRadians, scale) {
        this.baseShape.transformVertices(position, angleInRadians, scale, this.globalShape);

        for (var i = 0; i < this.baseShape.length; i++) {
            this.pointMassList[i].position[0] = this.globalShape[i][0];
            this.pointMassList[i].position[1] = this.globalShape[i][1];
        }

        this.derivedPosition = position;
        this.derivedAngle    = angleInRadians;
    }

    setKinematicPosition(position) {
        this.derivedPosition = position;
    }

    setKinematicAngle(angleInRadians) {
        this.derivedAngle = angleInRadians;
    }

    setKinematicScale(scale) {
        this.scale[0] = scale[0];
        this.scale[1] = scale[1];
    }

    derivePositionAndAngle(elapsed) {
        if (this.isStatic || this.isKinematic) {
            return;
        }

        const center   = vec2.create();
        const velocity = vec2.create();
        const len      = this.pointMassList.length;

        var cx,cy,vx,vy;
        cx = cy = vx = vy = 0;

        for (var i = 0; i < len; i++) {
            cx += this.pointMassList[i].position[0];
            cy += this.pointMassList[i].position[1];
            vx += this.pointMassList[i].velocity[0];
            vy += this.pointMassList[i].velocity[1];
        }

        cx /= len;
        cy /= len;
        vx /= len;
        vy /= len;

        this.derivedPosition[0] = cx;
        this.derivedPosition[1] = cy;
        this.derivedVelocity[0] = vx;
        this.derivedVelocity[1] = vy;

        var angle         = 0,
            originalSign  = 1,
            originalAngle = 0;

        var baseNormal    = vec2.create(),
            currentNormal = vec2.create();

        for (let i = 0; i < len; i++) {
            vec2.set(baseNormal,
                     this.baseShape.vertices[i][0], 
                     this.baseShape.vertices[i][1]);
            vec2.normalize(baseNormal, baseNormal);

            vec2.set(currentNormal, 
                     this.pointMassList[i].position[0] - this.derivedPosition[0], 
                     this.pointMassList[i].position[1] - this.derivedPosition[1]);
            vec2.normalize(currentNormal, currentNormal);

            var dot = vec2.dot(baseNormal, currentNormal);

            if (dot >  1) { dot =  1; }
            if (dot < -1) { dot = -1; }

            var theta = Math.acos(dot);
            if (!Utils.isCCW(baseNormal, currentNormal)) {
                theta = -theta;
            }

            if (i === 0) {
                originalSign  = (theta >= 0) ? 1 : -1;
                originalAngle = theta;
            } else {
                var diff = (theta - originalAngle);
                var currSign = (theta >= 0) ? 1 : -1;

                if ((Math.abs(diff) > Math.PI) && (currSign != originalSign)) {
                    theta = (currSign == -1) ? (Math.PI + (Math.PI + theta)) : ((Math.PI - theta) - Math.PI);
                }
            }

            angle += theta;
        }

        this.derivedAngle = angle / len;

        var angleChange = this.derivedAngle - this.lastAngle;
        if (Math.abs(angleChange) >= Math.PI) {
            if (angleChange < 0) {
                angleChange = angleChange + Math.PI * 2;
            } else {
                angleChange = angleChange - Math.PI * 2;
            }
        }

        this.derivedOmega = angleChange / elapsed;
        this.lastAngle = this.derivedAngle;
    }

    integrate(elapsed) {
        if (this.isStatic) {
            return;
        }

        for (var i = 0; i < this.pointMassList.length; i++) {
            this.pointMassList[i].integrate(elapsed);
        }
    }

    accumulateExternalForces() {
    }

    accumulateInternalForces() {
    }

    dampenVelocity(elapsed) {
        if (this.isStatic) {
            return;
        }

        for (var i = 0; i < this.pointMassList.length; i++) {
            this.pointMassList[i].velocity[0] *= this.velocityDamping;
            this.pointMassList[i].velocity[1] *= this.velocityDamping;
        }
    }

    updateAABB(elapsed, forceUpdate) {
        if ((!this.isStatic) || (forceUpdate)) {
            this.aabb.clear();

            for (var i = 0; i < this.pointMassList.length; i++) {
                const pointMass = this.pointMassList[i];
                this.aabb.expandToInclude(pointMass.position);

                // expanding for velocity only makes sense for dynamic objects.
                if (!this.isStatic) {
                    pointMass.position[0] += (pointMass.velocity[0] * elapsed);
                    pointMass.position[1] += (pointMass.velocity[1] * elapsed);
                    this.aabb.expandToInclude(pointMass.position);
                }
            }
        }
    }

    contains(position) {
        const len = this.pointMassList.length;
        const endPoint = vec2.create();

        endPoint[0] = this.aabb.max[0] + 0.1;
        endPoint[1] = position[1];

        var inside, edgeStart, edgeEnd;
        edgeStart = this.pointMassList[0].position;
        inside    = false;

        for (var i = 0; i < len; i++) {
            if (i < (len - 1)) {
                edgeEnd = this.pointMassList[i + 1].position;
            } else {
                edgeEnd = this.pointMassList[0].position;
            }

            if (((edgeStart[0] <= position[0]) && (edgeEnd[0] >  position[0])) || 
                ((edgeStart[1] >  position[1]) && (edgeEnd[1] <= position[1]))) {

                const slope = (edgeEnd[0] - edgeStart[0]) / (edgeEnd[1] - edgeStart[1]);
                const hitX  = edgeStart[0] + ((position[1] - edgeStart[1]) * slope);

                if ((hitX >= position[0]) && (hitX <= endPoint[0])) {
                    inside = !inside;
                }
            }

            edgeStart = edgeEnd;
        }

        return inside;
    }

    findClosestPointOnEdge(
        position,
        edgeIndex,
        outHitPoint = vec2.create(),
        outNormal   = vec2.create()
    ) {
        const len = this.pointMassList.length;
        const a   = edgeIndex;
        const b   = (edgeIndex < (len - 1)) ? edgeIndex + 1 : 0;

        const pointA = this.pointMassList[a];
        const pointB = this.pointMassList[b];

        return Utils.findClosestPointOnEdge(position, pointA.position, pointB.position, outHitPoint, outNormal);
    }

    findClosestPointOnEdgeSquared(
        position,
        edgeIndex,
        outHitPoint = vec2.create(),
        outNormal   = vec2.create()
    ) {
        const len = this.pointMassList.length;
        const a   = edgeIndex;
        const b   = (edgeIndex < (len - 1)) ? edgeIndex + 1 : 0;

        const pointA = this.pointMassList[a];
        const pointB = this.pointMassList[b];

        return Utils.findClosestPointOnEdgeSquared(position, pointA.position, pointB.position, outHitPoint, outNormal);
    }

    findClosestPointFromExternalPosition(
        position, 
        outHitPoint = vec2.create(),
        outNormal   = vec2.create()
    ) {
        const len = this.pointMassList.length;

        var closest = Number.POSITIVE_INFINITY;
        var outPointA, outPointB, outEdgeD;
        var outPointAIndex, outPointBIndex;

        for (var i = 0; i < len; i++) {
            const a = i;
            const b = (i < (len - 1)) ? i + 1 : 0;

            const pointA = this.pointMassList[a];
            const pointB = this.pointMassList[b];

            const { dist, distD, hitPoint, normal } =
                Utils.findClosestPointOnEdge(position, pointA.position, pointB.position);

            if (dist < closest) {
                closest   = dist;
                outPointA = pointA;
                outPointB = pointB;
                outEdgeD  = edgeD;

                outPointAIndex = a;
                outPointBIndex = b;

                vec2.copy(outHitPoint, hitPoint);
                vec2.copy(outNormal, normal);
            }
        }

        return {
            dist        : closest,
            edgeD       : outEdgeD,
            pointA      : outPointA,
            pointAIndex : outPointAIndex,
            pointB      : outPointB,
            pointBIndex : outPointBIndex,
            hitPoint    : outHitPoint,
            normal      : outNormal
        };
    }

    findClosestPointMass(position) {
        const len = this.pointMassList.length;

        var closest = Number.POSITIVE_INFINITY;
        var outPoint, outPointIndex;

        const edge = vec2.create();
        for (var i = 0; i < len; i++) {
            const point = this.pointMassList[i];

            edge[0] = position[0] - point.position[0];
            edge[1] = position[1] - point.position[1];

            const dist = vec2.squaredLength(QP);
            if (closest < dist) {
                closest       = dist;
                outPoint      = point;
                outPointIndex = i;
            }
        }

        return {
            dist       : closest,
            point      : outPoint,
            pointIndex : outPointIndex
        }
    }
}

export default Body;
