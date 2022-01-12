// Utility functions
export * from './util.js'

// Solar phenomenon
export * as sun from './solar_calcs.js'

// For conversions to Julian date & modified Julian date
import './date_extensions.js'

export * from './date_extensions.js'

// Quaternions for rotation
export { default as Quaternion } from './quaternion.js'

// Low-precision solar system ephemerides
export * from './lpephemeris.js'

// ITRF coordinates
export { default as ITRFCoord } from './itrfcoord.js'

// import TLE from './tle.js'
export { default as TLE } from './tle.js'

// Rotation between Earth-fixed & inertial frames
export { qTEME2ITRF, qGCRS2ITRF, gmst, gast } from './coordconversion.js'

export * as moon from './lunar_calcs.js'

// "Static" convenience function for running sgp4
// outside of the tle class
export const sgp4 = (tle, thedate, gravmodel) => tle.sgp4(thedate, gravmodel)