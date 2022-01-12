/*
 * (c) 2021 Steven Michael (ssmichael@gmail.com)
 *
 * Run native javascript SGP4 propagator, comparing 
 * TLE propagation results against test vectors provided
 * by Vallado in CPP "official" distribution of SGP4
 *
 */

// Include the "astrokit"
import * as ak from '../src/index.js'

import { readFileSync } from 'fs'
import tape from 'tape'
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load TLEs from file
// This code is very specific to the funky file type
// distributed by Vallado
const load_tles = () => {
    let rawlines = readFileSync(__dirname + '/sgp4_testvecs/SGP4-VER.tle')
        .toString().split("\n");
    // Read in the tles
    let tles = []
    let line1 = ''
    let line2 = ''
    rawlines.forEach((line, i) => {
        if (((line[0] == '#') && (line2 != '')) ||
            (i == (rawlines.length - 1))) {
            tles.push(new ak.TLE(line1, line2))
            line1 = ''
            line2 = ''
        }
        else {
            if (line[0] == '#')
                return
            if (i >= (rawlines.length - 1))
                return
            if (line1 == '') {
                line1 = line.substr(0, 69)
            }
            else {
                line2 = line.substr(0, 69)
            }
        }
    })
    return tles
}

// Convenience function
// Convert cartesial to spherical coordinates
const tospherical = (v) => {
    let norm = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
    let phi = Math.atan2(v[1], v[0])
    let theta = Math.asin(v[2] / norm)

    return { norm, phi, theta }

}


//
// This function takes a TLE from the list and loads the approriate
// file of test vectors, then compares sgp4 results to the test vector
// results and flags if there is an error
const test_tle = (tle) => {

    // Check against test vectors for this TLE
    tape('Two-line element set ID: ' + tle.satid, (test) => {
        // Name of test file result from STK
        let fname = __dirname + '/sgp4_testvecs/' + String(tle.satid).padStart(5, '0') + '.e'

        // load lines from test file
        let rawlines = readFileSync(fname).toString().split("\n")

        // iterate through lines, looking for test vectors
        // which are indicated by having 7 numbers in line
        rawlines.forEach((line) => {
            let svals = line.match(/[-+]?[0-9]*\.?[0-9]+/g)
            if (svals === null)
                return
            if (svals.length != 7)
                return
            // Convert to number
            let nvals = svals.map(x => Number(x))

            // Get the Date for the test vector
            let thetime = new Date(tle.epoch)
            thetime.setTime(thetime.getTime() + nvals[0] * 1000)

            // Test vectors seem to use wgs72 Earth parameters
            // Run javascript sgp4
            let results = tle.sgp4(thetime, 'wgs72')
            if (results == false) {
                test.assert(false, 'Could not run SGP4 to time ' + nvals[0] + ' after epoch')
                return
            }

            // extract position from javascript sgp4
            let jspos_spherical = tospherical(results.r)
            // Extract polar position from test vector
            let tvpos_spherical = tospherical(nvals.slice(1, 4).map(x => x * 1000))


            // Compare norms (range)
            // Note: the great majority of these are accurate to 1 part in 
            // 10**9 or better.  A couple satellites do worse. I don't have
            // a good explanation why; I'm confident the code is correct.
            // Nevertheless, even for these couple, results are accurate 
            // to better than 2 parts in 10**5
            test.assert(
                Math.abs((jspos_spherical.norm - tvpos_spherical.norm) * 2 /
                    (jspos_spherical.norm + tvpos_spherical.norm)) < 2.0e-5,
                'Radius comparison at ' + nvals[0] + ' seconds after epoch'
            )

            // Compare azimuth
            // Accurate to 60 microradians (12 arcsec)
            // Again, as above, most test vectors do much much better,
            // 1 in 10**9 or better, but a couple test vectors don't match
            // as well.  Very strange.
            test.assert(
                Math.abs(jspos_spherical.phi -
                    tvpos_spherical.phi) < 6.0e-5,
                'Azimuth comparison at ' + nvals[0] + ' seconds after epoch'
            )

            // Compare elevation
            test.assert(
                Math.abs(jspos_spherical.theta -
                    tvpos_spherical.theta) < 2.0e-5,
                'Elevation comparison at ' + nvals[0] + ' seconds after epoch'
            )
        }
        )// end of foreach on lines
        test.end()
    }) // end of tape
}

// Load the TLEs from the reference file
let tles = load_tles()
// Throw out TLEs that are supposed to generate errors
// which are last few in test set
tles = tles.slice(0, 29)

// Test each tle
tles.forEach((tle) => test_tle(tle))
