/*
 * (c) 2021 Steven Michael (ssmichael@gmail.com)
 *
 * Verify moon phase class
 */

// Include the "astrokit"

import * as ak from '../src/index.js'
import tape from 'tape'


tape('Moon Phase Validation', (test) => {
    let d = new Date(Date.UTC(2022, 0, 11, 12, 0, 0))

    let p = ak.moon.phase(d)
    test.assert((p * 180.0 / Math.PI - 250.51) < 1,
        'Moon phase on Jan 11 2022 at noon UTC')
    test.end()
})

tape('Moon Rise / Set Validation', (test) => {
    // Example 5-4 from Vallado
    // Aug 21 1998
    let d = new Date('Jan 2 2022')
    console.log(d.toString())
    let coord = ak.ITRFCoord.fromGeodeticDeg(42.4154, -71.1565)
    coord = ak.ITRFCoord.fromGeodeticDeg(-31.9523, 115.8613)
    let riseset = ak.moon.riseSet(d, coord)
    console.log(riseset)

    let r2 = ak.moon.riseSet2(d, coord)
    console.log(r2)

    let now = new Date(Date.now())
    let mp = ak.moonPosGCRS(now)
    let mitrf = new ak.ITRFCoord(ak.qGCRS2ITRF(now).rotate(mp))
    console.log(`moon latitude = ${mitrf.latitude_deg()}`)
    console.log(`moon longitude = ${mitrf.longitude_deg()}`)
    console.log(mitrf.height())
    let dec = Math.asin(mp[2] / mp.norm()) * 180.0 / Math.PI
    let adec = Math.abs(dec)

    console.log(`declination = ${Math.floor(adec)} deg, ${Math.floor((adec % 1.0) * 60)}`)
    console.log(`ra = ${Math.atan2(mp[1], mp[0]) * 180.0 / Math.PI}`)
    test.end()
})

