import React from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import LinearProgress from "@mui/material/LinearProgress";
import Button from "@mui/material/Button";
import BarChartIcon from "@mui/icons-material/BarChart";

import historyURL from "../utils/mhistory";
import isHistoryURLDefined from "../utils/mhistory";

const RunTabRI = (props) => {
  const renderListItem = (name, value) => {
    return (
      <ListItem disablePadding>
        <ListItemText
          sx={{ width: 1.5 / 5, p: 1, mr: 1, bgcolor: "#eee", borderRadius: 1 }}
          primary={name}
        />
        <ListItemText
          sx={{ width: 3.5 / 5, p: 1, ml: 1, bgcolor: "#eee", borderRadius: 1 }}
          primary={value}
        />
      </ListItem>
    );
  };

  const convertBytes = function (bytes) {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

    if (bytes === 0) {
      return "n/a";
    }

    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));

    if (i === 0) {
      return bytes + " " + sizes[i];
    }

    return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
  };

  if (Object.keys(props.currentRun).length === 0) {
    return <LinearProgress />;
  }

  return (
    // main container
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        boxShadow: 2,
        borderRadius: 1,
        bgcolor: "background.paper",
      }}
    >
      {/* top container */}
      <Box
        sx={{
          width: 5 / 5,
          display: "flex",
          flexDirection: "row",
          m: 1,
        }}
      >
        {/* run details box */}
        <Box sx={{ width: 3 / 5 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ m: 1 }}>
            Run details
          </Typography>
          <List
            dense
            sx={{
              ml: 5,
              mr: 5,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {renderListItem("run number", props.currentRun.info.runNumber)}
            {renderListItem("status", props.currentRun.info.status)}
            {renderListItem("start time", props.currentRun.info.startTime)}
            {renderListItem("stop time", props.currentRun.info.stopTime)}
            {renderListItem("duration", props.currentRun.info.duration)}
            {props.currentRun.info.loopCounter &&
              renderListItem(
                "sequencer counter",
                props.currentRun.info.loopCounter
              )}
            {props.currentRun.info.loopLimit &&
              renderListItem(
                "sequencer limit",
                props.currentRun.info.loopLimit
              )}
          </List>
        </Box>
        {/* run events box */}
        <Box sx={{ width: 2.5 / 5 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ m: 1 }}>
            Events
          </Typography>
          {
            isHistoryURLDefined(props.setup) ?
              <Button
                sx={{ display: "flex", width: 4.5 / 5, ml: 5, mr: 5 }}
                href={historyURL(
                  props.setup,
                  "Default",
                  "Trigger rate",
                  props.currentRun.info.startTimestamp,
                  props.currentRun.info.stopTimestamp
                )}
                target="_blank"
                variant="contained"
                endIcon={<BarChartIcon />}
              >
                History Plot
              </Button>
            : null
          }
          <List
            dense
            sx={{
              ml: 5,
              mr: 5,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {renderListItem(
              "data written",
              props.currentRun.info.writeData.toString()
            )}
            {props.currentRun.info.status === "finished" &&
              props.currentRun.info.writeData &&
              renderListItem(
                "events written (total)",
                props.currentRun.info.eventsWritten
              )}
            {props.currentRun.info.status === "finished" &&
              props.currentRun.stop.BD &&
              renderListItem(
                "events from digitizers",
                props.currentRun.stop.BD.eventsSent
              )}
            {props.currentRun.info.status === "finished" &&
              props.currentRun.info.writeData &&
              renderListItem(
                "bytes written",
                convertBytes(props.currentRun.info.bytesWritten)
              )}
            {props.currentRun.info.status === "finished" &&
              props.currentRun.info.writeData &&
              renderListItem(
                "disk level",
                parseInt(props.currentRun.info.diskLevel * 100) + "%"
              )}
          </List>
        </Box>
      </Box>
      {/* bottom container */}
      <Box
        sx={{
          width: 5 / 5,
          display: "flex",
          flexDirection: "row",
          m: 1,
        }}
      >
        {/* shift info box */}
        <Box sx={{ width: 5 / 5 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ m: 1 }}>
            Shift info
          </Typography>
          <List
            dense
            sx={{
              ml: 5,
              mr: 5,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {props.currentRun.info.runDescription &&
              renderListItem(
                "run description (sequencer)",
                props.currentRun.info.runDescription
              )}
            {renderListItem("shifter", props.currentRun.info.shifter)}
            {renderListItem("type", props.currentRun.info.runType)}
            {renderListItem("comment", props.currentRun.info.comment)}
            {renderListItem("light level", props.currentRun.info.lightLevel)}
          </List>
        </Box>
      </Box>
    </Box>
  );
};

export default RunTabRI;
