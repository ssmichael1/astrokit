/*
 * (c) 2021 Steven Michael (ssmichael@gmail.com)
 *
 * Quaternion is a JavaScript library for representing rotations of 
 * 3D vectors via quaternions.
 *
 * Intro: Quaternions are a more efficient way than the 
 * traditional direction cosine matrix to represent rotations 
 * in 3D space. 
 * For an intro to quaternions, see:
 * https://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation
 * 
 * Note: this uses the satellite dynamics conventions for 
 * quaternions, where rotations are a right-handed rotation of 
 * the coordinate system (left-handed rotation of vector), and 
 * subsequent rotations multiply on the left
 * 
 * There seems to be a lack of consensus on the nomenclature
 * one should use for quaternions.  Most mathemeticians use a
 * different nomenclature, most control people use this one.
 * 
 * I have no stake in the fight, I just picked one.
 *  
 * For a reference, see:
 * http://malcolmdshuster.com/Pub_1993h_J_Repsurv_scan.pdf
 * 
 */


if (inspect == undefined)
    var inspect = Symbol.for('nodejs.util.inspect.custom');


export default class Quaternion {
    constructor(x, y, z, w) {
        // No arguments, return unit quaternion
        if (x == undefined) {
            this.raw = [0, 0, 0, 1]
            return this
        }
        // Input is 4-element array
        if (y == undefined) {
            this.raw = x
            return this
        }
        this.raw = [x, y, z, w]
    }

    /**
     * Static version of quaternion multiplication
     *
     * @param {Quaternion} a
     * @param {Quaternion} b 
     * @returns {Quaternion} a * b
     */
    static mult(a, b) {
        return new Quaternion(
            b.raw[3] * a.raw[0] + b.raw[0] * a.raw[3] +
            b.raw[1] * a.raw[2] - b.raw[2] * a.raw[1],

            b.raw[3] * a.raw[1] - b.raw[0] * a.raw[2] +
            b.raw[1] * a.raw[3] + b.raw[2] * a.raw[0],

            b.raw[3] * a.raw[2] + b.raw[0] * a.raw[1] -
            b.raw[1] * a.raw[0] + b.raw[2] * a.raw[3],

            b.raw[3] * a.raw[3] - b.raw[0] * a.raw[0] -
            b.raw[1] * a.raw[1] - b.raw[2] * a.raw[2]
        )
    }

    /**
     * 
     * Quaternion in-place multiplication
     * Input multiplies on the right
     * 
     * @param {Quaternion} a 
     */
    mult(a) {
        this.raw =
            [a.raw[3] * this.raw[0] + a.raw[0] * this.raw[3] +
                a.raw[1] * this.raw[2] - a.raw[2] * this.raw[1],

            a.raw[3] * this.raw[1] - a.raw[0] * this.raw[2] +
            a.raw[1] * this.raw[3] + a.raw[2] * this.raw[0],

            a.raw[3] * this.raw[2] + a.raw[0] * this.raw[1] -
            a.raw[1] * this.raw[0] + a.raw[2] * this.raw[3],

            a.raw[3] * this.raw[3] - a.raw[0] * this.raw[0] -
            a.raw[1] * this.raw[1] - a.raw[2] * this.raw[2]
            ]
    }

    /**
     * 
     * Static convenience function for Quaternion
     * rotation of a vector
     * 
     * @param {Quaternion} q 
     * @param {Array length=3} v 
     * @returns {Array length=3} rotated vector
     */
    static rotate(q, v) {
        return q.rotate(v)
    }

    /**
     * Quaternion rotation of input vector
     * 
     * @param {Array length=3} v 
     * @returns {Array length=3} rotated vector
     */
    rotate(v) {
        let qv = new Quaternion([v[0], v[1], v[2], 0])
        let vnew = Quaternion.mult(this, Quaternion.mult(qv, this.conj()))
        return [vnew.raw[0], vnew.raw[1], vnew.raw[2]]
    }

    /**
     * 
     * @returns {Quaternion} unit quaternion
     */
    static identity() {
        return new Quaternion(0, 0, 0, 1);
    }

    /**
     * 
     * Quaternion representing rotation about x axis
     * by theta radians
     * 
     * @param {Number} theta Angle to rotate, in radians
     * @returns {Quaternion}
     */
    static rotx(theta) {
        let c2 = Math.cos(theta / 2.0)
        let s2 = Math.sin(theta / 2.0)
        return new Quaternion(s2, 0, 0, c2)
    }

    /**
     * 
     * Quaternion representing rotation about y axis
     * by theta radians
     * 
     * @param {Number} theta Angle to rotate, in radians
     * @returns {Quaternion}
     */
    static roty(theta) {
        let c2 = Math.cos(theta / 2.0)
        let s2 = Math.sin(theta / 2.0)
        return new Quaternion(0, s2, 0, c2)
    }

    /**
     *
     * Quaternion representing rotation about z axis
     * by theta radians
     *
     * @param {Number} theta Angle to rotate, in radians
     * @returns {Quaternion}
     */
    static rotz(theta) {
        let c2 = Math.cos(theta / 2.0)
        let s2 = Math.sin(theta / 2.0)
        return new Quaternion(0, 0, s2, c2)
    }

    /**
     * 
     * @returns {Quaternion} Conjugate of quaternion
     */
    conjugate() {
        return new Quaternion([-this.raw[0], -this.raw[1],
        -this.raw[2], this.raw[3]])
    }
    /**
     * 
     * @returns {Quaternion} Conjugate of quaternion
     */
    conj() { return this.conjugate() }


    /**
     * 
     * @returns {Number} Angle of rotation of quaternion, radians
     */
    angle() {
        let a = Math.acos(this.raw[3]) * 2.0
        return a
    }

    /**
     * 
     * @returns {Number} Angle of rotation of quaternion, degerees
     */
    angle_deg() {
        return this.angle() * 180.0 / Math.PI
    }

    /**
     * 
     * @returns {Number} Norm of quaternion
     */
    norm() {
        let norm = 0
        for (let i = 0; i < 4; i++) {
            norm += this.raw[i] * this.raw[i];
        }
        return Math.sqrt(norm)
    }

    /**
     * 
     * @returns {Number} Norm of vector elements of quaternion
     */
    vnorm() {
        let vnorm = 0
        for (let i = 0; i < 3; i++) {
            vnorm += this.raw[i] * this.raw[i];
        }
        return Math.sqrt(vnorm)
    }

    /**
     * Normalize the quaternion in place
     */
    normalized() {
        let norm = this.norm()
        for (let i = 0; i < 4; i++) {
            this.raw[i] /= norm;
        }
    }

    /**
     * 
     * @returns {Array length=3} Axis of rotation of quaternion
     */
    axis() {
        let vnorm = this.vnorm()
        if (vnorm == 0)
            return [1, 0, 0]
        return [this.raw[0] / vnorm, this.raw[1] / vnorm, this.raw[2] / vnorm];
    }

    /**
     * 
     * @returns {String} string representation of quaternion
     */
    toString() {
        return `Quaternion: (Axis = [${this.axis()}], ` +
            `Angle = ${this.angle().toFixed(3)} rad)`
    }
    [inspect]() {
        return this.toString();
    }

} // end of Quaternion class

