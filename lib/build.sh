#!/bin/bash

set -e

optimise=''
sanitise=''

while getopts 'os' flag; do
  case "${flag}" in
    o) optimise='true' ;;
    s) sanitise='true' ;;
  esac
done

export OPTIMISE=''
export SANITISE=''

if [[ $optimise ]]; then
  OPTIMISE=-Os
fi

if [[ $sanitise ]]; then
  SANITISE="-s INITIAL_MEMORY=655360000 -fsanitize=address -g2 debug.c"
fi

(
  emcc \
    -I ./triangle \
    -s MODULARIZE=1 \
    -s EXPORTED_RUNTIME_METHODS="['lengthBytesUTF8', 'stringToUTF8']" \
    -s EXPORTED_FUNCTIONS="['_malloc', '_free', '_triangulate']" \
    -o triangle.out.js \
    ${OPTIMISE} \
    ${SANITISE} \
    ./triangle/triangle.c -DTRILIBRARY
)

# Usage:
# ./build.sh -o
