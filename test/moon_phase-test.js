/*
 * (c) 2021 Steven Michael (ssmichael@gmail.com)
 *
 * Verify moon phase class
 */

// Include the "astrokit"

import * as ak from '../src/index.js'
import tape from 'tape'
import { moonRiseSet } from '../src/moon_phase.js'
import { default as ITRFCoord } from '../src/itrfcoord.js'


tape('Moon Calculations Validation', (test) => {
    let d = new Date(Date.UTC(2022, 0, 11, 12, 0, 0))

    let p = ak.moonPhase(d)
    test.assert((p * 180.0 / Math.PI - 250.51) < 1,
        'Moon phase on Jan 11 2022 at noon UTC')
    test.end()

    // Example 5-4 from Vallado
    // Aug 21 1998
    d = new Date(Date.UTC(1998, 7, 21))
    let riseset = moonRiseSet(d, ITRFCoord.fromGeodetic(40 * Math.PI / 180, 0, 0))
    console.log(riseset)
})

