/*
 * (c) 2021 Steven Michael (ssmichael@gmail.com)
 *
 * Compute maximum expected solar power for the solar panels
 * at my house in Arlington, Ma USA over the course of a 
 * day given sun position
 *
 */

import * as ak from '../dist/src/index.js'

/* Description of solar panels at my house */
let panels = {
    // Latitude and longitude of panels (Arlington, MA)
    location: {
        "latitude": 42.415,
        "longitude": -71.156
    },
    // Array describing orientation of panels
    strings: [
        {
            azimuth: 110, // Direction of panels, clockwise from north, degrees
            tilt: 30, // tilt down from horizontal, degrees
            power: 6480, // 18 360-Watt panels
            dpdt: -0.0026 // Percent drop per deg C
        },
        {
            azimuth: 110,
            tilt: 10,
            power: 720, // 2 360-Watt panels
            dpdt: -0.0026
        }
    ]
}

// Add unit normal vector definition to each panel
const zhat = [0, 0, 1]
panels.strings.forEach(function (p, i) {
    let pnorm = ak.Quaternion.mult(
        ak.Quaternion.rotz(p.azimuth * Math.PI / 180),
        ak.Quaternion.rotx(p.tilt * Math.PI / 180)).rotate(zhat)
    p.pnorm = pnorm

})

// Day over which to compute, Sept. 1 2021
let epoch = new Date(Date.UTC(2021, 8, 1))

// Get an array of times
// I will compute expected power every 15 minutes
let tmarray = [...Array(24 * 4).keys()].map((x) => new Date(epoch.getTime() + x * 15 * 60 * 1000));

// Get location as ITRF Coordinate
let loc = ak.ITRFCoord.fromGeodeticDeg(
    panels['location']['latitude'],
    panels['location']['longitude'],
    0) // assume 0 height

// Get the direction of the sun in the East-North-Up frame 
// at each time
let sunDirENU = tmarray.map(x => new ak.ITRFCoord(
    ak.qGCRS2ITRF(x).rotate( // rotation from inertial to eArth fixed fraem
        ak.sun.posMOD(new Date(x.valueOf())))) // Position of sun
    .toENU(loc) // Rotate to ENU relative to house location
    .normalize() // Normalize
)


// Define dot product
const dot = (a, b) => a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);


// Note: For simplicity & clarity we are ignoring 8-minute photon time of flight
// refraction effects in atmosphere, etc..
let powergen = []
sunDirENU.forEach((sd, i) => {
    let thispower = 0

    // Find power generated on each panel surface
    panels.strings.forEach((p, i) => {
        let pwrdot = dot(p.pnorm, sd)
        // dot product has to be positive (no back illumination) 
        // and sun must be over horizon
        // in order to generate power
        // Power generated is maximum power * dot product
        // (dot product is cosine of angle between panel normal & sun)
        if ((sd[2] > 0) && (pwrdot > 0)) {
            thispower = thispower + pwrdot * p.power
        }
    })

    // Store result
    powergen.push({
        time: tmarray[i].toLocaleString("en-us", { timeZone: 'America/New_York' }),
        power: thispower
    })

})

// Show results
console.log(powergen)
