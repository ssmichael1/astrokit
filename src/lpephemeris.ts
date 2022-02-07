/*
 * (c) 2021 Steven Michael (ssmichael@gmail.com)
 *
 * Implementation of JPL low-precision ephemerides for 
 * solar system bodies, as well some additional ephemerides
 * 
 * For a JPL reference, see:
 * https://ssd.jpl.nasa.gov/?planet_pos
 * 
 * 
 */

import { sind, cosd, eadd } from './astroutil.js'
import './date_extensions.js'
import { Vec3 } from './quaternion.js'
import * as moon from './lunar_calcs.js'
import { univ } from './univ.js'

/**
 * Bodies for which position can be computed
 */
export const SolarSystemBodies =
{
    Mercury: "Mercury",
    Venus: "Venus",
    EarthMoon: "EarthMoon",
    Mars: "Mars",
    Jupiter: "Jupiter",
    Saturn: "Saturn",
    Uranus: "Uranus",
    Neptune: "Neptune",
    Pluto: "Pluto"
}



type ssbodies = 'Mercury' | 'Venus' | 'EarthMoon' | 'Mars' | 'Jupiter' | 'Saturn' | 'Uranus' | 'Neptune' | 'Pluto';

/**
 * ephemerides lookup table, pulled from the
 * JPL horizons webpage
 */
const lpephem = {
    Mercury: [
        0.38709927,
        0.20563593,
        7.00497902,
        252.25032350,
        77.45779628,
        48.33076593,
        0.00000037,
        0.00001906,
        -0.00594749,
        149472.67411175,
        0.16047689,
        -0.12534081
    ],
    Venus: [
        0.72333566,
        0.00677672,
        3.39467605,
        181.97909950,
        131.60246718,
        76.67984255,
        0.00000390,
        -0.00004107,
        -0.00078890,
        58517.81538729,
        0.00268329,
        -0.27769418
    ],
    EarthMoon: [
        1.00000261,
        0.01671123,
        -0.00001531,
        100.46457166,
        102.93768193,
        0.0,
        0.00000562,
        -0.00004392,
        -0.01294668,
        35999.37244981,
        0.32327364,
        0.0
    ],
    Mars: [
        1.52371034,
        0.09339410,
        1.84969142,
        -4.55343205,
        -23.94362959,
        49.55953891,
        0.00001847,
        0.00007882,
        -0.00813131,
        19140.30268499,
        0.44441088,
        -0.29257343
    ],
    Jupiter: [
        5.20288700,
        0.04838624,
        1.30439695,
        34.39644051,
        14.72847983,
        100.47390909,
        -0.00011607,
        -0.00013253,
        -0.00183714,
        3034.74612775,
        0.21252668,
        0.20469106
    ],
    Saturn: [
        9.53667594,
        0.05386179,
        2.48599187,
        49.95424423,
        92.59887831,
        113.66242448,
        -0.00125060,
        -0.00050991,
        0.00193609,
        1222.49362201,
        -0.41897216,
        -0.28867794
    ],
    Uranus: [
        19.18916464,
        0.04725744,
        0.77263783,
        313.23810451,
        170.95427630,
        74.01692503,
        -0.00196176,
        -0.00004397,
        -0.00242939,
        428.48202785,
        0.40805281,
        0.04240589
    ],
    Neptune: [
        30.06992276,
        0.00859048,
        1.77004347,
        -55.12002969,
        44.96476227,
        131.78422574,
        0.00026291,
        0.00005105,
        0.00035372,
        218.45945325,
        -0.32241464,
        -0.00508664
    ],
    Pluto: [
        39.48211675,
        0.24882730,
        17.14001206,
        238.92903833,
        224.06891629,
        110.30393684,
        -0.00031596,
        0.00005170,
        0.00004818,
        145.20780515,
        -0.04062942,
        -0.01183482
    ]
};

/**
 * 
 * Implements JPL low-precision calculations for 
 * solar system ephemerides in the Heliocentric frame
 * https://ssd.jpl.nasa.gov/txt/aprx_pos_planets.pdf
 * 
 * 
 * @param {SolarSystemBodies} name Name of body
 * @param {Date} thedate Date to compute position for
 * @returns 3-vector representing position (meters) in Heliocentric frame
 */
export function bodyPosHelio(name: ssbodies, thedate: Date): Vec3 {

    // const deg2rad = Math.PI / 180.0
    const rad2deg = 180.0 / Math.PI

    let T = (thedate.jd('UTC') - 2451545.0) / 36525.0
    let vals = lpephem[name];
    let a = vals[0] + vals[6] * T;
    let e = vals[1] + vals[7] * T;
    let I = vals[2] + vals[8] * T;
    let L = vals[3] + vals[9] * T;
    let omegaBar = vals[4] + vals[10] * T;
    let Omega = vals[5] + vals[11] * T;

    // Argument of perihelion
    let omega = omegaBar - Omega;
    // Mean anomaly
    let M = L - omegaBar;
    let estar = e * rad2deg;
    // M = M % 180.0;
    let E = M + estar * sind(M)
    for (let i = 0; i < 5; i++) {
        let deltaM = M - (E - estar * sind(E));
        let deltaE = deltaM / (1 - e * cosd(E));
        E = E + deltaE
    }
    M = E - estar * sind(E)

    let xp = a * (cosd(E) - e);
    let yp = a * Math.sqrt(1 - e * e) * sind(E)

    let comega = cosd(omega)
    let somega = sind(omega)
    let cI = cosd(I)
    let sI = sind(I)
    let cOmega = cosd(Omega)
    let sOmega = sind(Omega)

    // Position in plane of the ecliptic
    let xecl = (comega * cOmega - somega * sOmega * cI) * xp +
        (-somega * cOmega - comega * sOmega * cI) * yp;
    let yecl = (comega * sOmega + somega * cOmega * cI) * xp +
        (-somega * sOmega + comega * cOmega * cI) * yp;
    let zecl = (somega * sI) * xp + (comega * sI) * yp;

    const obliquity = 23.43928;
    const cobliquity = cosd(obliquity);
    const sobliquity = sind(obliquity)

    let xeq = xecl;
    let yeq = cobliquity * yecl - sobliquity * zecl;
    let zeq = sobliquity * yecl + cobliquity * zecl;
    return [xeq * univ.AU, yeq * univ.AU, zeq * univ.AU]

}



/**
 * 
 * Compute solar system body position in Earth-centered GCRS frame
 * using low-precision ephemerides provided by JPL
 * 
 * @param {SolarSystemBodies} body Body for which to compute position
 * @param {Date} thedate Time for which position is computed
 * @returns Solar system body position in Earth-centered frame
 */
export const bodyPosGCRS = (body: ssbodies, thedate: Date): Vec3 => {

    let bh = bodyPosHelio(body, thedate)
    let em = bodyPosHelio('EarthMoon', thedate)
    let mp = moon.posGCRS(thedate)
    let div = 1.0 / (1.0 + univ.EarthMoonMassRatio)

    return [bh[0] - em[0] + mp[0] * div,
    bh[1] - em[1] + mp[1] * div,
    bh[2] - em[2] + mp[2] * div]


}




