#/bin/bash

FILE=/etc/yggdrasil.conf
if test -f "$FILE"; then
    echo "$FILE already exists."
else
    yggdrasil -genconf > /etc/yggdrasil.conf
    echo "Generated a new yggdrasil conf file $FILE ."
fi

exec yggdrasil -useconffile /etc/yggdrasil.conf -logto /var/log/yggdrasil/yggdrasil.log >> /var/log/yggdrasil/yggdrasil.log &
nginx

cd /backend && yarn && yarn serve &
cd /frontend && yarn && yarn serve &


tail -f /dev/null