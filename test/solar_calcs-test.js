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

tape('Solar Noon', (test) => {
    let date = new Date(Date.UTC(2022, 2, 9, 12, 0, 0))
    let longitude = -71.1565
    let noon = ak.sun.solarNoon(date, longitude)
    test.assert((noon.getHours() == 11) && (noon.getMinutes() == 55),
        '11:55AM is solar noon on March 9 2022 in Arlington, MA USA')
    test.end()
})