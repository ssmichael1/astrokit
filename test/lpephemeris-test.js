/*
 * (c) 2021 Steven Michael (ssmichael@gmail.com)
 *
 * Verify low-precision ephemerides
 *
 */

import * as ak from '../dist/src/index.js'

import tape from 'tape'


tape('Heliocentric position of jupiter', (test) => {
    let date = new Date(Date.UTC(1994, 4, 20, 20, 0, 0))
    let jp = ak.bodyPosHelio(ak.SolarSystemBodies.Jupiter, date)

    // Note: Vallado uses a more exact expression, hence
    // large allowable error in this 
    test.assert(
        Math.abs(jp[0] / -609750815000 - 1) < 1.0e-2 &&
        Math.abs(jp[1] / -497437968000 - 1) < 1.0e-2 &&
        Math.abs(jp[2] / -198394488000 - 1) < 1.0e-2,
        'Vallado example 5-5, Heliocentric position of Jupiter'
    )

    test.end()
})