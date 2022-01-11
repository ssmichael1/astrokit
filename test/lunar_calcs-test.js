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
    test.end()

    // Example 5-4 from Vallado
    // Aug 21 1998
    d = new Date(Date.UTC(2022, 0, 11))
    let coord = ak.ITRFCoord.fromGeodeticDeg(42.4154, -71.1565)
    let riseset = ak.moon.riseSet(d, coord)
    console.log(riseset)

    let r2 = ak.moon.riseSet2(d, coord)
    console.log(r2)

    let now = new Date(Date.now())
    let mp = ak.moonPosGCRS(now)
    let ra = Math.atan2(mp[1], mp[0]) * 180.0 / Math.PI
    let decl = Math.asin(mp[2] / mp.norm()) * 180.0 / Math.PI
    console.log(`Moon Right Ascension = ${ra * 24 / 360} hours`)
    console.log(`Moon Declination = ${decl}`)
    let moonITRF = new ak.ITRFCoord(
        ak.qGCRS2ITRF(now)
            .rotate(ak.moonPosGCRS(now)))
    console.log(`moon latitude = ${moonITRF.latitude_deg()}`)
    console.log(`moon longitude = ${moonITRF.longitude_deg()}`)
    console.log(`reference latitude = ${coord.latitude_deg()}`)
    console.log(`reference longitude = ${coord.longitude_deg()}`)
    console.log(`reference altitude = ${coord.height()}`)

    let ned = moonITRF.toNED(coord)
    let elevation = -Math.asin(ned[2] / ned.norm()) * 180.0 / Math.PI
    let azimuth = Math.atan2(ned[0], ned[1]) * 180.0 / Math.PI
    console.log(`elevation = ${elevation} deg`)
    console.log(`azimuth = ${azimuth} deg`)

})

