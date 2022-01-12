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
let coord = ak.ITRFCoord.fromGeodeticDeg(22.0964, -159.5261)

// Get rise and set times
let riseset = ak.sun.riseSet(thedate, coord)
console.log(`Rise Time: ` + riseset.rise.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }))
console.log(`Set Time: ` + riseset.set.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }))

// Get civil twilight, 96 degrees from zenith to sun
riseset = ak.sun.riseSet(thedate, coord, 96)
console.log(`Morning Civil Twilight: ` + riseset.rise.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }))
console.log(`Evening Civil Twilight: ` + riseset.set.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }))

// Get nautical twilight, 102 degrees from zenith to sun
riseset = ak.sun.riseSet(thedate, coord, 102)
console.log(`Morning Nautical Twilight: ` + riseset.rise.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }))
console.log(`Evening Nautical Twilight: ` + riseset.set.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }))

// Get astronomical twilight, 108 degrees from zenith to sun
riseset = ak.sun.riseSet(thedate, coord, 108)
console.log(`Morning Astronomical Twilight: ` + riseset.rise.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }))
console.log(`Evening Astronomical Twilight: ` + riseset.set.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }))
