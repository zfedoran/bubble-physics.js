/* 
 * Class: Bitmask
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

class Bitmask {

    constructor() {
        this.mask = 0x00;
    }

    clear() {
        this.mask = 0x00;
    }

    setOn(bit) {
        this.mask |= (0x01 << ((bit > 0) ? (bit - 1) : 0));
    }

    setOff(bit) {
        this.mask &= ~(0x01 << ((bit > 0) ? (bit - 1) : 0));
    }

}

export default Bitmask;
