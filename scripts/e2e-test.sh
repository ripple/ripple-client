#!/bin/bash

BASE_DIR=`dirname $0`
echo ""
echo "Starting e2e test suite"

$BASE_DIR/../node_modules/protractor/bin/protractor $BASE_DIR/../test/protractor.conf.js %*
echo "e2e test suite complete"
