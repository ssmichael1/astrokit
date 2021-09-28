# **Astronomy Toolkit**

## **Introduction**

The Astronomy Toolkit is a javascript module for handling a few simple satellite and astronomy tasks, including:

* Propagation of two-line element sets representing satellite ephemerides via native JavaScript translation of Vallado SGP4 propagator
* Planetary ephemerides (low precision from NASA JPL)
* Sun & Moon ephmemerides
* Coordinate conversions between Earth-fixed and inertial space
* Class for handling International Terrestrial Reference Frame
    * Conversion to and from geodetic coordines (latitude, longitude, height)
    * Conversion to East-North-Up, North-East-Down relative to reference position
* Extension of Date class to add functions for Julian Date & Modified Julian Date output with optional time base (UTC, TAI, TT, GPS)

## **References**

The code in this document draws heavily on the following canonical texts:

* Vallado, David L.  *Fundamentals of Astrodynamics and Applications*, 4th edition. Microcosm Press and Springer, 2013.
* Montenbruck, Oliver and Gill, Eberhard. *Satellite Orbits: Models, Methods, Applications*.  Springer, 2000.
* Urban, Sean E. and Seidelmann, P. Kenneth. *Explanatory Supplement to the Astronomical Almanac*, 3rd edition.  University Science Books.  2013.

## **Validation**

The <tt>tests</tt> directory includes tests of included alogirhtms.  These include:

* Code for importing test TLEs from "official" Vallado distribution of C++ sgp4 implementation, and comparing computed positions and velocities against "official" test vectors 
* Implementation of various examples from the above reference literature for solar system ephemerides & time conversion
* Test written by the author to verify quaternions, extension of Date class, actions on vectors, etc...

The <tt>tape</tt> module, https://www.npmjs.com/package/tape, is used for test management.

## **Example** 

Examples are included in the <tt>examples</tt> directory:
* **<tt>iss_groundtrack.js</tt>**: Given input TLE for the international space station (ISS), compute the ground track (longitude and latitude) over a single orbit

* **<tt>satelellite_comm_access.js</tt>**: Given input TLE for the TROPICS Pathfinder satellite (sun synchronous orbit), compute contact times over an orbit for the communications ground station in Svalbard, Norway

For reference the code for <tt>iss_groundtrack.js</tt> is below.

```js
// Import the astrokit
import * as ak from '../src/index.js'

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
```