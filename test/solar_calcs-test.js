/*
 * (c) 2022 Steven Michael (ssmichael@gmail.com)
 *
 * Verify solar calculations
 */

// Include the "astrokit"

import * as ak from '../dist/src/index.js'
import tape from 'tape'


tape('Sun position, Mean-Of-Date (MOD) coordinate system', (test) => {

    // Example 5-1 from Vallado
    let date = new Date(Date.UTC(2006, 3, 2))
    let sp = ak.sun.posMOD(date)
    test.assert(
        Math.abs(sp[0] / 146186212000 - 1) < 1.0e-7 &&
        Math.abs(sp[1] / 28788976000 - 1) < 1.0e-7 &&
        Math.abs(sp[2] / 12481064000 - 1) < 1.0e-7,
        'Vallado example 5-1, Mean-of-Date Sun Position'
    )
    test.end()

})