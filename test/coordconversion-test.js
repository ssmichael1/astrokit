/*
 * (c) 2021 Steven Michael (ssmichael@gmail.com)
 *
 * Verify coordinate rotations
 *
 */

import * as ak from '../dist/src/index.js'

import tape from 'tape'

tape('Greenwich Mean Sidereal Time', (test) => {


    // Example 3-5 from Vallado
    let date = new Date(Date.UTC(1992, 7, 20, 12, 14))
    let gmst_ = ak.gmst(date.jd('UTC'))
    console.log(gmst_ * ak.rad2deg)
    test.assert(Math.abs(gmst_ * 180.0 / Math.PI / 152.578787810 - 1) < 1.0e-6,
        'Vallado example 3-5, finding gmst')

    test.end()
})

tape('GCRS to ITRF Rotation', (test) => {

    // Example 3-15 from Vallado; we are not doing 
    // full reduction, so this is approximate
    let itrf = [-1033479.383, 7901295.2754, 6380356.5958]
    let date = new Date(Date.UTC(2004, 3, 6, 7, 51, 28, 386.009))
    console.log(date)

    let gcrs = ak.qGCRS2ITRF(date).conj().rotate(itrf)
    test.assert(
        Math.abs(gcrs[0] / 5102508.958 - 1) < 1.0e-4 &&
        Math.abs(gcrs[1] / 6123011.52 - 1) < 1.0e-4 &&
        Math.abs(gcrs[2] / 6378136.928 - 1) < 1.0e-4,
        'Vallado example 3-15, ITRF to GCRS rotation')

    test.end()
})
