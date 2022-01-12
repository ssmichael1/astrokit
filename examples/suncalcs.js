/*
 * (c) 2021 Steven Michael (ssmichael@gmail.com)
 *
 * Compute sunrise/sunset, and civil, nautical, and astronomical twilight
 */

import * as ak from '../src/index.js'

// Get today's date
let now = new Date()
let thedate = new Date(now.getFullYear(), now.getMonth(), now.getDate())

// Get location
// Kauai, Hi is a nice place:
let groundpos = ak.ITRFCoord.fromGeodeticDeg(22.0964, -159.5261)
console.log('Ground site:\n${groundpos}\n')

// Get rise and set times
let riseset = ak.sun.riseSet(thedate, groundpos)
console.log(`Rise Time: ` + riseset.rise.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }))
console.log(`Set Time: ` + riseset.set.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }))

// Get civil twilight, 96 degrees from zenith to sun
riseset = ak.sun.riseSet(thedate, groundpos, 96)
console.log(`Morning Civil Twilight: ` + riseset.rise.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }))
console.log(`Evening Civil Twilight: ` + riseset.set.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }))

// Get nautical twilight, 102 degrees from zenith to sun
riseset = ak.sun.riseSet(thedate, groundpos, 102)
console.log(`Morning Nautical Twilight: ` + riseset.rise.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }))
console.log(`Evening Nautical Twilight: ` + riseset.set.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }))

// Get astronomical twilight, 108 degrees from zenith to sun
riseset = ak.sun.riseSet(thedate, groundpos, 108)
console.log(`Morning Astronomical Twilight: ` + riseset.rise.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }))
console.log(`Evening Astronomical Twilight: ` + riseset.set.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }))

// Get geodetic sun position
let sunpos = new ak.ITRFCoord(ak.qGCRS2ITRF(now).rotate(ak.sun.posMOD(now)))
// Convert to east-north-up coordinates relative to ground location
let enu = sunpos.toENU(groundpos)
let rad2deg = 180.0 / Math.PI
let elevation = Math.asin(enu[2] / enu.norm()) * rad2deg
let heading = Math.atan2(enu[0], enu[1]) * rad2deg
console.log(`Current sun elevation: ${elevation} deg`)
console.log(`Current sun heading: ${heading} deg`)
