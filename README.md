# Getting Started DS-Proto RunViewer

The run viewer extracts information from the midas ODB and stores it in a MySQL database. A web interface allows the user to view the information.

## Site/setup explanation

The plan for the UK is to have one site host the database and webserver.  All the other sites will send information about their runs to this central site.

The central site will need to have node/npm and a MySQL server installed. A single database will store the info from all sites.

The other sites only need to run the `rvprovider.py` script at the start/end of each run.

## Pre-requisites

### Python

Python 3.7 or higher is needed. Run `python3 --version` to see what version you currently have. On Ubuntu 20.04 you can install python3.8 from apt.

For python, we need `python-dotenv`, `mysql-connector-python` and `lz4`. Install using pip, e.g. `python3.8 -m pip install python-dotenv mysql-connector-python lz4 --user`.

We also need access to the midas python client. See https://daq00.triumf.ca/MidasWiki/index.php/Python.

### Node/npm

NodeJS > v10.0 is required. Try installing via apt/yum first, then run `node --version` to see what version you have. 

On Ubuntu 20.04 only v8.10 is available via apt, and the binaries from the Node website weren't compatible, so I had to do a manual compilation as a last resort:

```
# Last resort! Hopefully you can get node via apt/yum instead!
cd ~/packages
wget https://nodejs.org/dist/v18.15.0/node-v18.15.0.tar.gz
./configure --prefix=~/packages/node-v18.15.0-linux-x64
make -j4
make install
export PATH=~/packages/node-v18.15.0-linux-x64/bin:$PATH
# Add to .bashrc as well!

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

### Installing this package

node/npm need to know about this package.

```
mkdir ~/node
npm config set prefix=$HOME/node

cd ~/packages/dsproto-runviewer
npm link
npm install
export REACT_APP_BASEURL="/runviewer”
```

### Creating the database/user/table

This assumes you have installed the MySQL server and started the mysqld service. Connect to MySQL as and enter the `<new_mysql_root_password>` you specified in the `ALTER USER` statement previously.

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

### Configuration

Create a file called `.env` in the root directory of this package. See `.env.sample` for an example.

The parameters need for the central server are:
* `DBHOST` - Database host name. Possibly `localhost`.
* `DBUSER` - Probably `runviewer`.
* `DBPASS` - Whatever you used in the `CREATE USER` command.
* `DBNAME` - Should be `ds`.
* `RUNDIR` - Where midas data files are stored.
* `RUNDIR_USES_SUBDIRS` - Should be `0` unless running at Napoli (where it should be `1`).
* `RUNNUMWIDTH` - Probably `5`. If midas file names look like `run00123.mid.lz4` then the "run number" is being stored as a 5-digit number. If it looks like `run000123.mid.lz4` then use `6` etc.

## Start the application

We should now have everything we need to start the server!

Run these commands from the root directory of this package:

```
npm run build:prod
npm run start:prod
```

The second of these should tell you that the server is running on port 4000.

Navigate to http://localhost:4000/runviewer and you should hopefully see a webpage. Check the terminal to see if any errors are reported.

If your firewall prevents access to port 4000 from the outside world, you may need to set up a "real" webserver (e.g. apache/nginx) and proxy to localhost:4000. At TRIUMF we use `ProxyPass /runviewer http://localhost:4000/runviewer retry=1` in apache.

## Populating the database

### Automatically adding each run

Midas can run a script at the start/end of each run. In the ODB, set keys like:

```
# The exact commands to execute vary based on your version of python and where you installed this package!
odbedit -c 'set "/Programs/Execute on start run" "python3.8 ~/packages/dsproto-runviewer/infoprovider/rvprovider.py --setup Liverpool --sync"'
odbedit -c 'set "/Programs/Execute on stop run"  "python3.8 ~/packages/dsproto-runviewer/infoprovider/rvprovider.py --setup Liverpool --sync"'
```

This will extract ODB information from the live experiment and add it to the database.

The full list of available site/setup names in in `sites.json`.

### Adding missing runs via midas files

If you have some missing runs, you can manually run the `rvprovider.py` script:

```
python3.8 ~/packages/dsproto-runviewer/infoprovider/rvprovider.py --setup Liverpool --run 900
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

