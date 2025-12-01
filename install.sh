#/bin/bash

service=$(cat prismatic.service)
directory=`pwd`
index=$(echo "$directory/backend/index.js")
user=$(echo "root")
node=$(which node)

result=$(echo "$service" | sed "s|USER|$user|g")
result=$(echo "$result" | sed "s|NODE|$node|g")
content=$(echo "$result" | sed "s|INDEX|$index|g")

sudo sh -c "echo '$content' > /lib/systemd/system/prismatic.service"
sudo systemctl daemon-reload
sudo systemctl start prismatic
sudo systemctl enable prismatic
sudo systemctl status prismatic
