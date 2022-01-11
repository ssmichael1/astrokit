
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
export const sind = (a) => Math.sin(a * deg2rad)

/**
 * 
 * @param {Number} a angle in degrees
 * @returns Tangent of angle
 */
export const tand = (a) => Math.tan(a * deg2rad)


/**
 * 
 * @param {Number} a angle in degrees 
 * @returns Cos of angle
 */
export const cosd = (a) => Math.cos(a * deg2rad)

/**
 * 
 * @param {Array} a 1st Vector for cross product
 * @param {Array} b 2nd vector for cross product 
 * @returns cross product of a & b
 */
export const cross = (a, b) => {
    let c = [0, 0, 0]
    c[0] = a[1] * b[2] - a[2] * b[1]
    c[1] = a[2] * b[0] - a[0] * b[2]
    c[2] = a[0] * b[1] - a[1] * b[0]
    return c
}

/**
 * Vector dot product
 * @param {Array} other Vector to dot product against
 * @returns vector dot product of this and other
 */
Array.prototype.dot = (other) => {
    return this.reduce((c, v, idx) => {
        return c + v * other[idx]
    }, 0)
}

/**
 * 
 * Vector cross product
 * 
 * @param {Array} other Vector to cross product with 
 * @returns Vector cross product of this and other (this X other)
 */
Array.prototype.cross = (other) => {
    let c = [0, 0, 0]
    c[0] = this[1] * other[2] - this[2] * other[1]
    c[1] = this[2] * other[0] - this[0] * other[2]
    c[2] = this[0] * other[1] - this[1] * other[0]
    return c
}

/**
 * 
 * @param {Array} other vector to add to this
 * @returns element-wise addition of this and other
 */
Array.prototype.eadd = (other) => {
    let c = other
    this.map((v, idx) => {
        c[idx] = v + other[idx]
    })
    return c
}

/**
 * 
 * @returns Norm squared of vector (sum of square of elements)
 */
Array.prototype.normsq = function () {
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
export const angleBetweenVectors = (v1, v2) => {
    let v1n = v1.normalize()
    let v2n = v2.normalize()
    let crossnorm = v1n.cross(v2n).norm()
    let cdot = v1n.dot(v2n).norm()
    let theta = Math.asin(crossnorm)
    if (cdot < 0) {
        theta = Math.PI - theta
    }
    return theta
}