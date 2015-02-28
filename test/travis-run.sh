#!/bin/bash
set -ev
grunt
npm run test-travis
#if [ "${TRAVIS_SECURE_ENV_VARS}" = "true" ]; then
  se-interpreter test/selenium/interpreter_config.json
#fi

