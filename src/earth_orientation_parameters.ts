export interface RecordType {
    mjd: number,
    pmx: number,
    pmy: number,
    lod: number,
    dut1: number
}

export const fileURL =
    'https://datacenter.iers.org/data/latestVersion/finals.all.iau2000.txt'

export const loadFromRawString = (raw: string): Array<RecordType> => {
    return raw.split(/\r\n|\r|\n/).map((line) => {
        return {
            mjd: Number(line.slice(7, 15)),
            pmx: Number(line.slice(18, 27)),
            pmy: Number(line.slice(37, 46)),
            lod: Number(line.slice(79, 86)),
            dut1: Number(line.slice(58, 68))
        }
    })
}

