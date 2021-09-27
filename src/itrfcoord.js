(function () {
    'use strict';

    const wgs84_a = 6378137
    const wgs84_f = 0.003352810664747

    if (inspect == undefined)
        var inspect = Symbol.for('nodejs.util.inspect.custom');

    class ITRFCoord {
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

        // Create from Geodetic (latitude, longitude, height above ellipsoid)
        // Latitude in radians
        // Longitude in radians
        // Height above ellipsoid in meters
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

        // Return height above ellipsoid, in meters
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

        // Return longitude in radians
        longitude() {
            return Math.atan2(this.raw[1], this.raw[0])
        }

        // Return latitude in radians
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

        // Quaternion to rotate from North-East-Down frame to 
        // Earth-centered-Earth-Fixed International Terrestiral
        // Reference Frame (ITRF)
        qNED2ITRF() {
            let lat = this.latitude()
            let lon = this.longitude()
            return Quaternion.mult(
                Quaternion.rotz(-lon),
                Quaternion.roty(lat + Math.PI / 2.0)
            )
        }

        // Quaternion to rotate from East-North-Up frame to 
        // Earth-centered-Earth-Fixed International Terrestiral
        // Reference Frame (ITRF)
        qENU2ITRF() {
            let lat = this.latitude()
            let lon = this.longitude()
            return Quaternion.mult(
                Quaternion.rotz(-lon - Math.PI / 2),
                Quaternion.rotx(lat - Math.PI / 2.0)
            )
        }

        // Convert to East-North-Up vector relative to input 
        // reference position (also an ITRFCoord)
        toENU(ref) {
            return ref.qENU2ITRF().conj().rotate(
                [this.raw[0] - ref.raw[0],
                this.raw[1] - ref.raw[1],
                this.raw[2] - ref.raw[2]])
        }

        // Convert to North-East-Down vector relative
        // to input reference position (also an ITRFCoord)
        toNED(ref) {
            return ref.qNED2ITRF().conj().rotate(
                [this.raw[0] - ref.raw[0],
                this.raw[1] - ref.raw[1],
                this.raw[2] - ref.raw[2]])
        }

        // Create coordinate from input Geodetic position
        static fromGeodeticDeg(lat, lon, hae) {
            return this.fromGeodetic(lat * Math.PI / 180, lon * Math.PI / 180, hae)
        }

        // Return longitude in degrees
        longitude_deg() {
            return this.longitude() * 180.0 / Math.PI
        }

        // Return latitude in degrees
        latitude_deg() {
            return this.latitude() * 180.0 / Math.PI
        }

        toString() {
            return `ITRFCoord(Latitude = ${this.latitude_deg().toFixed(3)} deg, `
                + `Longitude = ${this.longitude_deg().toFixed(3)} deg, `
                + `Height = ${this.height()} m)`
        }
        [inspect](depth, opts) {
            return this.toString();
        }
    }


    if (typeof exports === 'object' && typeof module !== 'undefined') {
        if (Quaternion == undefined)
            var Quaternion = require('./quaternion.js')
        module.exports = ITRFCoord;
    }
    else if (typeof define === 'function' && define.amd) define(ITRFCoord);
    else window.ITRFCoord = ITRFCoord;

}());