/*
 * (c) 2021 Steven Michael (ssmichael@gmail.com)
 *
 * Verify ITRF class
 */

// Include the "astrokit"

import { ITRFCoord } from '../src/index.js'
import tape from 'tape'

tape('ITRFCoord validation', (test) => {

    let latitude_deg = 42.0
    let longitude_deg = -71.0
    let height = 100
    let itrf = ITRFCoord.fromGeodeticDeg(latitude_deg, longitude_deg, height)
    test.assert(itrf.latitude_deg() == latitude_deg,
        'Geodetic latitude self consistency')
    test.assert(itrf.longitude_deg() == longitude_deg,
        'Geodetic longitude self consistency')
    test.assert(Math.abs(itrf.height() == height) < 1.0e-8,
        'Geodetic height self consistency')



    // Make a new coordinate on the ellipsoid and check East-North-Up conversion
    let itrf2 = ITRFCoord.fromGeodeticDeg(latitude_deg, longitude_deg, 0)
    let enu = itrf.toENU(itrf2)
    enu = enu.map(x => (x - (x % 1.0E-9)))
    test.assert(enu[0] == 0 && enu[1] == 0 && enu[2] == height,
        'ENU Conversion')
    let ned = itrf.toNED(itrf2)
    ned = ned.map(x => (x - (x % 1.0e-9)))
    test.assert(ned[0] == 0 && ned[1] == 0 && ned[2] == -height,
        'NED Conversion')

    // Example 3-3 from Vallado
    let r = [6524834, 6862875, 6448296]
    let itrf3 = new ITRFCoord(r)
    test.assert(
        Math.abs(itrf3.latitude_deg() / 34.352496 - 1) < 1.0e-6 &&
        Math.abs(itrf3.longitude_deg() / 46.4464 - 1) < 1.0e-6 &&
        Math.abs(itrf3.height() / 5085.22E3 - 1) < 1.0e-6,
        'Vallado ECEF (ITRF) to LatLon example 3-3')

    test.end()

})