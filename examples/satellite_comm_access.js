/*
 * (c) 2021 Steven Michael (ssmichael@gmail.com)
 *
 * This example computes ground station access times for a
 * satellite.
 * 
 * In this example, the satellite is the TROPICS pathfinder
 * mission (a cubesat doing passive microwave radiometry),
 * and the ground station is the KSAT RF dish at 
 * Svalbard, Norway
 */

// Import the astrokit
const ak = require('../')

// Compute access every second over the course of a day
// start by creating a list of times
const startTime = new Date(Date.UTC(2021, 8, 27))
const duration = 86400
// Array of times for which to compute positions
const times = [...Array(duration).keys()]
    .map(x => new Date(startTime.getTime() + x * 1000))

// The minimum elevation at which the ground station
// can operate
const minimum_elevation_deg = 5

// TLE lines, as downloaded from www.space-track.org, 9/27/21
tle_lines = [
    '0 TROPICS PATHFINDER',
    '1 48901U 21059Y   21269.59036393  .00002417  00000-0  14264-3 0  9991',
    '2 48901  97.5173  36.9545 0009071 297.1346  62.8960 15.12453017 14024'
]

const groundstation = {
    Name: 'Svalbard',
    latitude: 79.004959,
    longitude: 17.666016,
    height: 1700
}

let groundstation_coord =
    ak.ITRFCoord.fromGeodeticDeg(groundstation.latitude, groundstation.longitude, groundstation.height)

console.log(groundstation_coord)

// Initialize array for holding ground station access info
let access = []

// Create two-line element set object
let tle = new ak.TLE(tle_lines)

// For tracking if we are in a contact
let current_contact = null

// Iterate through times
times.forEach((t) => {

    // Compute location of satellite at time t
    rv = ak.sgp4(tle, t)

    // Rotation from TEME (inertial) to Earth-fixed frame
    // and convert to ITRFCoord object
    const q = ak.qTEME2ITRF(t)
    let itrf = new ak.ITRFCoord(ak.qTEME2ITRF(t).rotate(rv.r))

    // Convert to East-North-Up position relative to ground station
    let enu = itrf.toENU(groundstation_coord)

    // Compute range to satellite from ground station
    let range = Math.sqrt(enu[0] * enu[0] + enu[1] * enu[1] + enu[2] * enu[2])
    // Compute elevation angle in degrees
    let elevation = Math.asin(enu[2] / range) * 180.0 / Math.PI

    // Can the ground station see the satellite?
    if (elevation > minimum_elevation_deg) {
        // Start a contact if not in one
        if (current_contact === null) {
            current_contact = {}
            current_contact.start_time = t
            current_contact.min_range = range
            current_contact.max_range = range
            current_contact.max_elevation_deg = elevation
        }
        // Track variables in contact
        else {
            if (current_contact.min_range > range) {
                current_contact.min_range = range
            }
            if (current_contact.max_range < range) {
                current_contact.max_range = range
            }
            if (current_contact.max_elevation_deg < elevation) {
                current_contact.max_elevation_deg = elevation
            }
        }
    }
    else {
        // Check for end of contact
        if (current_contact !== null) {
            current_contact.stop_time = t
            current_contact.duration_seconds =
                (t.getTime() - current_contact.start_time.getTime()) / 1000
            access.push(current_contact)
            current_contact = null
        }
    }
})

// All done; log output
console.log(access)