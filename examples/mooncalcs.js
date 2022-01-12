/*
 * (c) 2021 Steven Michael (ssmichael@gmail.com)
 *
 * Compute moon rise and set times, phase, etc...
 */

import * as ak from '../src/index.js'

// Get today's date
let now = new Date()
let thedate = new Date(now.getFullYear(), now.getMonth(), now.getDate())

// Get location
// Kauai, Hi is a nice place:
let groundpos = ak.ITRFCoord.fromGeodeticDeg(22.0964, -159.5261)

// Get moon rise and set times
let riseset = ak.moon.riseSet(thedate, groundpos)
console.log(`At location\n${groundpos}\n`)
console.log(`Moon Rise Time: ` + riseset.rise.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }))
console.log(`Moon Set Time: ` + riseset.set.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }))

// Get current moon elevation and heading
let moonPos = new ak.ITRFCoord(ak.qGCRS2ITRF(now).rotate(ak.moon.posGCRS(now)))
// Get east-north-up location relative to coordinate above (Kauai, HI)
const rad2deg = 180.0 / Math.PI
let enu = moonPos.toENU(groundpos)
let elevation = Math.asin(enu[2] / enu.norm()) * rad2deg
let heading = Math.atan2(enu[0], enu[1]) * rad2deg
console.log(`Moon elevation: ${elevation.toFixed(2)} deg`)
console.log(`Moon heading: ${heading.toFixed(2)} deg`)
console.log(`Moon Range: ${(enu.norm() * 1.0e-3).toFixed(0)} km`)

let moonphase = ak.moon.phase(now) * rad2deg
if (moonphase < 0)
    moonphase += 360
console.log(`Moon phase: ${moonphase.toFixed(1)} deg`)
let fracillum = ak.moon.fractionIlluminated(now)
console.log(`Fraction of moon illuminated: ${(fracillum * 100).toFixed(2)}%`)



let prevday = new Date(now.getTime() - 86400 * 1000)
// Moon phase yesterday
let phaseprev = ak.moon.phase(prevday) * rad2deg
if (phaseprev < 0)
    phaseprev += 360
// Fraction illuminated yesterday
let fracillumprev = ak.moon.fractionIlluminated(prevday)

// This logic isn't fully vetted...
let phasename = ''
if ((moonphase >= 180) && (phaseprev < 180)) {
    phasename = 'Full Moon'
}
else if ((moonphase < 80) && (phaseprev > 300)) {
    phasename = 'New Moon'
}
else {
    let name1 = 'Waning'
    let name2 = 'Gibbous'
    if (fracillum < 0.5)
        name2 = 'Crecent'
    if (fracillum > fracillumprev)
        name1 = 'Waxing'

    phasename = name1 + ' ' + name2
}

console.log(phasename)