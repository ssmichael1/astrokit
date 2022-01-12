/*
 * (c) 2021 Steven Michael (ssmichael@gmail.com)
 *
 * Verify moon phase class
 */

// Include the "astrokit"

import * as ak from '../src/index.js'
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
    test.assert(Math.abs(riseset.rise.jd() - 2459591.216989) < 1e-4)
    test.assert(Math.abs(riseset.set.jd() - 2459590.771885) < 1e-4)

    test.end()

})

