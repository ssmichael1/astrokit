/*
 * (c) 2021 Steven Michael (ssmichael@gmail.com)
 *
 * Implementation of rotations between
 * Earth-centered-Earth-fixed frame (ITRF)
 * and Earth-centered inertial frames,
 * TEME (output by SGP4 propagator), and
 * GCRS, which is "more" inertial in that it 
 * accounts for additional effects 
 * (precession, nutation, etc...)
 *
 *
 */

import Quaternion from './quaternion.js';
import './date_extensions.js'

const deg2rad = Math.PI / 180.0

/**
 * Greenwich mean sidereal time
 * 
 * @param {Number} jd_ut1 The Julian date, referenced to UT1
 * @returns {Number} Greenwich mean sidereal time, radians
 */
export const gmst = (jd_ut1) => {
    // Convert seconds to radians
    // Expression below gives gmst in seconds
    let tut1 = (jd_ut1 - 2451545.0) / 36525.0

    let gmst = 67310.54841
        + tut1 * ((876600.0 * 3600.0 + 8640184.812866))
        + (tut1 * (0.093104 - tut1 * 6.2E-6));
    gmst = (gmst % 86400.0) / 240.0 * Math.PI / 180.0;
    if (gmst < 0) {
        gmst = gmst + 2.0 * Math.PI
    }
    return gmst;
}


/**
 * Greenwich apparant sidereal time
 * 
 * @param {Number} jd_ut1 the Julian date, referenced to UT1
 * @returns {Number} Greenwich apparant sideral time, radians
 */
export const gast = (jd_ut1) => {
    // Compute equation of equinoxes
    let t = jd_ut1 - 2451545.0
    const deg2rad = Math.PI / 180.
    let omega = deg2rad * (125.04 - 0.052954 * t);
    let L = (280.47 + 0.98565 * t) * deg2rad
    let epsilon = (23.4393 - 0.0000004 * t) * deg2rad
    let dPsi =
        (-0.000319 * Math.sin(omega) - 0.000024 * Math.sin(2 * L)) * 15 * deg2rad

    // Greenwich apparant sideral time
    let gast = gmst(jd_ut1) + dPsi * Math.cos(epsilon);
    return gast;
}

/**
 * Compute rotation from TEME frame to ITRF frame
 * TEME is the frame output by the SGP-4 orbit propagator
 * ITRF is the International Terrestial Reference Frame,
 * and is a Cartesian Earth-Fixed frame from which geodetic coordinates
 * (latitude, longitude) can be computed
 * 
 * @param {Date} thedate Date for which to compute rotation
 * @returns {Quaternion} Quaternion representing the rotation
 */
export const qTEME2ITRF = (thedate) => {
    return Quaternion.rotz(gmst(thedate.jd(Date.timescale.UTC)))
}

/**
 * Compute rotation from GRCS frame to ITRF frame
 * GCRS is an inertial frame very close to J2000
 * ITRF is the International Terrestial Reference Frame,
 * and is a Cartesian Earth-Fixed frame from which geodetic coordinates
 * (latitude, longitude) can be computed
 * 
 * @param {Date} thedate Date for which to compute rotation
 * @returns {Quaternion} Quaternion representing the rotation
 */
export const qGCRS2ITRF = (thedate) => {
    let t = (thedate.jd(Date.timescale.UTC) - 2451545.0) / 36525.0

    // Compute precession rotation
    let zeta = 2.650545
        + t * (2306.083227
            + t * (0.2988499
                + t * (0.01801828
                    + t * (-0.000005971
                        + t * -0.0000003173))));


    let z = -2.650545
        + t * (2306.077181
            + t * (1.0927348
                + t * (0.01826837
                    + t * (-0.000028596
                        + t * -0.0000002904))));

    let theta = t * (2004.191903
        + t * (-0.4294934
            + t * (-0.04182264
                + t * (-0.000007089
                    + t * -0.0000001274))));

    const ARCSEC2RAD = Math.PI / 180.0 / 3600.0
    zeta = zeta * ARCSEC2RAD;
    z = z * ARCSEC2RAD;
    theta = theta * ARCSEC2RAD;
    let qP = Quaternion.mult(Quaternion.rotz(zeta),
        Quaternion.mult(Quaternion.roty(-theta),
            Quaternion.rotz(z)))

    const DEG2RAD = Math.PI / 180.
    let deltaPsi =
        DEG2RAD * (-0.0048 * Math.sin((125.0 - 0.05295 * t) * DEG2RAD) -
            0.0004 * Math.sin((200.9 + 1.97129 * t) * DEG2RAD));
    let deltaEpsilon =
        DEG2RAD * (0.0026 * Math.cos((125.0 - 0.05295 * t) * DEG2RAD) +
            0.0002 * Math.cos((200.9 + 1.97129 * t) * DEG2RAD));
    let epsilonA =
        DEG2RAD *
        ((23.0 + 26.0 / 60.0 + 21.406 / 3600.0)
            + t * (-46.836769 / 3600.0
                + t * (-0.0001831 / 3600.0
                    + t * (0.00200340 / 3600.0
                        + t * (-5.76e-7 / 3600.0
                            + t * -4.34E-8 / 3600.0)))));
    let epsilon = epsilonA + deltaEpsilon;
    let qN = Quaternion.mult(Quaternion.rotx(-epsilonA),
        Quaternion.mult(Quaternion.rotz(deltaPsi),
            Quaternion.rotx(epsilon)))

    // gast should take as input jd in UT1 time base, but UTC
    // is close enough for our purposes
    let qGast = Quaternion.rotz(-gast(thedate.jd(Date.timescale.UTC)))

    let q = Quaternion.mult(qP, Quaternion.mult(qN, qGast))
    return q.conj()
}
