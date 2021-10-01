#include <emscripten.h>
#include <emscripten/bind.h>

#include <tle.hpp>

#include <functional>

using namespace emscripten;

float testit(void)
{
    return 3.0f;
}

EMSCRIPTEN_BINDINGS(wasmsgp4)
{

    class_<TLE>("wasmtle")
        .constructor<std::string, std::string, std::string>()
        .function("sgp4", &TLE::sgp4);

    function("test", testit);
};

#if defined(_TEST_)

int main(int argc, char *argv[])
{
    std::string line0 = "0 ISS(ZARYA)";
    std::string line1 =
        "1 25544U 98067A   21267.21567994  .00001839  00000-0  42318-4 0  9994";
    std::string line2 =
        "2 25544  51.6435 213.0833 0003460  47.4035  50.6925 15.48430119303944";

    TLE tle(line0, line1, line2);
    std::pair<Vec3, Vec3> results = tle.sgp4(tle.jd_epoch());
    std::cout << std::setprecision(12);
    std::cout << results.first[0] << " " << results.first[1] << " " << results.first[2] << std::endl;
}

#endif