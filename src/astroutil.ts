import { Vec3 } from 'quaternion'

declare global {
    interface Array<T> {
        norm: () => number;
        normsq: () => number;
        normalize: () => Array<T>;
    }
}


/**
 * Degree to radian conversion
 */
export const deg2rad = Math.PI / 180.

/**
 * Radian to degree conversion
 */
export const rad2deg = 180.0 / Math.PI

/**
 * 
 * @param {Number} a angle in degrees 
 * @returns Sin of angle
 */
export const sind = (a: number): number => Math.sin(a * deg2rad)

/**
 * 
 * @param {Number} a angle in degrees
 * @returns Tangent of angle
 */
export const tand = (a: number): number => Math.tan(a * deg2rad)


/**
 * 
 * @param {Number} a angle in degrees 
 * @returns Cos of angle
 */
export const cosd = (a: number): number => Math.cos(a * deg2rad)

/**
 * 
 * @param {Array} a 1st Vector for cross product
 * @param {Array} b 2nd vector for cross product 
 * @returns cross product of a & b
 */
export const cross = (a: Vec3, b: Vec3): Vec3 => {
    let c: Vec3 = [0, 0, 0]
    c[0] = a[1] * b[2] - a[2] * b[1]
    c[1] = a[2] * b[0] - a[0] * b[2]
    c[2] = a[0] * b[1] - a[1] * b[0]
    return c
}

/**
 * 
 * @param v1 vector 1
 * @param v2 vector 2
 * @returns vector dot product
 */
export const dot = (v1: Array<number>, v2: Array<number>): number => {
    return v1.reduce((c, v, idx) => { return c + v * v2[idx] }, 0)
}

/**
 * 
 * @param v1 vector 1
 * @param v2 vector 2
 * @returns vector with element-wise addition of 2 vectors
 */
export const eadd = (v1: Array<number>, v2: Array<number>): Array<number> => {
    return v1.map((v, idx) => v + v2[idx])
}


/**
 * 
 * @returns Norm squared of vector (sum of square of elements)
 */
Array.prototype.normsq = function (): number {
    return this.reduce((c, v) => {
        return c + v * v
    }, 0)
}

/**
 * 
 * @returns Vector norm of array
 */
Array.prototype.norm = function () {
    return Math.sqrt(this.normsq())
}

/**
 * 
 * @returns Normalized version of array
 */
Array.prototype.normalize = function () {
    let n = this.norm()
    return this.map((v) => {
        return v / n
    })
}

/**
 * 
 * @param {Array} v1 Vector 1, a 3-element vector
 * @param {Array} v2 Vector 2, a 3-element vector
 * @returns Angle in radians between v1 and v2
 */
export const angleBetweenVectors = (v1: Vec3, v2: Vec3) => {
    let normprod = v1.norm() * v2.norm()
    let crossnorm = cross(v1, v2).norm() / normprod
    let cdot = dot(v1, v2) / normprod
    let theta = Math.asin(crossnorm)
    if (cdot < 0) {
        theta = Math.PI - theta
    }
    return theta
}