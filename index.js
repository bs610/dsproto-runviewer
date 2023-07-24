const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config();

const db = mysql.createPool({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASS,
  database: process.env.DBNAME,
});

const app = express();
const port = 4000;

const sites = require("./src/sites.json")

app.use(express.json());

const runapp = express.Router();

// get total number of channels 
const getChannelsNum = (bd) => {
  let num = 0
  bd.modules.map((mod) => {
    num += mod.channels.length
  });
  return num
}

const getLastRunNumber = async (setup) => {
  result = await db.query(
    "SELECT * FROM params WHERE setup = ? ORDER BY run DESC LIMIT 1",
    [setup],
    (err, result) => {
      if (err) {
        console.log(err);
      }
    })
  return (result[0][0].run)
}

const buildSummary = (result, startId, length) => {
  let summary = [];
  let status = "";
  let eventsSent = "-";
  let channelsNum = 0;

  result.map((obj, index) => {
    let doc = {};
    if (obj["jsonstop"] === null) {
      // run not finished yet or aborted
      doc = JSON.parse(obj["jsonstart"]);
      if (index === 0) status = "in progress";
      else status = "aborted";
    } else {
      doc = JSON.parse(obj["jsonstop"]);
      try {
        eventsSent = parseInt(doc["BD"]["eventsSent"])
      } catch {
        eventsSent = "-";
      }
      status = "finished";
    }
    // set total number of channels
    let doc2 = JSON.parse(obj["jsonstart"]);
    doc2["BD"] && (channelsNum = getChannelsNum(doc2["BD"]))
    let summaryItem = {
      id: length - (index + startId) - 1,
      status,
      eventsSent,
      channelsNum,
    };

    doc.RI && (summaryItem.runNumber = doc.RI.runNumber)
    doc.RI && (summaryItem.startTime = doc.RI.startTime)
    doc.RI && (summaryItem.stopTime = doc.RI.stopTime)
    doc.RI && (summaryItem.duration = doc.RI.duration)
    doc.LI && (summaryItem.writeData = doc.LI.writeData)
    doc.SI && (summaryItem.shifter = doc.SI.shifter);
    doc.SI && (summaryItem.runType = doc.SI.runType);
    doc.SQ && (summaryItem.loopCounter = doc.SQ.loopCounter);
    doc.SQ && (summaryItem.loopLimit = doc.SQ.loopLimit);

    summary.push(summaryItem);
  });
  return summary
}

const buildRun = async (result) => {

  let runItem = [];
  let runDoc = {};
  let runStatus = undefined;
  let runStart = JSON.parse(result["jsonstart"]);
  let runStop = JSON.parse(result["jsonstop"]);
  let runInfo = {};

  lastRunNumber = await getLastRunNumber(result.setup);

  if (runStop != null) {
    runStatus = "finished";
  } else {
    if (runStart.RI.runNumber === lastRunNumber) {
      runStatus = "in progress";
    } else runStatus = "aborted";
  }

  // for finished run use runStop info
  if (runStatus === "finished") {
    runInfo = {
      ...runStop["RI"],
      ...runStop["SQ"],
      ...runStop["SI"],
      ...runStop["LI"],
      status: runStatus,
    };
    delete runStart["RI"];
    delete runStart["SQ"];
    delete runStart["SI"];
    delete runStart["LI"];
    delete runStop["RI"];
    delete runStop["SQ"];
    delete runStop["SI"];
    delete runStop["LI"];
  } else {
    // for in-progress or aborted run use runStart info
    runInfo = {
      ...runStart["RI"],
      ...runStart["SQ"],
      ...runStart["SI"],
      ...runStart["LI"],
      status: runStatus,
    };
    delete runStart["RI"];
    delete runStart["SQ"];
    delete runStart["SI"];
    delete runStart["LI"];
  }

  // compose response
  runDoc["info"] = runInfo;
  runDoc["start"] = runStart;
  runDoc["stop"] = runStop;
  runItem.push(runDoc);

  return (runItem)
}

// Route to get runs summary from a setup with (optional) page and limit
// example: /api/2/summary    (get runs summary of setup 2)
runapp.get("/api/:setup/summary", (req, res) => {
  const setup = parseInt(req.params.setup);

  if (isNaN(setup)) {
    res.send([]);
  } else {
    let { page, limit } = req.query;
    let queryType = 'paged'       // queryType : paged || bulk

    if ((!page) && (!limit))
      queryType = 'bulk'
    else {
      if (!page) page = 1;
      if (!limit) limit = 15;
    }

    db.query(
      "SELECT * FROM params WHERE setup = ? ORDER BY run DESC",
      setup,
      (err, result) => {
        if (err) {
          console.log(err);
        }
      }).then((result) => {
        let summary = {}
        length = result[0].length;

        if (queryType == 'paged') {
          let startId = (page - 1) * limit;
          let endId = page * limit;
          summary = buildSummary(result[0].slice(startId, endId), startId, length)
        } else {    // queryType = 'bulk'
          summary = buildSummary(result[0], 0, length)
        }
        
        res.send({ data: summary, total: length });
      });
  }
});

// Route to get one run from a setup by run number
// example: /api/2/run/1988    (get run 1988 of setup 2)
runapp.get("/api/:setup/run/:run", (req, res) => {
  const setup = parseInt(req.params.setup);
  const run = parseInt(req.params.run);

  if (isNaN(setup) || isNaN(run)) {
    res.send([]);
  } else {
    // get run by setup and run number
    db.query(
      "SELECT * FROM params WHERE setup = ? AND run = ?",
      [setup, run],
      (err, result) => {
        if (err) {
          console.log(err);
        }
      }
    ).then((result) => {
      if (result[0].length == 0)
        res.send([])
      else
        buildRun(result[0][0]).then((result) => res.send(result));
    });
  }
});

// Route to get one run from a setup by position
// example: /api/2/id/120     (get run in position 120 of setup 2)
runapp.get("/api/:setup/id/:id", (req, res) => {
  const setup = parseInt(req.params.setup);
  const id = parseInt(req.params.id);

  let query = `SELECT * FROM params WHERE setup = ${setup} ORDER BY run ASC LIMIT 1`;
  if (id > 0)
    query = query + ` OFFSET ${id}`

  if (isNaN(setup) || isNaN(id)) {
    res.send([]);
  } else {
    db.query(
      query,
      [],
      (err, result) => {
        if (err) {
          console.log(err);
        }
      }
    ).then((result) => {
      if (result[0].length == 0)
        res.send([])
      else
        buildRun(result[0][0]).then((result) => res.send(result));
    });
  }

});


// Route to add a run to the database. Uses POST fields
runapp.post("/api/add", (req, res) => {
  // Already JSON-decoded
  let data = req.body;

  if (!data.hasOwnProperty("run")) {
    res.status(400).json({"error": "run parameter is missing. " + data});
    return;
  }
  if (!data.hasOwnProperty("setup")) {
    res.status(400).json({"error": "setup parameter is missing"});
    return;
  }
  if (!data.hasOwnProperty("odbsource")) {
    res.status(400).json({"error": "odbsource parameter was missing"});
    return;
  }
  if (data.odbsource !== "ONLINE" && data.odbsource !== "FILE") {
    res.status(400).json({"error": "odbsource parameter should be ONLINE or FILE"});
    return;
  }
  if (data.odbsource === "ONLINE" && !data.hasOwnProperty("odb")) {
    res.status(400).json({"error": "odb parameter must be present for odbsource=ONLINE"});
    return;
  }
  if (data.odbsource === "FILE" && (!data.hasOwnProperty("odbstart") || !data.hasOwnProperty("odbend"))) {
    res.status(400).json({"error": "odbstart and odbend parameters must be present for odbsource=FILE"});
    return;
  }

  db.query(
    "SELECT COUNT(*) FROM params WHERE setup=? AND run=?",
    [data.setup, data.run],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(400).json({"error": "failed to check if run already exists"});
      }
    }
  ).then((result) => {
    let run_exists = result[0][0] > 0;

    let query = null;
    let values = [];
  
    if (data.odbsource === "ONLINE") {
      if (run_exists) {
        query = "UPDATE params SET jsonstop=? WHERE setup=? AND run=?";
        values = [data.odb, data.setup, data.run];
      } else {
        query = "INSERT INTO params SET setup=?, run=?, jsonstart=?";
        values = [data.setup, data.run, data.odb];
      }
    } else {
      // FILE
      if (!run_exists || (data.hasOwnProperty("force") && data.force)) {
        query = "INSERT INTO params SET setup=?, run=?, jsonstart=?, jsonstop=?";
        values = [data.setup, data.run, data.odbstart, data.odbend];
      }
    }

    if (query === null) {
      res.status(200).json({"ok": "no work to do"});
      return;
    }

    db.query(
      query,
      values,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(400).json({"error": "failed to insert/update run"});
          return;
        }
      }
    ).then((result) => {
      res.status(200).json({"ok": "run updated"});
      return;
    });
  
  });

});

runapp.use(express.static(path.join(__dirname, ".", "build")));
runapp.use(express.static("public"));
runapp.use((req, res, next) => {
  res.sendFile(path.join(__dirname, ".", "build", "index.html"));
});

app.use(process.env.REACT_APP_BASEURL, runapp);

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on ${port}`);
});
