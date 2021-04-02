#/bin/bash

FILE=/etc/yggdrasil.conf
if test -f "$FILE"; then
    echo "$FILE already exists."
else
    yggdrasil -genconf > /etc/yggdrasil.conf
    echo "Generated a new yggdrasil conf file $FILE ."
fi

sed -i 's;Peers: \[\];Peers: \["tls://\[2a02:1802:5e:0:18d2:e2ff:fe44:17d2\]:9944", "tcp://212.129.52.193:39565", "tcp://94.130.203.208:5999", "tcp://85.17.15.221:35239", "tcp://104.248.15.125:31337", "tcp://\[2604:a880:800:c1::2c2:a001\]:31337"\];g' /etc/yggdrasil.conf
echo "Replaced the peers in the configuration."

exec yggdrasil -useconffile /etc/yggdrasil.conf -logto /var/log/yggdrasil/yggdrasil.log >> /var/log/yggdrasil/yggdrasil.log &

nginx

cd /backend 
pm2 start dist/src/index.js &


tail -f /dev/null