#!/usr/bin/env python3

import os
import re
import sys
import time
import datetime
import argparse
import midas.client
import midas.file_reader
import json
from dotenv import load_dotenv

import config.odb_summary
import config.sites

if __name__ == "__main__":
    load_dotenv()
    site_list = config.sites.SiteList()

    parser = argparse.ArgumentParser(description="DS Proto MIDAS RunViewer information provider")
    parser.add_argument('--setup', action='store', help='Site name', choices=site_list.get_site_names(), required=True)
    parser.add_argument('--dump', action='store_true', help='dump json to screen without store it on database')
    parser.add_argument('--sync', action='store_true', help='synchronize with state transition')
    parser.add_argument('--run', action='store', type=int, help='run number')
    parser.add_argument('--force', action='store_true', help='force delete of run in database before insert')
    parser.add_argument('--host', action='store', type=str, help='MIDAS hostname')
    parser.add_argument('--expt', action='store', type=str, help='MIDAS experiment name')
    parser.add_argument('--verbose', action='store_true', help='print additional info on screen')
    parser.add_argument('--use-api', action='store_true', help="Use a remote webserver API rather than direct database access")
    args = parser.parse_args()

    sys.dont_write_bytecode = True

    setup_id = site_list.name_to_number(args.setup)

    # fetch whole ODB tree from file or online ODB
    if args.run:
        run = str(args.run).zfill(int(os.getenv('RUNNUMWIDTH')))
        rundir = os.getenv(f"RUNDIR")

        if os.getenv("RUNDIR_USES_SUBDIRS"):
            rundir += f"/run{run}"
            
        print('I: fetch ODB from run file')
        try:
            flist = os.listdir(rundir)
        except:
            print(f'E: directory {rundir} does not exist')
            sys.exit(-1)

        if len(flist) == 0:
            print(f'E: directory {rundir} is empty')
            sys.exit(-1)

        startFile = stopFile = None
        fdict = {}      # key is subrun
        for f in flist:
            if f.startswith(f'run{run}') and f.find(".mid") != -1 and f.find("crc32") == -1:
                mlist = re.findall('\d+', f)
                if len(mlist) > 1:
                    subrun = int(mlist[1])
                else:
                    subrun = f
                fdict[subrun] = f
        sortedSubrun = sorted(fdict.keys())
        startFile = fdict[sortedSubrun[0]] 
        stopFile = fdict[sortedSubrun[-1]]

        if startFile is None or stopFile is None:
            print(f'E: startFile or stopFile not found for run {args.run}')
            sys.exit(-1)

        print(f'I: startFile: {startFile}, stopFile: {stopFile}')

        startOdb = stopOdb = None
        # start file
        mfile = midas.file_reader.MidasFile(f'{rundir}/{startFile}')
        startOdb = mfile.get_bor_odb_dump().data

        # stop file
        mfile = midas.file_reader.MidasFile(f'{rundir}/{stopFile}')
        stopOdb = mfile.get_eor_odb_dump().data

        if startOdb is None and stopOdb is None:
            print("E: no BOR/EOR ODB found")
            sys.exit(-1)
        else:
            odbSource = 'FILE'
            if(args.verbose):
                print(startOdb)
                print(stopOdb)
    else:
        odbSource = 'ONLINE'
        print('I: fetch ODB from online')
        try:
            mclient = midas.client.MidasClient("rvprovider", host_name=args.host, expt_name=args.expt)
        except Exception as e:
            print(f'E: {e}')
            sys.exit(-1)

        if args.sync:
            # wait DAQ status is running/stopped... to prevent collection of stale informations
            time.sleep(1)
            nloop = 0
            while True:
                if mclient.odb_get('/System/Transition/status') == 1:
                    break
                if nloop < 15:
                    time.sleep(1)
                else:
                    print(f'E: timeout waiting run state')
                    sys.exit(-1)

        odb = mclient.odb_get('/')
        mclient.disconnect()

    summary = {}
    if odbSource == 'ONLINE':
        summary = config.odb_summary.getSummary(odb)
    elif odbSource == 'FILE':
        summaryStart = config.odb_summary.getSummary(startOdb)
        summaryStop = config.odb_summary.getSummary(stopOdb)

    if odbSource == 'ONLINE':
        runNumber = summary["RI"]["runNumber"]
    elif odbSource == 'FILE':
        runNumber = summaryStart["RI"]["runNumber"]
        # check if stopTimestamp exists... (due to erase of last sub file)
        if 'stopTimestamp' not in summaryStop["RI"]:
            summaryStop["RI"]["stopTime"] = time.ctime(stopOdb['System']['Buffers']['SYSTEM']['Size/key']['last_written'])
            summaryStop["RI"]["stopTimestamp"] = stopOdb['System']['Buffers']['SYSTEM']['Size/key']['last_written']
            durationSec = summaryStop["RI"]["stopTimestamp"] - summaryStart["RI"]["startTimestamp"]
            durationStr = str(datetime.timedelta(seconds=durationSec))
            summaryStop["RI"]["duration"] = durationStr
            # mark the run as 'not complete': status = 'aborted'
            summaryStop["RI"]["partialRun"] = True

    if args.dump:
        jsonDoc = {}
        if odbSource == 'FILE':
            summary['START'] = summaryStart
            summary['STOP'] = summaryStop
        jsonDoc = json.dumps(summary, indent=2)
        print(jsonDoc)
        sys.exit(0)

    if args.use_api:
        # POST data to remote webserver API
        import requests
        import requests.auth

        payload = {"setup": setup_id, "run": runNumber, "odbsource": odbSource}
        if args.force:
            payload["force"] = True
        if odbSource == 'ONLINE':
            payload["odb"] = json.dumps(summary)
        elif odbSource == 'FILE':
            payload["odbstart"] = json.dumps(summaryStart)
            payload["odbend"] = json.dumps(summaryStop)
    
        url = os.getenv('API_URL')

        if os.getenv('API_USER') is not None:
            auth = requests.auth.HTTPBasicAuth(os.getenv('API_USER'), os.getenv('API_PASS'))
        else:
            auth = None

        headers = {'Content-Type': 'application/json'}

        req = requests.post(url, data=json.dumps(payload), auth=auth, headers=headers)

        if req.status_code != 200:
            print(f"E: failed to submit run {runNumber}: code {req.status_code}: {req.text}")
        else:
            print(f"I: run {runNumber} - info added/updated")

    else:
        # Direct DB access
        from db.rundb import RunDb

        db = RunDb(os.getenv('DBHOST'), os.getenv('DBUSER'), os.getenv('DBPASS'), os.getenv('DBNAME'))

        if odbSource == 'ONLINE':
            if db.hasRun(setup_id, runNumber):
                # update stop summary
                db.updateStopField(setup_id, runNumber, json.dumps(summary))
            else:
                # update start summary
                db.updateStartField(setup_id, runNumber, json.dumps(summary))
        elif odbSource == 'FILE':
            if db.hasRun(setup_id, runNumber):
                if args.force:
                    db.delete(setup_id, runNumber)
                    print(f"I: run {runNumber} already in db - removed")
                else:
                    print(f"I: run {runNumber} already in db - no action executed")
                    sys.exit(0)
            db.updateStartField(setup_id, runNumber, json.dumps(summaryStart))
            db.updateStopField(setup_id, runNumber, json.dumps(summaryStop))
            print(f"I: run {runNumber} - info added/updated")

