/*
 * (c) 2021 Steven Michael (ssmichael@gmail.com)
 *
 * Extensions to the date class to handle conversion
 * to Julian dates and modified Julian dates, as well as
 * handle conversion between different time scales
 *
*/

import * as eop from './earth_orientation_parameters.js'

type timescale = 'UTC' | 'TT' | 'TAI' | 'GPS' | "UT1";

export enum TimeScale {
    UTC = "UTC",
    TT = "TT",
    TAI = "TAI",
    GPS = "GPS",
    UT1 = "UT1"
}

declare global {
    interface Date {
        mjd: (ts?: timescale) => number;
        jd: (ts?: timescale) => number;
    }

}


// Julian date at given time scale (Default is UTC)
Date.prototype.jd = function (ts?: timescale) {
    let timeshift_seconds = 0
    if (ts == undefined) {
        ts = 'UTC'
    }
    else if (ts == TimeScale.TAI) {
        timeshift_seconds = utc2tai(this)
    }
    else if (ts == TimeScale.UT1) {
        timeshift_seconds = eop.get(this)?.dut1 || 0
    }
    else if (ts == 'TT') {
        timeshift_seconds = utc2tai(this) + 32.184
    }
    else if (ts == 'GPS') {
        const utcgps0 = new Date(Date.UTC(1980, 0, 6))
        if (this > utcgps0)
            timeshift_seconds = utc2tai(this) - 19
    }
    return ((this.valueOf() + timeshift_seconds * 1000) / 86400000)
        + 2440587.5
}


// Modified julian date at given time scale (Default is UTC)
Date.prototype.mjd = function (ts?: timescale): number {
    return this.jd(ts) - 2400000.5
}
// Difference between TAI and UTC
// See Table 3.1, Explanatory Supplement to the Astronomical Almanac
// (page 87)
interface deltaattype {
    'time': number,
    'dt': (x: Date) => number;
}

const deltaAT: Array<deltaattype> = [
    // 1961-01-01T00:00:00.000Z
    {
        'time': -283996800000,
        'dt': (x: Date) => (1.422828 + 0.001296 * (x.mjd() - 37300))
    },
    // 1961-08-01T00:00:00.000Z
    { 'time': -265680000000, 'dt': (x: Date) => (1.372818 + 0.001296 * (x.mjd() - 37300)) },
    // 1962-01-01T00:00:00.000Z
    {
        'time': -252460800000,
        'dt': (x: Date) => (1.845858 + 0.0011232 * (x.mjd() - 37665))
    },
    // 1963-11-01T00:00:00.000Z
    {
        'time': -194659200000,
        'dt': (x: Date) => (1.945858 + 0.0011232 * (x.mjd() - 37665))
    },
    // 1964-01-01T00:00:00.000Z
    {
        'time': -189388800000,
        'dt': (x: Date) => (3.240130 + 0.001296 * (x.mjd() - 38395))
    },
    // 1964-04-01T00:00:00.000Z
    {
        'time': -181526400000,
        'dt': (x: Date) => (3.340130 + 0.001296 * (x.mjd() - 38486))
    },
    // 1964-09-01T00:00:00.000Z
    {
        'time': -168307200000,
        'dt': (x: Date) => (3.440130 + 0.001296 * (x.mjd() - 38639))
    },
    // 1965-01-01T00:00:00.000Z
    {
        'time': -157766400000,
        'dt': (x: Date) => (3.540130 + 0.001296 * (x.mjd() - 38761))
    },
    // 1965-03-01T00:00:00.000Z
    {
        'time': -152668800000,
        'dt': (x: Date) => (3.640130 + 0.001296 * (x.mjd() - 38820))
    },
    // 1965-07-01T00:00:00.000Z
    {
        'time': -142128000000,
        'dt': (x: Date) => (3.740130 + 0.001296 * (x.mjd() - 38942))
    },
    // 1965-09-01T00:00:00.000Z
    {
        'time': -136771200000,
        'dt': (x: Date) => (3.840130 + 0.001296 * (x.mjd() - 39004))
    },
    // 1966-01-01T00:00:00.000Z
    {
        'time': -126230400000,
        'dt': (x: Date) => (4.313170 + 0.002592 * (x.mjd() - 39126))
    },
    // 1968-02-01T00:00:00.000Z
    {
        'time': -60480000000,
        'dt': (x: Date) => (4.213170 + 0.002592 * (x.mjd() - 39126))
    },
    // 1972-01-01T00:00:00.000Z
    { 'time': 63072000000, 'dt': () => 10 },
    // 1972-07-01T00:00:00.000Z
    { 'time': 78796800000, 'dt': () => 11 },
    // 1973-01-01T00:00:00.000Z
    { 'time': 94694400000, 'dt': () => 12 },
    // 1974-01-01T00:00:00.000Z
    { 'time': 126230400000, 'dt': () => 13 },
    // 1975-01-01T00:00:00.000Z
    { 'time': 157766400000, 'dt': () => 14 },
    // 1976-01-01T00:00:00.000Z
    { 'time': 189302400000, 'dt': () => 15 },
    // 1977-01-01T00:00:00.000Z
    { 'time': 220924800000, 'dt': () => 16 },
    // 1978-01-01T00:00:00.000Z
    { 'time': 252460800000, 'dt': () => 17 },
    // 1979-01-01T00:00:00.000Z
    { 'time': 283996800000, 'dt': () => 18 },
    // 1980-01-01T00:00:00.000Z
    { 'time': 315532800000, 'dt': () => 19 },
    // 1981-07-01T00:00:00.000Z
    { 'time': 362793600000, 'dt': () => 20 },
    // 1982-06-01T00:00:00.000Z
    { 'time': 391737600000, 'dt': () => 21 },
    // 1983-07-01T00:00:00.000Z
    { 'time': 425865600000, 'dt': () => 22 },
    // 1985-07-01T00:00:00.000Z
    { 'time': 489024000000, 'dt': () => 23 },
    // 1988-01-01T00:00:00.000Z
    { 'time': 567993600000, 'dt': () => 24 },
    // 1990-01-01T00:00:00.000Z
    { 'time': 631152000000, 'dt': () => 25 },
    // 1991-01-01T00:00:00.000Z
    { 'time': 662688000000, 'dt': () => 26 },
    // 1992-07-01T00:00:00.000Z
    { 'time': 709948800000, 'dt': () => 27 },
    // 1993-07-01T00:00:00.000Z
    { 'time': 741484800000, 'dt': () => 28 },
    // 1994-07-01T00:00:00.000Z
    { 'time': 773020800000, 'dt': () => 29 },
    // 1996-01-01T00:00:00.000Z
    { 'time': 820454400000, 'dt': () => 30 },
    // 1997-07-01T00:00:00.000Z
    { 'time': 867715200000, 'dt': () => 31 },
    // 1999-01-01T00:00:00.000Z
    { 'time': 915148800000, 'dt': () => 32 },
    // 2006-01-01T00:00:00.000Z
    { 'time': 1136073600000, 'dt': () => 33 },
    // 2009-01-01T00:00:00.000Z
    { 'time': 1230768000000, 'dt': () => 34 },
    // 2012-07-01T00:00:00.000Z
    { 'time': 1341100800000, 'dt': () => 35 },
    // 2015-07-01T00:00:00.000Z
    { 'time': 1435708800000, 'dt': () => 36 },
    // 2017-01-01T00:00:00.000Z
    { 'time': 1483228800000, 'dt': () => 37 }
]

// Compute time difference between UTC & TAI at the given time
let utc2tai = (t: Date): number => {
    let idx = deltaAT.findIndex((x) => x.time > t.valueOf())
    if (idx > 0)
        return deltaAT[idx - 1].dt(t)
    else
        return 0
}

export const jd2Date = function (jdUTC: number): Date {

    return new Date((jdUTC - 2440587.5) * 86400 * 1000)
}






