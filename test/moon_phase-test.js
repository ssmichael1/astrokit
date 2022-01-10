/*
 * (c) 2021 Steven Michael (ssmichael@gmail.com)
 *
 * Verify moon phase class
 */

// Include the "astrokit"

import * as ak from '../src/index.js'
import tape from 'tape'


tape('Moon Calculations Validation', (test) => {
    let d = new Date(Date.UTC(2022, 0, 11, 12, 0, 0))

    let p = ak.moon.phase(d)
    test.assert((p * 180.0 / Math.PI - 250.51) < 1,
        'Moon phase on Jan 11 2022 at noon UTC')
    test.end()

    // Example 5-4 from Vallado
    // Aug 21 1998
    d = new Date(Date.UTC(2022, 0, 10))
    let coord = ak.ITRFCoord.fromGeodeticDeg(42.4154, -71.1565)
    coord = ak.ITRFCoord.fromGeodeticDeg(-31.9523, 115.8613)
    let riseset = ak.moon.riseSet(d, coord)
    console.log(riseset)

    let r2 = ak.moon.riseSet2(d, coord)
    console.log(r2)
})

