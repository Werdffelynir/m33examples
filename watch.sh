#!/usr/bin/bash

LOC_HOST="localhost"
LOC_PORT="8024"
LOC_DEBUG_PORT="9222"


chromium http://$LOC_HOST:$LOC_PORT \
  --user-data-dir="/home/werd/chromium-profile-dev" \
  --auto-open-devtools-for-tabs \
  --unsafely-disable-devtools-self-xss-warnings \
  & php -S $LOC_HOST:$LOC_PORT


# --ignore-gpu-blacklist \
# --enable-gpu \
# --enable-native-gpu-memory-buffers \
# --max-texture-size=16384 \
# --force-gpu-mem-available-mb=2048 \
# --incognito \
# --new-window \

