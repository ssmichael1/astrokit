cmake_minimum_required(VERSION 3.1)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_INCLUDE_CURRENT_DIR ON)

project(wasmsgp4 CXX)

add_executable(wasmsgp4 SGP4.cpp wasmtle.cpp tle.hpp)
#target_compile_options(wasmsgp4 PRIVATE "-fPIC -O2")
set_target_properties(wasmsgp4 PROPERTIES
    LINK_FLAGS "--bind -s WASM=1"  )
# set_target_properties(wasmsgp4 PROPERTIES SUFFIX ".mjs")


