#!bin/bash

envsubst < /tmp/config.js.template > /tmp/config.js

exec nginx -g "daemon off;"
