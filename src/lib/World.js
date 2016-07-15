/* 
 * Class: World
 */

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// External Dependencies
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
import vec2 from 'gl-matrix/src/gl-matrix/vec2'

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// Internal Dependencies
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
import AABB from './AABB'
import CollisionInfo from './CollisionInfo'
import MaterialPair from './MaterialPair'
import Utils from './Utils'

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// Class Definition
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

class World {

    constructor(width, height) {
        this.bodyList = [];
        this.collisionList = [];

        this.width  = width || 20;
        this.height = height || 20;

        const min = vec2.fromValues(-this.width, -this.height);
        const max = vec2.fromValues(this.width, this.height);
        this.aabb = new AABB(min, max);

        this.gridStepSizeX = this.width / 32;
        this.gridStepSizeY = this.height / 32;

        this.materialCount = 0;
        this.materialPairs = [];
        this.createMaterial();

        this.penetrationThreshold = 0.3;
        this.penetrationCount = 0;
    }

    createMaterial() {
        const materialId = this.materialCount;
        const prevPairs  = this.materialPairs;

        this.materialCount++;
        this.materialPairs = [];
        for (var i = 0; i < this.materialCount; i++) {
            for (var j = 0; j < this.materialCount; j++) {
                const index = this.materialCount * j + i;

                if ((i < this.materialCount-1) && (j < this.materialPairs-1)) {
                    this.materialPairs[index] = prevPairs[index];
                } else {
                    this.materialPairs[index] = new MaterialPair(i,j);
                }
            }
        }

        return materialId;
    }

    setMaterialPairCollide(a, b, collide) {
        if ((a >= 0) && (a < this.materialCount) && 
            (b >= 0) && (b < this.materialCount)) {
            const indexBA = this.materialCount * b + a;
            const indexAB = this.materialCount * b + a;

            this.materialPairs[indexBA].collide = collide;
            this.materialPairs[indexAB].collide = collide;
        }
    }

    setMaterialPairData(a, b, friction, elasticity) {
        if ((a >= 0) && (a < this.materialCount) && 
            (b >= 0) && (b < this.materialCount)) {
            const indexBA = this.materialCount * b + a;
            const indexAB = this.materialCount * b + a;

            this.materialPairs[indexBA].friction   = friction;
            this.materialPairs[indexAB].friction   = friction;
            this.materialPairs[indexBA].elasticity = elasticity;
            this.materialPairs[indexAB].elasticity = elasticity;
        }
    }

    setMaterialPairCollisionFilter(a, b, filter) {
        if ((a >= 0) && (a < this.materialCount) && 
            (b >= 0) && (b < this.materialCount)) {
            const indexBA = this.materialCount * b + a;
            const indexAB = this.materialCount * b + a;

            this.materialPairs[indexBA].collisionFilter = filter;
            this.materialPairs[indexAB].collisionFilter = filter;
        }
    }

    addBody(body) {
        if (!this.bodyList.includes(body)) {
            this.bodyList.push(body);
        }
    }

    removeBody(body) {
        if (this.bodyList.includes(body)) {
            this.bodyList.splice(this.bodyList.findIndex((o) => o === body), 1);
        }
    }

    getBody(index) {
        return this.bodyList[index];
    }

    findClosestPointMass(position) {
        var outBody, outBodyIndex, outPoint, outPointIndex;

        var closest = Number.POSITIVE_INFINITY;
        for (var i = 0; i < this.bodyList.length; i++) {
            const body = this.bodyList[i];
            const { dist, point, pointIndex } = body.findClosestPointMass(position);

            if (dist < closest) {
                closest       = dist;
                outBody       = body;
                outBodyIndex  = i;
                outPoint      = point;
                outPointIndex = pointIndex;
            }
        }

        return {
            dist       : closest,
            body       : outBody,
            bodyIndex  : outBodyIndex,
            point      : outPoint,
            pointIndex : outPointIndex
        };
    }

    findBodyContaining(position) {
        for (var i = 0; i < this.bodyList.length; i++) {
            const body = this.bodyList[i];

            if (body.contains(position)) {
                return body;
            }
        }

        return null;
    }

    update(elapsed) {
        const len = this.bodyList.length;

        for (let i = 0; i < len; i++) {
            const body = this.bodyList[i];

            body.derivePositionAndAngle(elapsed);
            body.accumulateExternalForces();
            body.accumulateInternalForces();
        }

        for (let i = 0; i < len; i++) {
            const body = this.bodyList[i];

            body.integrate(elapsed);
        }

        for (let i = 0; i < len; i++) {
            const body = this.bodyList[i];

            body.updateAABB(elapsed, false);
            this.updateBodyBitmask(body);
        }


        for (let i = 0; i < len; i++) {
            const bodyA = this.bodyList[i];

            for (let j = i + 1; j < len; j++) {
                const bodyB = this.bodyList[j];

                if (bodyA.isStatic || bodyB.isStatic) {
                    continue;
                }

                if (!this.materialPairs[this.materialCount * bodyB.material + bodyA.material].collide) {
                    continue;
                }

                if ((bodyA.bitmaskX.mask & bodyB.bitmaskX.mask === 0) &&
                    (bodyA.bitmaskY.mask & bodyB.bitmaskY.mask === 0)) {
                    continue;
                }

                if (!bodyA.aabb.intersects(bodyB.aabb)) {
                    continue;
                }

                this.bodyCollide(bodyA, bodyB, this.collisionList);
                this.bodyCollide(bodyB, bodyA, this.collisionList);
            }
        }

        this.handleCollisions();

        for (let i = 0; i < len; i++) {
            const body = this.bodyList[i];

            body.dampenVelocity();
        }

        this.collisionList = [];
    }

    updateBodyBitmask(body) {
        var minX = Math.floor((body.aabb.min[0] - this.aabb.min[0]) / this.gridStepSizeX);
        var maxX = Math.floor((body.aabb.max[0] - this.aabb.min[0]) / this.gridStepSizeX);

        if (minX < 0) { minX = 0; } else if (minX > 32) { minX = 32; }
        if (maxX < 0) { maxX = 0; } else if (maxX > 32) { maxX = 32; }

        var minY = Math.floor((body.aabb.min[1] - this.aabb.min[1]) / this.gridStepSizeY);
        var maxY = Math.floor((body.aabb.max[1] - this.aabb.min[1]) / this.gridStepSizeY);

        if (minY < 0) { minY = 0; } else if (minY > 32) { minY = 32; }
        if (maxY < 0) { maxY = 0; } else if (maxY > 32) { maxY = 32; }

        body.bitmaskX.clear();
        for (var i = minX; i <= maxX; i++) {
            body.bitmaskX.setOn(i);
        }

        body.bitmaskY.clear();
        for (var i = minY; i <= maxY; i++) {
            body.bitmaskY.setOn(i);
        }
    }

    bodyCollide(bA, bB, infoList) {
        const bApmCount = bA.pointMassList.length;
        const bBpmCount = bB.pointMassList.length;

        var infoAway = new CollisionInfo(),
            infoSame = new CollisionInfo();

        for (let i = 0; i < bApmCount; i++) {
            const pt = bA.pointMassList[i].position;

            if (!bB.aabb.contains(pt)) {
                continue;
            }

            if (!bB.contains(pt)) {
                continue;
            }

            const prevPt = (i > 0) ? i-1 : bApmCount-1;
            const nextPt = (i < bApmCount - 1) ? i + 1 : 0;

            const prev = bA.pointMassList[prevPt].position;
            const next = bA.pointMassList[nextPt].position;

            const fromPrev = vec2.fromValues(pt[0] - prev[0], pt[1] - prev[1]);
            const toNext   = vec2.fromValues(next[0] - pt[0], next[1] - pt[1]);
            const ptNorm   = vec2.fromValues(fromPrev[0] + toNext[0], fromPrev[1] - toNext[1]);

            Utils.perpendicularVector(ptNorm, ptNorm);

            var closestAway = Number.POSITIVE_INFINITY;
            var closestSame = Number.POSITIVE_INFINITY;

            infoAway.bodyA   = bA;
            infoAway.bodyApm = i;
            infoAway.bodyB   = bB;

            infoSame.bodyA   = bA;
            infoSame.bodyApm = i;
            infoSame.bodyB   = bB;

            var b1 = 0, b2 = 1, found = false;
            for (let j = 0; j < bBpmCount; j++) {

                b1 = j;
                if (j < bBpmCount - 1) {
                    b2 = j + 1;
                } else {
                    b2 = 0;
                }

                const pt1 = bB.pointMassList[b1].position;
                const pt2 = bB.pointMassList[b2].position;

                const distToA = ((pt1[0] - pt[0]) * (pt1[0] - pt[0])) + ((pt1[1] - pt[1]) * (pt1[1] - pt[1]));
                const distToB = ((pt2[0] - pt[0]) * (pt2[0] - pt[0])) + ((pt2[1] - pt[1]) * (pt2[1] - pt[1]));

                if ((distToA > closestAway) &&
                    (distToA > closestSame) &&
                    (distToB > closestAway) &&
                    (distToB > closestSame)) {
                    continue;
                }

                const { dist, edgeD, hitPoint, normal } = bB.findClosestPointOnEdgeSquared(pt, j);
                const hitPt = hitPoint;
                const norm = normal;

                const dot = vec2.dot(ptNorm, norm);
                if (dot <= 0) {
                    if (dist < closestAway) {
                        closestAway          = dist;
                        infoAway.bodyBpmA    = b1;
                        infoAway.bodyBpmB    = b2;
                        infoAway.edgeD       = edgeD;
                        infoAway.hitPt       = hitPt;
                        infoAway.normal      = norm;
                        infoAway.penetration = dist;
                        found                = true;
                    }
                } else {
                    if (dist < closestSame) {
                        closestSame          = dist;
                        infoSame.bodyBpmA    = b1;
                        infoSame.bodyBpmB    = b2;
                        infoSame.edgeD       = edgeD;
                        infoSame.hitPt       = hitPt;
                        infoSame.normal      = norm;
                        infoSame.penetration = dist;
                    }
                }
            }

            if ((found) && (closestAway > this.penetrationThreshold) && (closestSame < closestAway)) {
                infoSame.penetration = Math.sqrt(infoSame.penetration);
                infoList.push(infoSame);
            } else {
                infoAway.penetration = Math.sqrt(infoAway.penetration);
                infoList.push(infoAway);
            }
        }
    }

    handleCollisions() {
        for (var i = 0; i < this.collisionList.length; i++) {
            const info = this.collisionList[i];

            const A  = info.bodyA.pointMassList[info.bodyApm];
            const B1 = info.bodyB.pointMassList[info.bodyBpmA];
            const B2 = info.bodyB.pointMassList[info.bodyBpmB];

            // velocity changes as a result of collision.
            const bVel = vec2.fromValues(
                (B1.velocity[0] + B2.velocity[0]) * 0.5,
                (B1.velocity[1] + B2.velocity[1]) * 0.5
            );

            const relVel = vec2.fromValues(
                A.velocity[0] - bVel[0],
                A.velocity[1] - bVel[1],
            );

            const relDot = vec2.dot(relVel, info.normal);
            const materialPair = this.materialPairs[this.materialCount * info.bodyB.material + info.bodyA.material];
            if (!materialPair.collisionFilter(info.bodyA, info.bodyApm, info.bodyB, info.bodyBpmA, info.bodyBpmB, info.hitPt, relDot)) {
                continue;
            }

            if (info.penetration > this.penetrationThreshold) {
                this.penetrationCount++;
                continue;
            }

            const b1inf = 1 - info.edgeD;
            const b2inf = info.edgeD;

            const b2MassSum = Number.isFinite(B1.mass) && Number.isFinite(B2.mass) ? B1.mass + B2.mass : Number.POSITIVE_INFINITY;
            const massSum = A.mass + b2MassSum;

            var Amove, Bmove;
            if (!Number.isFinite(A.mass)) {
                Amove = 0;
                Bmove = info.penetration + 0.001;
            } else if (!Number.isFinite(b2MassSum)) {
                Amove = info.penetration + 0.001;
                Bmove = 0;
            } else {
                Amove = info.penetration * (b2MassSum / massSum);
                Bmove = info.penetration * (A.mass / massSum);
            }

            const B1move = Bmove * b1inf;
            const B2move = Bmove * b2inf;

            const AinvMass = Number.isFinite(A.mass) ? 1 / A.mass : 0;
            const BinvMass = Number.isFinite(b2MassSum) ? 1 / b2MassSum : 0;

            const jDenom     = AinvMass + BinvMass;
            const elasticity = 1 + materialPair.elasticity;

            const numV = vec2.fromValues(
                relVel[0] * elasticity,
                relVel[1] * elasticity
            );

            const jNumerator = -vec2.dot(numV, info.normal);
            const j          = jNumerator / jDenom;

            if (Number.isFinite(A.mass)) {
                A.position[0] += info.normal[0] * Amove;
                A.position[1] += info.normal[1] * Amove;
            }

            if (Number.isFinite(B1.mass)) {
                B1.position[0] -= info.normal[0] * B1move;
                B1.position[1] -= info.normal[1] * B1move;
            }

            if (Number.isFinite(B2.mass)) {
                B2.position[0] -= info.normal[0] * B2move;
                B2.position[1] -= info.normal[1] * B2move;
            }

            const tangent    = Utils.perpendicularVector(info.normal);
            const friction   = materialPair.friction;
            const fNumerator = friction * vec2.dot(relVel, tangent, fNumerator);
            const f          = fNumerator / jDenom;

            if (relDot <= 0.0001) {
                if (Number.isFinite(A.mass)) {
                    A.velocity[0] += (info.normal[0] * (j / A.mass)) - (tangent[0] * (f / A.mass));
                    A.velocity[1] += (info.normal[1] * (j / A.mass)) - (tangent[1] * (f / A.mass));
                }

                if (Number.isFinite(b2MassSum)) {
                    B1.velocity[0] -= (info.normal[0] * (j / b2MassSum) * b1inf) - (tangent[0] * (f / b2MassSum) * b1inf);
                    B1.velocity[1] -= (info.normal[1] * (j / b2MassSum) * b1inf) - (tangent[1] * (f / b2MassSum) * b1inf);
                }

                if (Number.isFinite(b2MassSum)) {
                    B2.velocity[0] -= (info.normal[0] * (j / b2MassSum) * b2inf) - (tangent[0] * (f / b2MassSum) * b2inf);
                    B2.velocity[1] -= (info.normal[1] * (j / b2MassSum) * b2inf) - (tangent[1] * (f / b2MassSum) * b2inf);
                }
            }
        }
    }
}

export default World;
