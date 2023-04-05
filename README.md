# Getting Started DS-Proto RunViewer

The run viewer extracts information from the midas ODB and stores it in a MySQL database. A web interface allows the user to view the information.

## Setup 1 / setup 2

The runviewer was initially created for the Napoli test facility, which has 2 DAQ setups. Setup 1 used V1725 digitizers, while setup 2 used VX2740 digitizers.

The UK test facilities use VX2740/VX2745 digitizers, so are most similar to Napoli setup 2. We can hide the "setup 1" buttons from the UI using a configuration option (see below), but you will still need to refer to "setup 2" in some of the admin scripts.

## Pre-requisites

### Python

Python 3.7 or higher is needed.

For python, we need `python-dotenv`, `mysql-connector-python` and `lz4`. E.g. `python3.8 -m pip install python-dotenv mysql-connector-python lz4 --user`.

We also need access to the midas python client. See https://daq00.triumf.ca/MidasWiki/index.php/Python.

### Node/npm

NodeJS > 10.0 is required. Hopefully this is already available via apt/yum.

Ubuntu 20.04 comes with NodeJS v8 and required manual compilation:

```
cd ~/packages
wget https://nodejs.org/dist/v18.15.0/node-v18.15.0.tar.gz
./configure --prefix=~/packages/node-v18.15.0-linux-x64
make -j4
make install
export PATH=~/packages/node-v18.15.0-linux-x64/bin:$PATH
# Add to .bashrc as well!

```

After installing node and npm, you can install this package and dependencies.

```
mkdir ~/node
npm config set prefix=$HOME/node

cd ~/packages/dsproto-runviewer
npm link
npm install
export REACT_APP_BASEURL="/runviewer”
# Add to .bashrc as well
```

### MySQL

MySQL is required. Hopefully you can just install it via apt/yum:

```
sudo apt install mysql-client mysql-server default-libmysqlclient-dev
sudo mysqld_safe --user mysql --skip-grant-tables --skip-networking
```

Then in another tab connect to MySQL and set the root password:

```
mysql -u root
```

In the MySQL interface:

```
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY '<new_mysql_root_password>’;
<Ctrl-D>
```

Then:
* Kill the `mysqld_safe` process.
* `sudo systemctl enable mysql`
* `sudo systemctl start mysql`


## Database schema

A MySQL database is required. Installing the MySQL server depends on your OS and is not documented here. After installing MySQL and starting the server, run the following commands as the MySQL root user:

```
mysql -uroot -p
```

In the MySQL interface:

```
CREATE DATABASE ds;
USE ds;
CREATE USER 'runviewer'@'%' IDENTIFIED BY '<password>’;
GRANT SELECT,INSERT,UPDATE,DELETE,CREATE,INDEX,ALTER,REFERENCES,TRIGGER ON ds.* TO 'runviewer'@'%';
CREATE TABLE `params` ( `id` int(11) NOT NULL AUTO_INCREMENT,  `setup` int(11) NOT NULL,  `run` int(11) NOT NULL,  `jsonstart` mediumtext,  `jsonstop` mediumtext,  PRIMARY KEY (`id`));
```

## Configuration

Create a file called `.env` in the root directory of this package. See `.env.sample` for an example.

The parameters are:
* `DBHOST` - Database host name. Possibly `localhost`.
* `DBUSER` - Probably `runviewer`.
* `DBPASS` - Whatever you used in the `CREATE USER` command.
* `DBNAME` - Should be `ds`.
* `RUNDIR1` - Where midas data files are stored for "setup 1".
* `RUNDIR2` - Where midas data files are stored for "setup 2".
* `RUNDIR_USES_SUBDIRS` - Should be `0` unless running at Napoli (where it should be `1`).
* `RUNNUMWIDTH` - Probably `5`. If midas file names look like `run00123.mid.lz4` then the "run number" is being stored as a 5-digit number. If it looks like `run000123.mid.lz4` then use `6` etc.
* `REACT_APP_SHOWSETUP1` - Whether to show "setup 1" in the web display. `0` for UK facilities, `1` for Napoli.
* `REACT_APP_SHOWSETUP2` - Whether to show "setup 2" in the web display. `1` for all facilities.
* `REACT_APP_SETUP1NAME` - Human-readable name of "setup 1". Blank for UK facilities.
* `REACT_APP_SETUP2NAME` - Human-readable name of "setup 1". E.g. `Liverpool` for Liverpool facility.
* `REACT_APP_HISTORYURL1` - URL of midas webpage for "setup 1". Blank for UK facilities.
* `REACT_APP_HISTORYURL2` - URL of midas webpage for "setup 2".

## Populating the database

### Automatically adding each run

Midas can run a script at the start/end of each run. In the ODB, set keys like:

* `/Programs/Execute on start run` to `python3.8 ~/packages/dsproto-runviewer/infoprovider/rvprovider.py --setup 2 --sync` or similar.
* `/Programs/Execute on stop run` to `python3.8 ~/packages/dsproto-runviewer/infoprovider/rvprovider.py --setup 2 --sync` or similar.

The exact command varies based on your version of python and where you installed this package. This will extract ODB information from the live experiment and add it to the database.

### Adding missing runs via midas files

If you have some missing runs, you can manually run the `rvprovider.py` script:

```
python3.8 ~/packages/dsproto-runviewer/infoprovider/rvprovider.py --setup 2 --run 900
```

This will find the midas file for run #900, extract the relevant ODB information, and add it to the database.

## Available scripts for web display

### Development

In development mode backend runs on port 4000 and frontend runs on port 4040.
`REACT_APP_BASEURL` must be set to '' (nothing)

To start backend
```
npm run start:be:dev
```

To start frontend
```
npm run start:fe:dev
```

### Production

In production mode backend and frontend run both on port 4000.
REACT_APP_BASEURL must be set to '/runviewer'

To build frontend:
```
npm run build:prod
```

To run frontend:
```
npm run start:prod
```

### Note

Recent Node releases require this environment variable:
```
export NODE_OPTIONS=--openssl-legacy-provider
```

### Startup script with supervisord

```
user=vdaq
environment=PATH="$PATH:/opt/node/bin",REACT_APP_BASEURL="/runviewer"
directory=/opt/dsproto-runviewer
command=node index.js
stdout_logfile=/var/log/runviewer-stdout.log
stdout_logfile_maxbytes=1MB
stdout_logfile_backups=5
stderr_logfile=/var/log/runviewer-stderr.log
stderr_logfile_maxbytes=1MB
stderr_logfile_backups=5
autorestart=true
startsecs=5
```

