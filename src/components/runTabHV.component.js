import React from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import BarChartIcon from "@mui/icons-material/BarChart";
import { v4 } from 'uuid'

import RunBorSection from "./runBorSection.component";
import RunEorSection from "./runEorSection.component";
import historyURL from "../utils/mhistory";
import isHistoryURLDefined from "../utils/mhistory";

function getMetricByName(name, data) {
  var found = null;

  for (var i = 0; i < data.length; i++) {
    var element = data[i];

    if (element.name.includes(name)) {
      found = element;
    }
  }
  return found;
}

function renderChannelStatus(ch) {
  let statusValue = getMetricByName('Status', ch.metrics).value.trim().toLowerCase();
  let statusStyle, rowStyle, cellStyle;

  if (statusValue === 'on') {
    statusValue = statusValue.toUpperCase();
    rowStyle = {background:'lightgreen'}
    statusStyle = {color: 'green', fontWeight: 'bold'}
  } else if (statusValue === 'off') {
    statusValue = statusValue.toUpperCase();
    statusStyle = {color: 'red', fontWeight: 'bold'}
  } else if (statusValue === 'externaldisable') {
    statusStyle = {color: 'gray'}
    cellStyle = {color: 'gray'}
  }

  return (
  <TableRow key={ch.name} sx={rowStyle}>
    <TableCell component="th" scope="row" sx={cellStyle}>
      {ch.name}
    </TableCell>
    <TableCell align="right" sx={cellStyle}>
      {parseFloat(getMetricByName('V0', ch.metrics).value).toFixed(2)}
      {" "}
      {getMetricByName('V0', ch.metrics).unit}
    </TableCell>
    <TableCell align="right" sx={cellStyle}>
      {parseFloat(getMetricByName('VMon', ch.metrics).value).toFixed(2)}
      {" "}
      {getMetricByName('VMon', ch.metrics).unit}
    </TableCell>
    <TableCell align="right" sx={cellStyle}>
      {parseFloat(getMetricByName('I0', ch.metrics).value).toFixed(2)}
      {" "}
      {getMetricByName('I0', ch.metrics).unit}
    </TableCell>
    <TableCell align="right" sx={cellStyle}>
      {parseFloat(getMetricByName('IMon', ch.metrics).value).toFixed(2)}
      {" "}
      {getMetricByName('IMon', ch.metrics).unit}
    </TableCell>
    <TableCell align="right" sx={statusStyle}>
      {statusValue}
    </TableCell>
  </TableRow>
  );
};

const RunTabHV = (props) => {
  const hvStart = props.currentRun.start.HV;
  const hvStop =
    props.currentRun.info.status === "finished"
      ? props.currentRun.stop.HV
      : undefined;

  const renderHVTable = (hv) => {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", m: 2 }}>
        {
          isHistoryURLDefined(props.setup) ? 
            <Button
              href={historyURL(
                props.setup,
                "Voltages",
                "HV",
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
        {hv.modules.map((mod) => (
          <TableContainer sx={{ m: 1 }} key={v4()}>
            <Typography variant="h6" fontWeight="bold" sx={{ m: 1 }}>
              {mod.name} - {mod.description}
            </Typography>
            <Table sx={{ width: 4.5 / 5 }} size="small">
              <TableHead>
                <TableRow>
                  <TableCell style={{ width: 100 }}>{"channel name"}</TableCell>
                  <TableCell style={{ width: 100 }} align="right">
                    {"Vset"}
                  </TableCell>
                  <TableCell style={{ width: 100 }} align="right">
                    {"Vmon"}
                  </TableCell>
                  <TableCell style={{ width: 100 }} align="right">
                    {"Ilimit"}
                  </TableCell>
                  <TableCell style={{ width: 100 }} align="right">
                    {"Imon"}
                  </TableCell>
                  <TableCell style={{ width: 100 }} align="right">
                    {"status"}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mod.channels.map((ch) => (
                  <>
                    {renderChannelStatus(ch)}
                  </>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ))
        }
      </Box >
    );
  };

  return (
    // main container
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        boxShadow: 2,
        borderRadius: 1,
        bgcolor: "background.paper",
      }}
    >
      <RunBorSection>{hvStart && renderHVTable(hvStart)}</RunBorSection>
      {props.currentRun.info.status === "finished" && (
        <RunEorSection>{hvStop && renderHVTable(hvStop)}</RunEorSection>
      )}
    </Box>
  );
};

export default RunTabHV;
