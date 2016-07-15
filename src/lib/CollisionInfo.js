/* 
 * Class: CollisionInfo
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

class CollisionInfo {
    constructor(
        bodyA,
        bodyB,
        bodyApm     = -1,
        bodyBpmA    = -1,
        bodyBpmB    = -1,
        edgeD       = 0,
        penetration = 0,
        hitPt       = vec2.create(),
        normal      = vec2.create()
    ) {
        this.bodyA       = bodyA;
        this.bodyB       = bodyB;
        this.bodyApm     = bodyApm;
        this.bodyBpmA    = bodyBpmA;
        this.bodyBpmB    = bodyBpmB;
        this.edgeD       = edgeD;
        this.penetration = penetration;
        this.hitPt       = hitPt;
        this.normal      = normal;
    }
}


export default CollisionInfo;
