// Import the astrokit
const ak = require('../')

// A recent (9/24/2021) TLE for the international space station
// as downloaded from www.space-track.org
tle_lines = [
    '0 ISS(ZARYA)',
    '1 25544U 98067A   21267.21567994  .00001839  00000-0  42318-4 0  9994',
    '2 25544  51.6435 213.0833 0003460  47.4035  50.6925 15.48430119303944',
]

// Load the TLE into javascript class
let iss = new ak.TLE(tle_lines)

// How long does the ISS take to go around the earth once?
// (in Earth-rotating frame)
// the Mean Motion is revolutions per day
// We will get ground track for a single revolution
// Also, subtract off rate of Earth
// Angle rate in radians / second
let rate = Math.PI * 2 / 86400 * iss.mean_motion - ak.univ.OmegaEarth
// Duration is in seconds (86400 seconds / day)
let duration = 2 * Math.PI / rate

// get ground track point every 10 seconds
let dt = 10
// Array of times for which to compute positions
const times = [...Array(Math.floor(duration / dt)).keys()]
    .map(x => new Date(iss.epoch.getTime() + x * dt * 1000))



let iss_groundtrack = times.map((t) => {
    // Get the position and velocity in the TEME coordinate frame
    // by running "sgp4" orbit propagator with iss TLE and
    // desired time as input
    rv = ak.sgp4(iss, t)

    // Get quaternion to rotate from TEME frame to ITRF frame
    // (ITRF = international terrestrial reference frame)
    // and turn it into a coordinate class
    itrf = new ak.ITRFCoord(ak.qTEME2ITRF(t).rotate(rv.r))

    // Use the coordinate class (which is cartesian ITRF natively)
    // to extract geodetic latitude, longitude, and height
    return {
        time: t,
        latitude_deg: itrf.latitude_deg(),
        longitude_deg: itrf.longitude_deg(),
        height_meters: itrf.height()
    }
})
console.log(iss_groundtrack)


