import { sind, cosd } from './astroutil.js'
import { gmst } from './coordconversion.js'
import { jd2Date } from './date_extensions.js'
import { univ } from './lpephemeris.js'
import { Vec3 } from './quaternion.js'
import { default as ITRFCoord } from './itrfcoord.js'

const deg2rad = Math.PI / 180.
const rad2deg = 180. / Math.PI

/**
 * 
 * Compute moon position in Earth-centered frame
 * Algorithm 31 from Vallado
 * 
 * @param thedate Date for which to compute position
 * @returns 3-vector representing moon position in GCRS frame, meters
 */
const posGCRS = (thedate: Date): Vec3 => {
    let T = (thedate.jd('UTC') - 2451545.0) / 36525.0
    let lambda_ecliptic = 218.32 + 481267.8813 * T +
        6.29 * sind(134.9 + 477198.85 * T) -
        1.27 * sind(259.2 - 413335.38 * T) +
        0.66 * sind(235.7 + 890534.23 * T) +
        0.21 * sind(269.9 + 954397.70 * T) -
        0.19 * sind(357.5 + 35999.05 * T) -
        0.11 * sind(186.6 + 966404.05 * T);

    let phi_ecliptic = 5.13 * sind(93.3 + 483202.03 * T) +
        0.28 * sind(228.2 + 960400.87 * T) -
        0.28 * sind(318.3 + 6003.18 * T) -
        0.17 * sind(217.6 - 407332.20 * T);

    let hparallax = 0.9508 +
        0.0518 * cosd(134.9 + 477198.85 * T) +
        0.0095 * cosd(259.2 - 413335.38 * T) +
        0.0078 * cosd(235.7 + 890534.23 * T) +
        0.0028 * cosd(269.9 + 954397.70 * T);

    let epsilon =
        23.439291 - 0.0130042 * T - 1.64e-7 * T * T + 5.04E-7 * T * T * T;

    let rmag = univ.EarthRadius / sind(hparallax);

    let normpos = [cosd(phi_ecliptic) * cosd(lambda_ecliptic),
    cosd(epsilon) * cosd(phi_ecliptic) * sind(lambda_ecliptic)
    - sind(epsilon) * sind(phi_ecliptic),
    sind(epsilon) * cosd(phi_ecliptic) * sind(lambda_ecliptic)
    + cosd(epsilon) * sind(phi_ecliptic)]

    return [normpos[0] * rmag, normpos[1] * rmag, normpos[2] * rmag]

}

/**
 * 
 * Compute phase of moon from Vallado
 * 
 * @param thedate Date for which to compute position
 * @returns Moon phase in radians, in range [-pi pi]
 */
const phase = (thedate: Date): number => {
    let T = (thedate.jd('UTC') - 2451545.0) / 36525.0


    let lambda_ecliptic_moon = deg2rad *
        (218.32 + 481267.8813 * T +
            6.29 * sind(134.9 + 477198.85 * T) -
            1.27 * sind(259.2 - 413335.38 * T) +
            0.66 * sind(235.7 + 890534.23 * T) +
            0.21 * sind(269.9 + 954397.70 * T) -
            0.19 * sind(357.5 + 35999.05 * T) -
            0.11 * sind(186.6 + 966404.05 * T))

    // Now the sun
    // Mean longitude
    let lambda = (280.46 + 36000.77 * T);
    // mean anomaly
    let M = deg2rad * (357.5277233 + 35999.05034 * T);
    // obliquity
    let epsilon = deg2rad * (23.439291 - 0.0130042 * T);
    // Ecliptic
    let lambda_ecliptic_sun = deg2rad * (
        lambda + 1.914666471 * Math.sin(M) + 0.019994643 * Math.sin(2.0 * M))

    // Phase is difference between 
    let moon_phase = lambda_ecliptic_sun - lambda_ecliptic_moon;
    moon_phase = moon_phase % (2.0 * Math.PI)
    if (moon_phase < 0) {
        moon_phase = moon_phase + 2.0 * Math.PI
    }
    return moon_phase
}

/**
 * 
 * @param thedate Date for which to compute fraction
 * @returns Fraction of moon illuminated by sun as seen from Earth,
 *          in range [0,1]
 */
const fractionIlluminated = (thedate: Date): number => {
    return 0.5 * (1 - Math.cos(phase(thedate)))
}

type risesettype = {
    rise: Date
    set: Date
}

/**
 * 
 * riseSet
 * Return rise and set time on the given Julian date
 * 
 * @param thedate Date Object
 * @param coord Coordinate at which to communicate rise & set
 * @returns JSON with moon rise and set times as javascript Dates
 */
const riseSet = (thedate: Date, coord: ITRFCoord): risesettype => {

    let observer_longitude = coord.longitude()
    let observer_latitude = coord.geocentric_latitude()

    // accurate to 10 seconds
    let tolerance = 10 / 86400
    let fields = ['rise', 'set']


    let [hrise, hset] = fields.map((v, riseidx) => {
        let cnt = 0
        let JDtemp = Math.floor(thedate.jd()) + 0.5 - observer_longitude / (2.0 * Math.PI)
        let deltaUT = .001
        let deltaJD = 0.0
        let deltaGHA = undefined
        let GHA = 0
        while ((cnt < 10) && (Math.abs(deltaUT) > tolerance)) {
            let T = (JDtemp - 2451545.0) / 36525.0
            let lambda_ecliptic = deg2rad *
                (218.32 + 481267.8813 * T +
                    6.29 * sind(134.9 + 477198.85 * T) -
                    1.27 * sind(259.2 - 413335.38 * T) +
                    0.66 * sind(235.7 + 890534.23 * T) +
                    0.21 * sind(269.9 + 954397.70 * T) -
                    0.19 * sind(357.5 + 35999.05 * T) -
                    0.11 * sind(186.6 + 966404.05 * T))

            let phi_ecliptic = deg2rad *
                (5.13 * sind(93.3 + 483202.03 * T) +
                    0.28 * sind(228.2 + 960400.87 * T) -
                    0.28 * sind(318.3 + 6003.18 * T) -
                    0.17 * sind(217.6 - 407332.20 * T))

            let obliquity = (23.439291 - 0.0130042 * T) * deg2rad

            let pX = Math.cos(phi_ecliptic) * Math.cos(lambda_ecliptic)
            let pY =
                Math.cos(obliquity) * Math.cos(phi_ecliptic) * Math.sin(lambda_ecliptic) - Math.sin(obliquity) * Math.sin(phi_ecliptic)
            let pZ =
                Math.sin(obliquity) * Math.cos(phi_ecliptic) * Math.sin(lambda_ecliptic) +
                Math.cos(obliquity) * Math.sin(phi_ecliptic)


            // Right ascension & declination of moon
            let ra = Math.atan2(pY, pX)
            let dec = Math.asin(pZ)

            let gmst_ = gmst(JDtemp)
            let GHAn = gmst_ - ra
            let LHA = GHAn + observer_longitude
            if (deltaGHA == undefined) {
                deltaGHA = 347.81 * deg2rad
            }
            else {
                deltaGHA = ((GHAn - GHA) / deltaUT)
            }
            if (deltaGHA < 0) {
                deltaGHA = deltaGHA + 2.0 * Math.PI / Math.abs(deltaUT)
            }
            let cosLHAn = (0.00233 - Math.sin(observer_latitude) * Math.sin(dec)) /
                (Math.cos(observer_latitude) * Math.cos(dec))
            if (Math.abs(cosLHAn) > 1.0) {
                deltaUT = 1;
            } // advance one day
            else {
                let LHAn = Math.acos(cosLHAn)
                if (riseidx == 0) {
                    LHAn = 2.0 * Math.PI - LHAn
                }
                deltaUT = (LHAn - LHA) / deltaGHA
                if (deltaUT < -0.5) {
                    deltaUT = deltaUT + 2.0 * Math.PI / deltaGHA
                }
                else if (deltaUT > 0.5) {
                    deltaUT = deltaUT - 2.0 * Math.PI / deltaGHA
                }
                if (deltaJD + deltaUT < 0.0) {
                    deltaUT = deltaUT + 1
                }
                GHA = GHAn
            } // end of not advancing one day
            JDtemp = JDtemp + deltaUT
            deltaJD = deltaJD + deltaUT
            cnt = cnt + 1
        }
        return jd2Date(JDtemp)
    })


    return {
        rise: hrise,
        set: hset
    }
}

export const moon = {
    posGCRS: posGCRS,
    phase: phase,
    fractionIlluminated: fractionIlluminated,
    riseSet: riseSet
}