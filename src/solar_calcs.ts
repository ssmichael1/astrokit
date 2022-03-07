import { sind, cosd, tand } from './astroutil.js'
import { jd2Date } from './date_extensions.js'
import { univ } from './univ.js'
import { Vec3 } from './quaternion.js'
import { default as ITRFCoord } from './itrfcoord.js'

const rad2deg = 180. / Math.PI

// Zero-hour GMST, equation 3-45 in Vallado
const gmst0h = (T: number): number => {
    return (100.4606184 + 36000.77005361 * T + 0.00038793 * T * T - 2.6E-8 * T * T * T) % 360.0
}


export interface RiseSetType {
    rise: Date
    set: Date
}

/**
 * 
 * Fraction of year for given date
 * 
 * @param thedate Date for which fraction of year is computed
 * @returns Fraction of year
 */
function fractionOfYear(thedate: Date): number {
    let startOfYear = new Date(thedate.getFullYear(), 0, 1)
    return (thedate.mjd() - startOfYear.mjd()) / 365.25
}

/**
 * 
 * Equation of Time
 * https://gml.noaa.gov/grad/solcalc/solareqns.PDF
 * 
 * @param thedate 
 * @returns Equation of time (minutes)
 */
function eqtime(thedate: Date): number {
    let g = fractionOfYear(thedate) * Math.PI * 2.0
    return 229.18 * (
        0.000075 + 0.001868 * Math.cos(g)
        - 0.032077 * Math.sin(g)
        - 0.014615 * Math.cos(2.0 * g)
        - 0.040849 * Math.sin(2.0 * g)
    )
}

/**
 * 
 * Compute time of solar noon
 * https://gml.noaa.gov/grad/solcalc/solareqns.PDF
 * 
 * @param thedate Date for which to compute local noon time
 * @param longitude Longitude for which to compute local noon, in degrees
 */
export function solarNoon(thedate: Date, longitude: number): Date {

    let snoon = 720 - 4 * longitude - eqtime(thedate)
    let startOfDay = new Date(thedate)
    startOfDay.setHours(0, 0, 0)
    return new Date(startOfDay.getTime() + snoon * 60 * 1000)
}

/**
 * 
 * Sun position in the Mean-of-Date frame
 * Vallado algorithm 29, page 279
 * 
 * @param {Date} thedate Date for which position is computed
 * @returns Sun position in Earth-centered MOD frame, meters
 * 
 */
export function posMOD(thedate: Date): Vec3 {
    // Approximate UT1 with UTC
    let T = (thedate.jd('UTC') - 2451545.0) / 36525.0
    const deg2rad = Math.PI / 180.
    //const rad2deg = Math.PI / 180.

    // Mean longitude
    let lambda = (280.46 + 36000.77 * T);

    // mean anomaly
    let M = deg2rad * (357.5277233 + 35999.05034 * T);

    // obliquity
    let epsilon = deg2rad * (23.439291 - 0.0130042 * T);

    // Ecliptic
    let lambda_ecliptic = deg2rad * (
        lambda + 1.914666471 * Math.sin(M) + 0.019994643 * Math.sin(2.0 * M))

    let r =
        (1.000140612 - 0.016708617 * Math.cos(M) - 0.000139589 * Math.cos(2. * M));
    r = r * univ.AU;

    return [Math.cos(lambda_ecliptic) * r,
    Math.sin(lambda_ecliptic) * Math.cos(epsilon) * r,
    Math.sin(lambda_ecliptic) * Math.sin(epsilon) * r]
}


/**
 * 
 * @param thedate Date for which to compute sunrise & sunset
 * @param coord Ground location for which to compute 
 * @param sigma Angle between noon and rise/set, in degrees:
 %                       rise/set: 90 deg, 50 arcmin
 *                       Civil twilight: 96 deg
 *                       Nautical twilight: 102 deg
 *                       Astronomical twilight: 108 deg
 *                       Default is for rise/set (90 + 50/60)
 * 
 * @returns  { rise: Date Object of rise, set: Date object of set }
 */
export const riseSet = (thedate: Date, coord: ITRFCoord, sigma?: number): RiseSetType => {
    let latitude = coord.latitude_deg()
    let longitude = coord.longitude_deg()

    const calcterms = [{
        name: 'sunrise',
        jdoffset: 0.25,
        lhafunc: (x: number): number => (360 - x)
    },
    {
        name: 'sunset',
        jdoffset: 0.75,
        lhafunc: (x: number): number => x
    }]



    let jd0h = thedate.jd('UTC')
    jd0h = Math.round(jd0h * 2) / 2
    let riseset = calcterms.map((v) => {

        let jd = thedate.jd('UTC') + v.jdoffset
        jd = jd - longitude / 360
        let T = (jd - 2451545.0) / 36525


        let lambda_sun = 280.4606184 + 36000.77005361 * T
        let Msun = 357.5291092 + 35999.05034 * T
        let lambda_ecliptic = lambda_sun +
            1.914666471 * sind(Msun) + 0.019994643 * sind(2 * Msun)
        let epsilon = 23.439291 - 0.0130042 * T

        let tanalpha_sun = cosd(epsilon) * tand(lambda_ecliptic)
        let sindelta_sun = sind(epsilon) * sind(lambda_ecliptic)
        let deltasun = Math.asin(sindelta_sun) * rad2deg
        let alpha_sun = Math.atan(tanalpha_sun) * rad2deg


        let coslha = (cosd(sigma || (90 + 50 / 60)) - sind(deltasun) * sind(latitude)) /
            (cosd(deltasun) * cosd(latitude))
        let LHA = Math.acos(coslha) * rad2deg
        LHA = v.lhafunc(LHA)
        let gmst_ = gmst0h(T) % 360
        let ret = (LHA + alpha_sun - gmst_) % 360
        if (ret < 0) ret += 360
        return jd2Date(ret / 360 + jd0h - longitude / 360)
    })
    return { rise: riseset[0], set: riseset[1] }
}
