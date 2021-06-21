#/bin/bash

FILE=/appdata/yggdrasil.conf
if test -f "$FILE"; then
    echo "$FILE already exists."
    exec yggdrasil -useconffile $FILE -logto /var/log/yggdrasil/yggdrasil.log >> /var/log/yggdrasil/yggdrasil.log &
fi

#nginx

cd /publisher && npm install && node server.js &
#cd /frontend && yarn && yarn dev &


tail -f /dev/null