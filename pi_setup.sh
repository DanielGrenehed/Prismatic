#/bin/bash

sudo apt install sqlite3 libsqlite3-dev sqlcipher libsqlcipher-dev
export LDFLAGS="-L/usr/local/lib"
export CPPFLAGS="-I/usr/local/include -I/usr/local/include/sqlcipher"
export CXXFLAGS="$CPPFLAGS"
npm install sqlite3 --build-from-source --sqlite_libname=sqlcipher --sqlite=/usr/local --verbose

node -e 'require("sqlite3")'
npm install
