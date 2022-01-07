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

import ITRFCoord from './itrfcoord.js'

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

// Universal constants
export const univ =
{
    AU: 1.495978706910000E11,
    c: 299792458.0,
    OmegaEarth: 7.292115090E-5,
    omega_earth: 7.292115090E-5,
    EarthRadius: 6378137,
    earth_radius: 6378137,
    EarthMoonMassRatio: 81.3007,
    MoonRadius: 1737400.0,
    moon_radius: 1737400.0,
    MuEarth: 3.986004418E14,
    mu_earth: 3986004418E14,
    MuSun: 1.32712440018E20,
    mu_sun: 1.32712440018E20,
}

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

// Stick cross product here for lack of a better place
Array.prototype.cross = function (other) {
    var result = [0, 0, 0]
    result[0] = this[1] * other[2] - this[2] * other[1];
    result[1] = this[2] * other[0] - this[0] * other[2];
    result[2] = this[0] * other[1] - this[1] * other[0]
    return result
}

Array.prototype.eadd = function (other) {
    var result = []
    for (let i = 0; i < this.length; i++) {
        result.push(this[i] + other[i])
    }
    return result
}

Array.prototype.normalize = function () {
    let n = this.norm()
    if (n == 0)
        return
    for (let i = 0; i < this.length; i++) {
        this[i] = this[i] / n
    }
    return this
}

Array.prototype.norm = function () {
    let n = 0
    for (let i = 0; i < this.length; i++) {
        n += this[i] * this[i]
    }
    return Math.sqrt(n)
}

const sind = function (a) {
    const deg2rad = Math.PI / 180.0;
    return Math.sin(a * deg2rad)
}

const cosd = function (a) {
    const deg2rad = Math.PI / 180.0;
    return Math.cos(a * deg2rad);
}


/**
 * 
 * Compute moon position in Earth-centered frame
 * Algorithm 31 from Vallado
 * 
 * @param {Date} thedate Date for which to compute position
 * @returns 3-vector representing moon position in GCRS frame, meters
 */
export function moonPosGCRS(thedate) {
    let T = (thedate.jd(Date.timescale.UTC) - 2451545.0) / 36525.0
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

    return [cosd(phi_ecliptic) * cosd(lambda_ecliptic),
    cosd(epsilon) * cosd(phi_ecliptic) * sind(lambda_ecliptic)
    - sind(epsilon) * sind(phi_ecliptic),
    sind(epsilon) * cosd(phi_ecliptic) * sind(lambda_ecliptic)
    + cosd(epsilon) * sind(phi_ecliptic)].map(x => x * rmag)

}

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
export function bodyPosHelio(name, thedate) {

    // const deg2rad = Math.PI / 180.0
    const rad2deg = 180.0 / Math.PI

    let T = (thedate.jd(Date.timescale.UTC) - 2451545.0) / 36525.0
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
    return [xeq, yeq, zeq].map(x => x * univ.AU)

}

/**
 * 
 * Sun position in the Mean-of-Date frame
 * 
 * @param {Date} thedate Date for which position is computed
 * @returns Sun position in Earth-centered MOD frame, meters
 * 
 */
export function sunPosMOD(thedate) {
    // Approximate UT1 with UTC
    let T = (thedate.jd(Date.timescale.UTC) - 2451545.0) / 36525.0
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

    return [Math.cos(lambda_ecliptic),
    Math.sin(lambda_ecliptic) * Math.cos(epsilon),
    Math.sin(lambda_ecliptic) * Math.sin(epsilon)].map(x => x * r)

}

/**
 * 
 * Compute sun position in Earth-centered GCRS frame
 * using low-precision ephemerides provided by JPL
 * 
 * @param {Date} thedate Date for which to compute position
 * @returns 3-vector representing sun position in Earth-centered GCRS frame
 */
export const sunPosGCRS = (thedate) => {
    return bodyPosHelio(SolarSystemBodies.EarthMoon, thedate)
        .map(x => -1 * x)
        .eadd(moonPosGCRS(thedate).map(x => x / (1.0 + univ.EarthMoonMassRatio)))

}


/**
 * 
 * Compute sun position in Earth-centered ITRF frame
 * using low-precision ephemerides provided by JPL
 * 
 * @param {Date} thedate Date for which to compute position
 * @returns 3-vector representing sun position in Earth-centered GCRS frame
 */

export const sunPosITRF = (thedate) => {
    return ITRFCoord(
        qGCRS2ITRF(thedate).rotate(bodyPosHelio(SolarSystemBodies.EarthMoon, thedate)
            .map(x => -1 * x)
            .eadd(moonPosGCRS(thedate).map(x => x / (1.0 + univ.EarthMoonMassRatio)))))

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
export const bodyPosGCRS = (body, thedate) => {
    return bodyPosHelio(body, thedate).eadd(
        bodyPosHelio(SolarSystemBodies.EarthMoon, thedate)
            .map(x => -1 * x)
            .eadd(moonPosGCRS(thedate)
                .map(x => x / (1.0 + univ.EarthMoonMassRatio))))

}




