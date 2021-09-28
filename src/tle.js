
/**
 * Class for representing two-line element set (TLE)
 * The two-line element set represents the ephemerides that
 * describe satellite positions.  TLEs are a standard
 * way of representing ephemerides
 * 
 * Publicly-available ephemerides for most satellites are 
 * kept and updated at www.space-track.org
 * 
 */

import { sgp4init, sgp4, getgravconst } from './sgp4.js'


export default class TLE {

    /**
     * 
     * Construct TLE from lines. This accepts as input the traditional
     * 2-line TLE, or the 3-line version with the first line identifying
     * the name of the satellite
     * 
     * @constructor
     * @param {*} lines Array of lines representing the TLE, or 1st line 
     * @param {*} tline2 If lines passed in 1 at a time, this is the 2nd line
     * @param {*} tline3 If lines passed in 1 at a time, this 3rd line
     */
    constructor(lines, tline2, tline3) {
        // Figure out the input format
        if (Array.isArray(lines) == false) {
            if (typeof line3 === 'undefined') {
                lines = [lines, tline2]
            }
            else {
                lines = [lines, tline2, tline3]
            }
        }
        this.raw = lines

        // Get the two key lines
        let line1 = ''
        let line2 = ''

        // Check if the 1st line is the name
        // (sometimes omitted)
        if (lines.length == 3) {
            if (lines[0].substring(0, 1) === '0') {
                this.name = lines[0].substring(2)
            }
            else {
                this.name = lines[0]
            }
            line1 = lines[1]
            line2 = lines[2]
        }
        else {
            line1 = lines[0]
            line2 = lines[1]
            this.name = 'unknown'
        }

        // Parse the TLE
        this.satid = Number(line1.substr(2, 5))
        this.launch_year = Number(line1.substr(9, 2))
        if (this.launch_year > 50)
            this.launch_year += 1900
        else
            this.launch_year += 2000
        this.launch_number = Number(line1.substr(11, 3))
        this.launch_piece = line1.substr(14, 3)
        let epoch_year = Number(line1.substr(18, 2))
        if (epoch_year > 57)
            epoch_year += 1900
        else
            epoch_year += 2000
        let epoch_day_of_year = Number(line1.substr(20, 12))
        this.epoch = new Date(Date.UTC(epoch_year, 0, 1))
        this.epoch.setTime(this.epoch.getTime() + (epoch_day_of_year - 1) * 86400 * 1000)
        this.mean_motion_dot = Number(line1.substr(33, 10))
        this.mean_motion_dot_dot = Number(line1.substr(45, 7).replace('-', 'E-'))
        if (line1.substr(44, 1) === '-')
            this.mean_motion_dot_dot = -this.mean_motion_dot_dot
        this.bstar = Number('0.' + line1.substr(54, 7)
            .replace('-', 'E-')
            .replace('+', 'E+'))
        this.elsetnum = Number(line1.substr(64, 4))

        this.inclination = Number(line2.substr(8, 8))
        this.raan = Number(line2.substr(17, 8))
        this.eccen = Number('0.' + line2.substr(26, 7))
        this.arg_of_perigee = Number(line2.substr(34, 8))
        this.mean_anomaly = Number(line2.substr(43, 8))
        this.mean_motion = Number(line2.substr(52, 11))
        this.revnum = Number(line2.substr(63, 5))


    }

    /**
     * 
     * SGP4 propagator computes position and velocity of satellite at given
     * time in the TEME coordinate frame given input TLE ephemerides
     * 
     * @param {*} thedate Date for which to compute position and velocity
     * @param {*} whichconst Earth parameter values, 'wgs84' or 'wgs72'.  If ommited, 'wgs84' is default
     * @returns {dict} Dictionary with 'r' member indicating position in meters in TEME frame and 'v' member indicating velocity in meters / second in TEME frame
     * 
     */
    sgp4(thedate, whichconst) {

        // Use wgs-84 Earth parameters by default
        // (other option is 'wgs72')
        if (typeof whichconst == 'undefined')
            whichconst = 'wgs84'

        // Do we need to initialize "satrec"?
        // yes if this is first time running with this tle
        if (typeof this.satrec === 'undefined') {
            this.satrec = {}
            getgravconst(whichconst, this.satrec)
            const twopi = Math.PI * 2.0
            const deg2rad = Math.PI / 180.0

            this.satrec.no = this.mean_motion / (1440 / twopi)
            this.satrec.no_kozai = this.satrec.no
            this.satrec.bstar = this.bstar
            this.satrec.a = Math.pow(this.satrec.no * this.satrec.tumin,
                -2.0 / 3.0)
            this.satrec.ndot = this.mean_motion_dot / (1440 * 1440 / twopi)
            this.satrec.nddot = this.mean_motion_dot_dot / (1440 * 1440 * 1440 / twopi)
            this.satrec.inclo = this.inclination * deg2rad
            this.satrec.nodeo = this.raan * deg2rad
            this.satrec.argpo = this.arg_of_perigee * deg2rad
            this.satrec.mo = this.mean_anomaly * deg2rad
            this.satrec.ecco = this.eccen
            this.satrec.alta = this.satrec.a * (1.0 - this.satrec.ecco) - 1.0
            this.satrec.altp = this.satrec.a * (1.0 + this.satrec.ecco) - 1.0
            this.satrec.jdsatepoch = this.epoch.jd(Date.timescale.UTC)
            this.satrec.init = 'y'
            this.satrec.t = 0.0

            // Initialize SGP4
            sgp4init(whichconst, 'i',
                this.satid, this.satrec.jdsatepoch - 2433281.5,
                this.satrec.bstar, this.satrec.ndot, this.satrec.nddot,
                this.satrec.ecco, this.satrec.argpo, this.satrec.inclo,
                this.satrec.mo, this.satrec.no, this.satrec.nodeo, this.satrec)

        }

        // Time since TLE epoch, in minutes
        let tsince = (thedate.jd(Date.timescale.UTC) - this.satrec.jdsatepoch) * 1440.0

        // Call low-level SGP-4 funciton
        let results = sgp4(this.satrec, tsince)
        return results
    }

}
