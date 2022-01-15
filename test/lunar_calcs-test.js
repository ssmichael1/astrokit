/*
 * (c) 2021 Steven Michael (ssmichael@gmail.com)
 *
 * Verify lunar calculations
 */

// Include the "astrokit"

import * as ak from '../dist/src/index.js'
import tape from 'tape'


tape('Lunar Calculations Validation', (test) => {
    let d = new Date(Date.UTC(2022, 0, 11, 12, 0, 0))

    let p = ak.moon.phase(d)
    test.assert((p * 180.0 / Math.PI - 250.51) < 1,
        'Moon phase on Jan 11 2022 at noon UTC')

    // Example 5-4 from Vallado
    // Moon rise & set times
    // Aug 21 1998
    d = new Date(Date.UTC(2022, 0, 11))
    let coord = ak.ITRFCoord.fromGeodeticDeg(42.4154, -71.1565)
    let riseset = ak.moon.riseSet(d, coord)
    test.assert(Math.abs(riseset.rise.jd() - 2459591.216989) < 1e-4,
        'Moon rise time on Jan 11 2022')
    test.assert(Math.abs(riseset.set.jd() - 2459590.771885) < 1e-4,
        'Moon set time on Jan 11 2022')

    test.end()

})

tape('Moon position, GCRS coordinate system', (test) => {
    let date = new Date(Date.UTC(1994, 3, 28))
    let mp = ak.moon.posGCRS(date)
    test.assert(
        Math.abs(mp[0] / -134240626 - 1) < 1.0e-7 &&
        Math.abs(mp[1] / -311571590 - 1) < 1.0e-7 &&
        Math.abs(mp[2] / -126693785 - 1) < 1.0E-7,
        'Vallado example 5-3, Moon position vector'
    )
    test.end()

})

