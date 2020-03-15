#!/bin/bash
set -e

node="yarn --silent node"
jestArgs=()

if [ "$TEST_DEBUG" ]; then
  node="$node --inspect-brk"
  if [ "$TEST_PORT" ]; then
    node="$node=$TEST_PORT"
  fi
  jestArgs+=("--runInBand")
fi


if [ -n "$CI" ]; then
  jestArgs+=("--maxWorkers=4")
  jestArgs+=("--ci")
fi

if [ -n "$TEST_GREP" ]; then
  jestArgs+=("-t")
  jestArgs+=("$TEST_GREP")
fi

if [ -n "$TEST_ONLY" ]; then
  jestArgs+=("(packages|codemods|eslint)/.*$TEST_ONLY.*/test")
fi

$node node_modules/.bin/jest "${jestArgs[@]}"
