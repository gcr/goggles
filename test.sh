#!/bin/sh

[ -x test/lib/vows/bin/vows ] || git submodule init && git submodule update

NODE_PATH=test/lib/eyes/lib/ ./test/lib/vows/bin/vows
