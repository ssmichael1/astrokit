// For conversions to Julian date & modified Julian date
require('./date_extensions.js')

// Quaternions for rotation
exports.Quaternion = require('./quaternion.js')

// Low-precision solar system ephemerides
let lp = require('./lpephemeris.js')
exports.sunPosGCRS = lp.sunPosGCRS
exports.moonPosGCRS = lp.moonPosGCRS
exports.bodyPosHelio = lp.bodyPosHelio
exports.univ = lp.univ

// ITRF coordinates
exports.ITRFCoord = require('./itrfcoord.js')

// Two-line element ste
exports.TLE = require('./tle.js')

// Rotation between Earth-fixed & inertial frames
let cc = require('./coordconversion.js')
exports.qTEME2ITRF = cc.qTEME2ITRF
exports.qGCRS2ITRF = cc.qGCRS2ITRF

// "Static" convenience function for running sgp4
// outside of the tle class
exports.sgp4 = (tle, thedate, gravmodel) => tle.sgp4(thedate, gravmodel)