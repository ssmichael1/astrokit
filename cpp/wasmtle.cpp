#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>

#include <tle.hpp>

#include <functional>
#include <memory>

using namespace emscripten;

static StateType sgp4_at_time(TLE &tle, const val &input)
{
    double jd = tle.jd_epoch();
    auto input_type = input.typeOf().as<std::string>();
    if (input_type == "number")
    {
        jd = input.as<double>();
    }
    else if (input_type == "object")
    {
        if (input["valueOf"].typeOf().as<std::string>() != "function")
        {
            throw std::runtime_error("Invalid input type");
        }
        // TLEs take as in put a UTC julian date ... that makes conversion simple
        jd = input.call<double>("valueOf") / 86400000.0 + 2440587.5;
    }
    else
    {
        throw std::runtime_error("Invalid input type");
    }
    return tle.sgp4(jd);
}

static val sgp4_wrapper(TLE &tle, const val &input)
{
    if (input.isArray())
    {
        auto sz = input["length"].as<size_t>();
        auto r_all = val::array();
        auto v_all = val::array();
        for (size_t i = 0; i < sz; i++)
        {
            std::array<double, 3> r = {1, 1, 1};
            std::array<double, 3> v = {2, 2, 2};

            auto state = sgp4_at_time(tle, input[i]);

            r_all.call<void>("push", val::array(state.first.begin(), state.first.end()));
            v_all.call<void>("push", val::array(state.second.begin(), state.second.end()));
        }
        auto obj = val::object();
        obj.set("r", r_all);
        obj.set("v", v_all);
        return std::move(obj);
    }
    else
    {
        auto state = sgp4_at_time(tle, input);
        auto obj = val::object();
        obj.set("r", val::array(state.first.begin(), state.first.end()));
        obj.set("v", val::array(state.second.begin(), state.second.end()));
        return std::move(obj);
    }
}

static std::shared_ptr<TLE> tle_constructor(const val &input,
                                            const val &input1 = val::null(),
                                            const val &input2 = val::null())
{
    if (input.isArray())
    {
        std::vector<std::string> v = vecFromJSArray<std::string>(input);
        if (v.size() == 2)
        {
            //return new TLE(v[0], v[1]);
            return std::make_shared<TLE>(v[0], v[1]);
        }
        else if (v.size() == 3)
        {
            //return new TLE(v[0], v[1], v[2]);
            return std::make_shared<TLE>(v[0], v[1], v[2]);
        }
        else
        {
            throw std::runtime_error("Invalid array size");
        }
    }
    else if (input.isString())
    {
        auto s0 = input.as<std::string>();
        std::string s1 = input1.as<std::string>();
        std::string s2 = "";
        if (input2.isString())
            s2 = input2.as<std::string>();
        //return new TLE(s0, s1, s2);
        return std::make_shared<TLE>(s0, s1, s2);
    }
    else
    {
        throw std::runtime_error("Invalid inputs");
    }
}

EMSCRIPTEN_BINDINGS(wasmsgp4)
{
    using namespace std::placeholders; // for _1, _2, _3...

    class_<TLE>("wasmtle")
        .smart_ptr<std::shared_ptr<TLE>>("wasmtle")
        .constructor(std::function<std::shared_ptr<TLE>(val)>(std::bind(tle_constructor, _1, val::null(), val::null())))
        .constructor(std::function<std::shared_ptr<TLE>(const val &, const val &)>(std::bind(tle_constructor, _1, _2, val::null())))
        .constructor(&tle_constructor, allow_raw_pointers())
        .function("sgp4", &sgp4_wrapper)
        .property("inclination", &TLE::inclination)
        .property("eccentricity", &TLE::eccentricity)
        .property("mean_motion", &TLE::mean_motion)
        .property("mean_motion_dot", &TLE::mean_motion_dot)
        .property("mean_motion_dot_dot", &TLE::mean_motion_dot_dot)
        .property("mean_anomaly", &TLE::mean_anomaly)
        .property("rev_num", &TLE::rev_num)
        .property("sat_num", &TLE::sat_num)
        .property("bstar", &TLE::bstar)
        .property("raan", &TLE::raan)
        .property("arg_of_perigee", &TLE::arg_of_perigee)
        .property("jd_epoch", &TLE::jd_epoch)
        .property("unixtime_epoch",
                  std::function<double(const TLE &)>(
                      [](const TLE &tle)
                      {
                          auto jd = tle.jd_epoch();
                          return (jd - 2440587.5) * 86400.0;
                      }));
}
