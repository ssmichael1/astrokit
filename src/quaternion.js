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


class Quaternion {
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

    // Quaternion multiplication, static version
    static mult(b, a) {
        return new Quaternion(
            a.raw[3] * b.raw[0] + a.raw[0] * b.raw[3] +
            a.raw[1] * b.raw[2] - a.raw[2] * b.raw[1],

            a.raw[3] * b.raw[1] - a.raw[0] * b.raw[2] +
            a.raw[1] * b.raw[3] + a.raw[2] * b.raw[0],

            a.raw[3] * b.raw[2] + a.raw[0] * b.raw[1] -
            a.raw[1] * b.raw[0] + a.raw[2] * b.raw[3],

            a.raw[3] * b.raw[3] - a.raw[0] * b.raw[0] -
            a.raw[1] * b.raw[1] - a.raw[2] * b.raw[2]
        )
    }

    // Quaternion multiplication, in place
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

    // Static wrapper function for rotation
    static rotate(q, v) {
        return q.rotate(v)
    }

    // Use this quaternion to rotate an input vector
    rotate(v) {
        let qv = new Quaternion([v[0], v[1], v[2], 0])
        let vnew = Quaternion.mult(this, Quaternion.mult(qv, this.conj()))
        return [vnew.raw[0], vnew.raw[1], vnew.raw[2]]
    }

    // Unit quaternion
    static identity() {
        return new Quaternion(0, 0, 0, 1);
    }

    // Rotation of theta degrees about X axis
    static rotx(theta) {
        let c2 = Math.cos(theta / 2.0)
        let s2 = Math.sin(theta / 2.0)
        return new Quaternion(s2, 0, 0, c2)
    }

    // Rotation of theta degrees about Y axis
    static roty(theta) {
        let c2 = Math.cos(theta / 2.0)
        let s2 = Math.sin(theta / 2.0)
        return new Quaternion(0, s2, 0, c2)
    }

    // Rotation of theta degrees about Z axis
    static rotz(theta) {
        let c2 = Math.cos(theta / 2.0)
        let s2 = Math.sin(theta / 2.0)
        return new Quaternion(0, 0, s2, c2)
    }

    // Quaternion conjugate
    conjugate() {
        return new Quaternion([-this.raw[0], -this.raw[1],
        -this.raw[2], this.raw[3]])
    }
    conj() { return this.conjugate() }

    angle() {
        let a = Math.acos(this.raw[3]) * 2.0
        return a
    }

    angle_deg() {
        return this.angle() * 180.0 / Math.PI
    }

    // norm
    norm() {
        let norm = 0
        for (let i = 0; i < 4; i++) {
            norm += this.raw[i] * this.raw[i];
        }
        return Math.sqrt(norm)
    }

    // vector norm (norm of vector elements)
    vnorm() {
        let vnorm = 0
        for (let i = 0; i < 3; i++) {
            vnorm += this.raw[i] * this.raw[i];
        }
        return Math.sqrt(vnorm)
    }

    // Normalize in place
    normalized() {
        let norm = this.norm()
        for (let i = 0; i < 4; i++) {
            this.raw[i] /= norm;
        }
    }

    // Get axis associated with quaternion
    axis() {
        let vnorm = this.vnorm()
        if (vnorm == 0)
            return [1, 0, 0]
        return [this.raw[0] / vnorm, this.raw[1] / vnorm, this.raw[2] / vnorm];
    }

    // Write out as string
    toString() {
        return `Quaternion: (Axis = [${this.axis()}], ` +
            `Angle = ${this.angle().toFixed(3)} rad)`
    }
    [inspect](depth, opts) {
        return this.toString();
    }

} // end of Quaternion class


// Code for exporting the class
if (typeof exports === 'object' && typeof module !== 'undefined')
    module.exports = Quaternion;
else if (typeof define === 'function' && define.amd) define(Quaternion);
else window.Quaternion = Quaternion;
