/*
 * (c) 2021 Steven Michael (ssmichael@gmail.com)
 *
 * Verify quaternion rotations
 *
 */

// Include the "astrokit"
import { Quaternion } from '../src/index.js'


import tape from 'tape'

tape('Quaternion rotation z axis', (test) => {
    let xhat = [1, 0, 0]
    let r = Quaternion.rotz(Math.PI / 2).rotate(xhat)

    // Remove any discretization issues
    r = r.map(x => (x - (x % 1.0E-12)))

    // Rotation pi/2 about z moves xhat to -yhat
    test.assert(r[0] == 0 && r[1] == -1 && r[2] == 0)
    test.end()
})

tape('Quaternion rotation x axis', (test) => {
    let zhat = [0, 0, 1]
    let r = Quaternion.rotx(Math.PI / 2).rotate(zhat)

    // Remove any discretization issues
    r = r.map(x => (x - (x % 1.0E-12)))
    // Rotation pi/2 about x moves zhat to yhat
    test.assert(r[0] == 0 && r[1] == 1 && r[2] == 0)
    test.end()
})


tape('Quaternion rotation y axis', (test) => {
    let zhat = [0, 0, 1]
    let r = Quaternion.roty(Math.PI / 2).rotate(zhat)

    // Remove any discretization issues
    r = r.map(x => (x - (x % 1.0E-12)))
    // Rotation pi/2 about y moves zhat to -xhat
    test.assert(r[0] == -1 && r[1] == 0 && r[2] == 0)
    test.end()
})

tape('Quaternion to Axis Angle', (test) => {
    let q = Quaternion.rotz(Math.PI / 3)
    let axis = q.axis()
    test.assert(axis[0] == 0 && axis[1] == 0 && axis[2] == 1)
    let angle = q.angle()
    test.assert(angle = Math.PI / 3)
    test.end()
})
