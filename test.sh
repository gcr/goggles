#!/bin/sh

[ -x tests/lib/vows/bin/vows ] || git submodule init && git submodule update

NODE_PATH=tests/lib/eyes/lib/ ./tests/lib/vows/bin/vows
