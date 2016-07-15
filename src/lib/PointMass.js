/* 
 * Class: PointMass
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

class PointMass {

    constructor(
        mass     = 1,
        position = vec2.create(),
        velocity = vec2.create(),
        force    = vec2.create(),
    ) {
        this.mass     = mass;
        this.position = position;
        this.velocity = velocity;
        this.force    = force;
    }

    integrate(elapsed) {
        const k = elapsed / this.mass;

        if (this.mass !== 0) {

            this.velocity[0] += this.force[0] * k;
            this.velocity[1] += this.force[1] * k;

            this.position[0] += this.velocity[0] * k;
            this.position[1] += this.velocity[1] * k;

            this.force[0] = 0;
            this.force[1] = 0;
        }
    }

}

export default PointMass;
