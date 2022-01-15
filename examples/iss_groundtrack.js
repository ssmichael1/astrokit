/**
 * (c) 2021 Steven Michael (ssmichael@gmail.com)
 * 
 * This example computes the ground track in latitude and longitude
 * of the International Space Station over a single orbit
 * 
 * It makes use of:
 *      * SGP4 propagator to compute position in inertial space
 *      * Quaternion to rotate from inertial to Earth-fixed coordinates
 *      * ITRFCoord to extract latitude & longitude
 */

// Import the astrokit
import * as ak from '../dist/src/index.js'

// A recent (9/24/2021) TLE for the international space station
// as downloaded from www.space-track.org
const tle_lines = [
    '0 ISS(ZARYA)',
    '1 25544U 98067A   21267.21567994  .00001839  00000-0  42318-4 0  9994',
    '2 25544  51.6435 213.0833 0003460  47.4035  50.6925 15.48430119303944',
]

// Load the TLE into javascript class
// Note: this will automatically detect if the first line with name 
//       identifier is omitted
let iss = new ak.TLE(tle_lines)

// Duration of time over which to compute ground track
// Equal to 1 revolution (mean motion is revs / day)
let rate = Math.PI * 2 / 86400 * iss.mean_motion
// Duration is in seconds (86400 seconds / day)
let duration = 2 * Math.PI / rate

// Create array of times for which to compute positions
// In this case, the start time is the "epoch" for the TLE
// and the times are every 10 seconds over a single orbit
let dt = 10
const times = [...Array(Math.floor(duration / dt)).keys()]
    .map(x => new Date(iss.epoch.getTime() + x * dt * 1000))

// Get the ground position for each time
let iss_groundtrack = times.map((t) => {
    // Get the position and velocity in the TEME coordinate frame
    // by running "sgp4" orbit propagator with iss TLE and
    // desired time as input
    let rv = ak.sgp4(iss, t)

    // Get quaternion to rotate from TEME frame to ITRF frame
    // TEME = Earth-centered pseudo-inertial frame in which sgp4
    //        computes the positions and velocities
    // ITRF = international terrestrial reference frame
    // and turn it into a coordinate class
    let itrf = new ak.ITRFCoord(ak.qTEME2ITRF(t).rotate(rv.r))

    // Use the coordinate class (which is cartesian ITRF natively)
    // to extract geodetic latitude, longitude, and height
    return {
        time: t,
        latitude_deg: itrf.latitude_deg(),
        longitude_deg: itrf.longitude_deg(),
        height_meters: itrf.height()
    }

})
// print output to screen
console.log(iss_groundtrack)
