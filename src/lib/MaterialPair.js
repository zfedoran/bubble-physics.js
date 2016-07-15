/* 
 * Class: MaterialPair
 */

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// External Dependencies
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// Internal Dependencies
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// Class Definition
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

class MaterialPair {
    constructor(
        materialIdA,
        materialIdB,
        friction        = 0.3,
        elasticity      = 0.8,
        collide         = true,
        collisionFilter = () => true,
    ) {
        this.materialIdA     = materialIdA;
        this.materialIdB     = materialIdB;
        this.friction        = friction;
        this.elasticity      = elasticity;
        this.collide         = collide;
        this.collisionFilter = collisionFilter;
    }
}


export default MaterialPair;
