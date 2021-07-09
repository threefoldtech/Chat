#/bin/bash

FILE=/appdata/yggdrasil.conf
if test -f "$FILE"; then
    echo "$FILE already exists."
    exec yggdrasil -useconffile $FILE -logto /var/log/yggdrasil/yggdrasil.log >> /var/log/yggdrasil/yggdrasil.log &
fi

cd /publisher && yarn && PORT=80 node server.js &
#cd /backend
#yarn
#yarn run migrate
#if [ $? -eq 0 ]
#then
#  yarn dev &
#  cd /frontend && yarn && yarn dev &
#else
#  echo "Migrations failed"
#  mv /var/tmp/error-nginx.conf /etc/nginx/conf.d/default.conf
#fi


tail -f /dev/null