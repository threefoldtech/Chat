#/bin/bash

FILE=/appdata/yggdrasil.conf
if test -f "$FILE"; then
    echo "$FILE already exists."
    exec yggdrasil -useconffile $FILE -logto /var/log/yggdrasil/yggdrasil.log >> /var/log/yggdrasil/yggdrasil.log &
fi

nginx

cd /backend
pm2 start dist/migrator/migrator.js &
pm2 start dist/src/index.js &


tail -f /dev/null