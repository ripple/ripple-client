#!/bin/bash
set -v

# Wait for Connect to be ready before exiting
while [ ! -f "$TRAVIS_BUILD_DIR/test/sauce/sc-launcher-readyfile.tmp" ]; do
  sleep .5
done
