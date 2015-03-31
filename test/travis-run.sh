#!/bin/bash
set -ev
gulp dist
npm run test-travis
gulp serve:dist &
se-interpreter test/selenium/interpreter_config_public.json
if [ "${TRAVIS_SECURE_ENV_VARS}" = "true" ]; then
  se-interpreter --hideSetTexValue true test/selenium/interpreter_config_private.json
fi

