/* 
 * Class: AABB
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

class AABB {

    constructor(
        min = vec2.create(), 
        max = vec2.create()) {

        this.min = min;
        this.max = max;
        this.isValid = true;
    }

    expandToInclude(vec) {
        if (this.isValid) {
            if (vec[0] < this.min[0]) {
                this.min[0] = vec[0];
            } else if (vec[0] > this.max[0]) {
                this.max[0] = vec[0];
            }

            if (vec[1] < this.min[1]) {
                this.min[1] = vec[1];
            } else if (vec[1] > this.max[1]) {
                this.max[1] = vec[1];
            }
        } else {
            this.min[0] = this.max[0] = vec[0];
            this.min[1] = this.max[1] = vec[1];
            this.isValid = true;
        }
    }

    clear() {
        this.min[0] = this.max[0] = this.min[1] = this.max[1] = 0;
        this.isValid = false;
    }

    contains(vec) {
        if (this.isValid) {
            if ((vec[0] < this.min[0]) || (vec[0] > this.max[0])) { return false; }
            if ((vec[1] < this.min[1]) || (vec[1] > this.max[1])) { return false; }
        } else {
            return false;
        }
        return true;
    }

    intersects(aabb) {
        const overlapX = ((this.min[0] <= aabb.max[0]) && (this.max[0] >= aabb.min[0]));
        const overlapY = ((this.min[1] <= aabb.max[1]) && (this.max[1] >= aabb.min[1]));

        return (overlapX && overlapY);
    }
}

export default AABB;
