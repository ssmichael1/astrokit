import { sind, cosd, tand } from './util.js'
import { moonPosGCRS } from './lpephemeris.js'
import { gmst, qGCRS2ITRF } from './coordconversion.js'
import { default as ITRFCoord } from './itrfcoord.js'
import { jd2Date } from './date_extensions.js'

const deg2rad = Math.PI / 180.
const rad2deg = 180. / Math.PI

// Zero-hour GMST, equation 3-45 in Vallado
const gmst0h = (T) => {
    return (100.4606184 + 36000.77005361 * T + 0.00038793 * T * T - 2.6E-8 * T * T * T) % 360.0
}

const sunriseset = (thedate, coord, sigma) => {
    let latitude = coord.latitude_deg()
    let longitude = coord.longitude_deg()

    const calcterms = [{
        name: 'sunrise',
        jdoffset: 0.25,
        lhafunc: (x) => (360 - x)
    },
    {
        name: 'sunset',
        jdoffset: 0.75,
        lhafunc: (x) => x
    }]

    let jd0h = thedate.jd(Date.timescale.UTC)
    jd0h = Math.round(jd0h * 2) / 2
    console.log(`jd0h = ${jd0h}`)
    return calcterms.map((v) => {

        let jd = thedate.jd(Date.timescale.UTC) + v.jdoffset
        console.log(jd)
        jd = jd - longitude / 360
        let T = (jd - 2451545.0) / 36525
        console.log(`T = ${T}`)

        // Sigma is angle between site and sun
        if (sigma == undefined)
            sigma = 90 + 50 / 60

        let lambda_sun = 280.4606184 + 36000.77005361 * T
        console.log((lambda_sun % 360) + 360)
        let Msun = 357.5291092 + 35999.05034 * T
        console.log(`Msun = ${Msun % 360 + 360}`)
        let lambda_ecliptic = lambda_sun +
            1.914666471 * sind(Msun) + 0.019994643 * sind(2 * Msun)
        console.log(`lambda_ecliptic = ${lambda_ecliptic % 360 + 360}`)
        let epsilon = 23.439291 - 0.0130042 * T
        console.log(`epsilon = ${epsilon}`)

        let tanalpha_sun = cosd(epsilon) * tand(lambda_ecliptic)
        let sindelta_sun = sind(epsilon) * sind(lambda_ecliptic)
        let deltasun = Math.asin(sindelta_sun) * rad2deg
        let alpha_sun = Math.atan(tanalpha_sun) * rad2deg
        console.log(`alpha_sun = ${Math.atan(tanalpha_sun) * rad2deg}`)
        console.log(`delta_sun = ${deltasun}`)
        console.log(`cos(sigma) = ${cosd(sigma)}`)

        let coslha = (cosd(sigma) - sind(deltasun) * sind(latitude)) /
            (cosd(deltasun) * cosd(latitude))
        let LHA = Math.acos(coslha) * rad2deg
        LHA = v.lhafunc(LHA)
        console.log(`LHA = ${LHA}`)
        let gmst_ = gmst0h(T) % 360
        console.log(`gmst = ${gmst_}`)
        let ret = (LHA + alpha_sun - gmst_) % 360
        if (ret < 0) ret += 360
        console.log(ret)
        return jd2Date(ret / 360 + jd0h)
    })
}

let c = ITRFCoord.fromGeodeticDeg(40, 0)
let d = new Date(Date.UTC(1996, 2, 23))
d = new Date(Date.UTC(2022, 0, 11))
console.log(c)
console.log(d)
console.log(sunriseset(d, c))
