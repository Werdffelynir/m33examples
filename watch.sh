#!/usr/bin/bash

LOC_HOST="localhost"
LOC_PORT="8024"
LOC_DEBUG_PORT="9222"


chromium http://$LOC_HOST:$LOC_PORT \
  --user-data-dir="/home/werd/chromium-profile-dev" \
  --auto-open-devtools-for-tabs \
  --unsafely-disable-devtools-self-xss-warnings \
  & php -S $LOC_HOST:$LOC_PORT


# --enable-gpu \
# --enable-native-gpu-memory-buffers \
# --ignore-gpu-blacklist \
# --max-texture-size=16384 \
# --force-gpu-mem-available-mb=2048 \
# --incognito \
# --new-window \


ln -s "/var/app/m33/src" "/var/app/m33examples/m33"
