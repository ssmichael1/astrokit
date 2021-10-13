#include <string>
#include <array>

#include <stdint.h>
#include <math.h>
#include <string.h>

#include <SGP4.h>
#include <time.h>

// 3-vector
using Vec3 = std::array<double, 3>;

// Satellite state, position & velocity
using StateType = std::pair<Vec3, Vec3>;

#if defined(_TEST_)
#include <iostream>
#include <iomanip>
#endif

// trim from start (in place)
static inline void ltrim(std::string &s)
{
    s.erase(s.begin(),
            std::find_if_not(s.begin(), s.end(),
                             (int (*)(int))std::isspace));
}

// trim from end (in place)
static inline void rtrim(std::string &s)
{
    s.erase(std::find_if_not(s.rbegin(), s.rend(),
                             (int (*)(int))std::isspace)
                .base(),
            s.end());
}

// trim from both ends (in place)
static inline void trim(std::string &s)
{
    rtrim(s);
    ltrim(s);
}

class TLE
{
public:
    TLE(const std::string &input_line0,
        const std::string &input_line1,
        const std::string &input_line2 = "")
        : name_("undefined"), need_reinit_(true)
    {
        // Handle both two-line elements sets
        // and three-line versions, where 1st line is the name
        std::string line0 = "", line1, line2;
        if (input_line2 == "")
        {
            line1 = input_line0;
            line2 = input_line1;
        }
        else
        {
            line0 = input_line0;
            line1 = input_line1;
            line2 = input_line2;
            name_ = line0;
            if (name_[0] == '0')
                name_ = name_.substr(2);
        }

        // Parse the TLE
        sat_num_ = atoi(line1.substr(2, 5).c_str());
        desig_year_ = atoi(line1.substr(9, 2).c_str());
        desig_launch_ = atoi(line1.substr(11, 3).c_str());
        desig_piece_ = line1.substr(14, 3);
        intl_desig_ = line1.substr(9, 8);
        trim(intl_desig_);
        int year = atoi(line1.substr(18, 2).c_str());
        if (year > 57)
            year += 1900;
        else
            year += 2000;

        std::tm tm{};
        tm.tm_year = year - 1900;
        tm.tm_mon = 0;
        tm.tm_mday = 0;
        tm.tm_hour = 0;
        tm.tm_min = 0;
        // start of year, convert to seconds since Jan 1 1970
        time_t tt = ::timegm(&tm);
        // Note: day of year is 1-based in Time constructor,
        // just like the TLE format
        double dayOfYear = atof(line1.substr(20, 12).c_str());
        // 2440587.5 = JD for Jan 1, 1970 UTC
        // day of year is one based, so must subtract 1
        jd_epoch_ = ((double)tt / 86400.0) + dayOfYear - 1 + 2440587.5;

        std::string s = std::string("0") + line1.substr(34, 9);
        mean_motion_dot_ = atof(s.c_str());
        if (line1.substr(33, 1) == std::string("-"))
            mean_motion_dot_ = -mean_motion_dot_;

        s = std::string("0.") + line1.substr(45, 5);
        std::string s2 = line1.substr(50, 3);
        s = s + std::string("E") + s2;
        mean_motion_dot_dot_ = atof(s.c_str());
        if (line1.substr(44, 1) == std::string("-"))
            mean_motion_dot_dot_ = -mean_motion_dot_dot_;

        s = std::string("0.") + line1.substr(54, 5);
        s2 = line1.substr(59, 3);
        s = s + std::string("E") + s2;
        bstar_ = atof(s.c_str());
        if (line1.substr(53, 1) == std::string("-"))
            bstar_ = -bstar_;

        ephem_type_ = atoi(line1.substr(62, 1).c_str());
        element_num_ = atoi(line1.substr(64, 4).c_str());

        inclination_ = atof(line2.substr(8, 8).c_str());
        raan_ = atof(line2.substr(17, 8).c_str());
        s = std::string("0.") + line2.substr(26, 7);
        eccen_ = atof(s.c_str());

        arg_of_perigee_ = atof(line2.substr(34, 8).c_str());
        mean_anomaly_ = atof(line2.substr(43, 8).c_str());
        mean_motion_ = atof(line2.substr(52, 11).c_str());
        rev_num_ = (int)atof(line2.substr(63, 5).c_str());
    }

    StateType sgp4(double jd, std::string gravconst = "wgs84")
    {
        gravconsttype gc = wgs84;
        if (gravconst == "wgs72")
            gc = wgs72;

        if (need_reinit_)
        {

            double tumin, mu, radiusearthkm, xke, j2, j3, j4, j3oj2;
            SGP4Funcs::getgravconst(gc, tumin, mu,
                                    radiusearthkm, xke, j2, j3, j4, j3oj2);
            memset((void *)&rec_, 0, sizeof(elsetrec));
            rec_.no_kozai = mean_motion_ / (1440.0 / (2.0 * M_PI));
            rec_.bstar = bstar_;
            rec_.a = ::pow(rec_.no_kozai * tumin, (-2.0 / 3.0));
            rec_.ndot = mean_motion_dot_ / (1440.0 * 1440.0 / 2.0 / M_PI);
            rec_.nddot =
                mean_motion_dot_dot_ / (1440.0 * 1440.0 * 1440.0 / 2.0 / M_PI);
            rec_.inclo = inclination_ * M_PI / 180.0;
            rec_.nodeo = raan_ * M_PI / 180.0;
            rec_.argpo = arg_of_perigee_ * M_PI / 180.0;
            rec_.mo = mean_anomaly_ * M_PI / 180.0;
            rec_.ecco = eccen_;
            rec_.alta = rec_.a * (1.0 + rec_.ecco) - 1.0;
            rec_.altp = rec_.a * (1.0 - rec_.ecco) - 1.0;
            rec_.jdsatepoch = jd_epoch_;

            //satrec->jdsatepoch = m_epoch.toJD(Time::SCALE_UTC);

            char opsmode = 'i';
            SGP4Funcs::sgp4init(gc, opsmode, name_.substr(0, 9).c_str(),
                                jd_epoch_ = 2433281.5, rec_.bstar,
                                rec_.ndot, rec_.nddot,
                                rec_.ecco, rec_.argpo,
                                rec_.inclo, rec_.mo, rec_.no_kozai,
                                rec_.nodeo, rec_);
            need_reinit_ = false;
        } // done initializing

        double t_since = (jd - rec_.jdsatepoch) * 1440;
        double r[3] = {0, 0, 0};
        double v[3] = {0, 0, 0};
        bool success = SGP4Funcs::sgp4(rec_, t_since, r, v);
        StateType state;
        for (int i = 0; i < 3; i++)
        {
            state.first[i] = r[i] * 1.0e3;
            state.second[i] = v[i] * 1.0e3;
        }
        return state;
    }

    double jd_epoch(void) const { return jd_epoch_; }
    double inclination(void) const { return inclination_; }
    double eccentricity(void) const { return eccen_; };
    double bstar(void) const { return bstar_; }
    double mean_motion(void) const { return mean_motion_; }
    double mean_motion_dot(void) const { return mean_motion_dot_; }
    double mean_motion_dot_dot(void) const { return mean_motion_dot_dot_; }
    double raan(void) const { return raan_; }
    double arg_of_perigee(void) const { return arg_of_perigee_; }
    double mean_anomaly(void) const { return mean_anomaly_; }
    int rev_num(void) const { return rev_num_; }
    std::string name(void) const { return name_; }
    int sat_num(void) const { return sat_num_; }

protected:
    std::string name_;
    int sat_num_;
    int desig_year_;
    int desig_launch_;
    std::string desig_piece_;
    std::string intl_desig_;
    double jd_epoch_;
    double mean_motion_dot_;
    double mean_motion_dot_dot_;
    double bstar_;
    uint8_t ephem_type_;
    int element_num_;
    double eccen_;
    double inclination_;
    double raan_;
    double arg_of_perigee_;
    double mean_anomaly_;
    double mean_motion_;
    int rev_num_;
    bool need_reinit_;

    elsetrec rec_;
};
