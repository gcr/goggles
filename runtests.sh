#!/bin/sh

[ -x test/lib/vows/bin/vows ] || git submodule init && git submodule update

if [ $1 = '--spec' ]; then
    shift
    SPEC='--spec'
fi

if [ -z "$*" ]; then
    FILES="./test/*-test.js"
else
    FILES=$*
fi

NODE_PATH=test/lib/eyes/lib/ ./test/lib/vows/bin/vows $SPEC $FILES
