#!/bin/bash

if [[ -f "HofBox.tar.gz" ]]; then
	rm HofBox.tar.gz
fi
cp ./build/linux/Dockerfile /tmp/portainer-builds/linux-arm64
sed -i "s/COPY dest.*/COPY portainer \\//g" /tmp/portainer-builds/linux-arm64/Dockerfile

LDIR=${PWD}
cd /tmp/portainer-builds/linux-arm64
tar -zcf $LDIR/HofBox.tar.gz ./

echo "Use 'tar -zxvf HofBox.tar.gz && docker build -t hofbox:latest .' to unpack the archive and build the image."
