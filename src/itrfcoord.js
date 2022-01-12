/*
 * (c) 2021 Steven Michael (ssmichael@gmail.com)
 *
 * Javascript class representing a coordinate in the 
 * International Terrestrial Reference Frame (ITRF)
 * 
 * This is a Cartesian frame that rotates with the Earth
 * 
 * Included are functions to convert to and from the 
 * more-familiar Geodetic coordinates (latitude, longitude,
 * height above ellipsoid)
 * 
 * Also included are functions to compare relative coordinates, such
 * as computing the East-North-Up position of a coordinate 
 * relative to an input reference
 *
 * The class uses the WGS-84 Earth radius & flattening values
 * 
 */

const wgs84_a = 6378137
const wgs84_f = 0.003352810664747

const rad2deg = 180.0 / Math.PI
const deg2rad = Math.PI / 180.0

if (inspect == undefined)
    var inspect = Symbol.for('nodejs.util.inspect.custom');

import { utcMilliseconds } from 'd3';
import Quaternion from './quaternion.js'

export default class ITRFCoord {
    constructor(x, y, z) {
        if (x == undefined) {
            this.raw = [0, 0, 0]
            return this
        }
        if (y == undefined) {
            this.raw = x
            return this
        }
        this.raw = [x, y, z]
    }


    /**
     * 
     * Create ITRFCoord object from input 
     * geodetic coordinates
     * 
     * @param {Number} lat Latitude in radians
     * @param {Number} lon Longitude in radians
     * @param {Number} hae Height above ellipsoid
     * @returns ITRFCoord object
     */
    static fromGeodetic(lat, lon, hae) {
        if (hae == undefined)
            hae = 0
        let sinp = Math.sin(lat)
        let cosp = Math.cos(lat)
        let sinl = Math.sin(lon)
        let cosl = Math.cos(lon)
        let f2 = (1 - wgs84_f) * (1 - wgs84_f)
        let C = 1 /
            (Math.sqrt(cosp * cosp + f2 * sinp * sinp))
        let S = f2 * C

        return new ITRFCoord(
            (wgs84_a * C + hae) * cosp * cosl,
            (wgs84_a * C + hae) * cosp * sinl,
            (wgs84_a * S + hae) * sinp)
    }

    /**
     * 
     * @param {Number} lat_deg Latitude in degrees
     * @param {Number} lon_deg Longitude in degrees
     * @param {Number} hae height above ellipsoid, meters
     * @returns 
     */
    static fromGeodticDeg(lat_deg, lon_deg, hae) {
        const deg2rad = Math.PI / 180.
        return ITRFCoord.fromGeodetic(lat_deg * deg2rad, lon_deg * deg2rad, hae)
    }


    /**
     * 
     * @returns Height above WGS84 ellipsoid, meters
     */
    height() {
        let e2 = 1.0 - (1.0 - wgs84_f) * (1.0 - wgs84_f)
        let phi = this.latitude()
        let sinphi = Math.sin(phi)
        let cosphi = Math.cos(phi)
        let rho = Math.sqrt(this.raw[0] * this.raw[0] +
            this.raw[1] * this.raw[1])
        let N = wgs84_a / Math.sqrt(1.0 - e2 * sinphi * sinphi)
        let h = rho * cosphi + (this.raw[2] + e2 * N * sinphi) * sinphi - N
        return h
    }

    /**
     * 
     * @returns Geodetic longitude, radians
     */
    longitude() {
        return Math.atan2(this.raw[1], this.raw[0])
    }

    /**
     * 
     * @returns Geodetic latitude, radians
     */
    latitude() {
        let e2 = 1.0 - (1.0 - wgs84_f) * (1.0 - wgs84_f)
        let ep2 = e2 / (1.0 - e2)
        let b = wgs84_a * (1.0 - wgs84_f)
        let rho = Math.sqrt(
            this.raw[0] * this.raw[0] + this.raw[1] * this.raw[1]
        )
        let beta = Math.atan2(this.raw[2],
            (1.0 - wgs84_f) * rho)
        let phi = Math.atan2(
            this.raw[2] +
            b * ep2 * Math.pow(Math.sin(beta), 3),
            rho - wgs84_a * e2 *
            Math.pow(Math.cos(beta), 3))
        let betaNew = Math.atan2(
            (1.0 - wgs84_f) * Math.sin(phi),
            Math.cos(phi))
        let count = 0
        while (
            (Math.abs(beta - betaNew) < 1.0e-6) &&
            (count < 5)) {
            beta = betaNew
            phi = Math.atan2(this.raw[2] + b * ep2 *
                Math.pow(Math.sin(beta), 3),
                rho - wgs84_a * e2 *
                Math.pow(Math.cos(beta), 3))
            betaNew = Math.atan2(
                (1.0 - wgs84_f) * Math.sin(phi),
                Math.cos(phi))
            count = count + 1
        }
        return phi
    }

    /**
     * 
     * @returns Quaternion to rotate from North-East-Down frame
     *          to Earth-centered-Earth-fixed International
     *          Terrestrial Reference Frame (ITRF)
     *          at this location
     */
    qNED2ITRF() {
        let lat = this.latitude()
        let lon = this.longitude()
        return Quaternion.mult(
            Quaternion.rotz(-lon),
            Quaternion.roty(lat + Math.PI / 2.0)
        )
    }
    /**
     *
     * @returns Quaternion to rotate from East-North-Up frame
     *          to Earth-centered-Earth-fixed International
     *          Terrestrial Reference Frame (ITRF)
     *          at this location
     */
    qENU2ITRF() {
        let lat = this.latitude()
        let lon = this.longitude()
        return Quaternion.mult(
            Quaternion.rotz(-lon - Math.PI / 2),
            Quaternion.rotx(lat - Math.PI / 2.0)
        )
    }

    /**
     * 
     * @param {ITRFCoord} ref Reference coordinate
     * @returns East-North-Up vector relative to input reference, meters
     */
    toENU(ref) {
        let lat = ref.latitude()
        let lon = ref.longitude()
        let q = Quaternion.mult(
            Quaternion.rotx(-lat + Math.PI / 2),
            Quaternion.rotz(lon + Math.PI / 2)
        )
        return q.rotate(
            [this.raw[0] - ref.raw[0],
            this.raw[1] - ref.raw[1],
            this.raw[2] - ref.raw[2]])
    }


    /**
     *
     * @param {ITRFCoord} ref Reference coordinate
     * @returns North-East-Down vector relative to input reference, meters
     */
    toNED(ref) {
        return ref.qNED2ITRF().conj().rotate(
            [this.raw[0] - ref.raw[0],
            this.raw[1] - ref.raw[1],
            this.raw[2] - ref.raw[2]])
    }

    /**
     *
     * Create ITRFCoord object from input
     * geodetic coordinates
     *
     * @param {Number} lat Latitude in degrees
     * @param {Number} lon Longitude in degrees
     * @param {Number} hae Height above ellipsoid
     * @returns ITRFCoord object
     */
    static fromGeodeticDeg(lat, lon, hae) {
        return this.fromGeodetic(lat * Math.PI / 180, lon * Math.PI / 180, hae)
    }

    /**
     * 
     * @returns Longitude in degrees
     */
    longitude_deg() {
        return this.longitude() * 180.0 / Math.PI
    }

    /**
     * 
     * @returns Latitude in degrees
     */
    latitude_deg() {
        return this.latitude() * 180.0 / Math.PI
    }

    /**
     * @returns Geocentric latitude, radians
     */
    geocentric_latitude() {
        return Math.asin(this.raw[2] / this.raw.norm())
    }

    /**
     * @returns Gencentric latitude, degrees
     */
    geocentric_latitude_deg() {
        return Math.asin(this.raw[2] / this.raw.norm()) * rad2deg
    }

    /**
     * 
     * @returns string description of coordinate
     */
    toString() {
        return `ITRFCoord(Latitude = ${this.latitude_deg().toFixed(3)} deg, `
            + `Longitude = ${this.longitude_deg().toFixed(3)} deg, `
            + `Height = ${this.height()} m)`
    }


    [inspect]() {
        return this.toString();
    }
}


