require('./date_extensions.js')
exports.Quaternion = require('./quaternion.js')

lp = require('./lpephemeris.js')
exports.sunPosGCRS = lp.sunPosGCRS
exports.moonPosGCRS = lp.moonPosGCRS
exports.bodyPosHelio = lp.bodyPosHelio
exports.qGCRS2ITRF = lp.qGCRS2ITRF
exports.qTEME2ITRF = lp.qTEME2ITRF
exports.univ = lp.univ
exports.ITRFCoord = require('./itrfcoord.js')

exports.TLE = require('./tle.js')

// "Static" convenience function for running sgp4
// outside of the tle class
exports.sgp4 = (tle, thedate, gravmodel) => tle.sgp4(thedate, gravmodel)