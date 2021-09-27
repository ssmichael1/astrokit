// Include the "astrokit"
ak = require("../")

// For reading and writing files
fs = require('fs')

// Load TLEs from file
const load_tles = () => {
    let rawlines = fs.readFileSync('sgp4_testvecs/SGP4-VER.tle').toString().split("\n");

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
    // Name of test file result from STK
    fname = 'sgp4_testvecs/' + String(tle.satid).padStart(5, '0') + '.e'
    console.log(fname)

    // load lines from test file
    let rawlines = fs.readFileSync(fname).toString().split("\n")

    // iterate through lines, looking for test vectors
    // which are indicated by having 7 numbers in line
    rawlines.forEach((line) => {
        svals = line.match(/[-+]?[0-9]*\.?[0-9]+/g)
        if (svals === null)
            return
        if (svals.length != 7)
            return
        // Convert to number
        nvals = svals.map(x => Number(x))

        // Get the Date for the test vector
        let thetime = new Date(tle.epoch)
        thetime.setTime(thetime.getTime() + nvals[0] * 1000)

        // Test vectors seem to use wgs72 Earth parameters
        // Run javascript sgp4
        results = tle.sgp4(thetime, 'wgs72')


        // extract position from javascript sgp4
        jspos_spherical = tospherical(results.r)
        // Extract polar position from test vector
        tvpos_spherical = tospherical(nvals.slice(1, 4).map(x => x * 1000))


        // Compare norms
        if (Math.abs((jspos_spherical.norm - tvpos_spherical.norm) * 2 /
            (jspos_spherical.norm + tvpos_spherical.norm)) > 1.0e-4) {
            console.log('Position norm error')
            console.log('Seconds from epoch: ' + nvals[0])
            console.log(jspos_spherical.norm)
            console.log(tvpos_spherical.norm)
            throw BreakException
        }

        // Compare azimuth values
        // (fortunately no wrap arounds in test vectors vs js results)
        if (Math.abs(jspos_spherical.phi - tvpos_spherical.phi) > 1.0e-4) {
            console.log('Position azimuth angle error')
            console.log('Seconds from epoch: ' + nvals[0])
            throw BreakException;
        }
        // Compare elevation  values
        if (Math.abs(jspos_spherical.theta - tvpos_spherical.theta) > 1.0e-4) {
            console.log('Position elevation angle error')
            console.log('Seconds from epoch: ' + nvals[0])
            throw BreakException
        }

    }
    )
    console.log('Success')
}

// Load the TLEs from the reference file
tles = load_tles()
// Throw out TLEs that are supposed to generate errors
// which are last few in test set
tles = tles.slice(0, 29)

// Test each tle
tles.forEach((tle) => test_tle(tle))
