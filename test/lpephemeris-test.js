/*
 * (c) 2021 Steven Michael (ssmichael@gmail.com)
 *
 * Verify low-precision ephemerides
 *
 */

import * as ak from '../src/index.js'

import tape from 'tape'

tape('Sun position, Mean-Of-Date (MOD) coordinate system', (test) => {

    // Example 5-1 from Vallado
    let date = new Date(Date.UTC(2006, 3, 2))
    let sp = ak.sunPosMOD(date)
    test.assert(
        Math.abs(sp[0] / 146186212000 - 1) < 1.0e-7 &&
        Math.abs(sp[1] / 28788976000 - 1) < 1.0e-7 &&
        Math.abs(sp[2] / 12481064000 - 1) < 1.0e-7,
        'Vallado example 5-1, Mean-of-Date Sun Position'
    )
    test.end()

})

tape('Moon position, GCRS coordinate system', (test) => {
    let date = new Date(Date.UTC(1994, 3, 28))
    let mp = ak.moonPosGCRS(date)
    test.assert(
        Math.abs(mp[0] / -134240626 - 1) < 1.0e-7 &&
        Math.abs(mp[1] / -311571590 - 1) < 1.0e-7 &&
        Math.abs(mp[2] / -126693785 - 1) < 1.0E-7,
        'Vallado example 5-3, Moon position vector'
    )
    test.end()

})

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