import React from "react";

import Box from "@mui/material/Box";
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

const RunTabDT = (props) => {
  const dtStart = props.currentRun.start.DT;
  const dtStop = props.currentRun.info.status === 'finished' ? props.currentRun.stop.DT : undefined

  const renderDTTable = (dt) => {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", m: 2 }}>
        {
          isHistoryURLDefined(props.setup) ? 
            <Button
              href={historyURL(
                props.setup,
                "Default",
                "Temperature",
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
        {dt.modules.map((mod) => (
          <TableContainer sx={{ m: 1 }} key={v4()}>
            <Table sx={{ width: 4 / 5 }} size="small">
              <TableHead>
                <TableRow>
                  <TableCell style={{ width: 100 }}>{"sensor"}</TableCell>
                  <TableCell style={{ width: 100 }} align="right">
                    {"value"}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mod.channels.map((ch) => (
                  <TableRow key={ch.number}>
                    <TableCell component="th" scope="row">
                      {ch.name}
                    </TableCell>
                    <TableCell align="right">
                      {ch.value} {ch.unit}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ))}
      </Box>
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
      <RunBorSection>{dtStart && renderDTTable(dtStart)}</RunBorSection>
      {props.currentRun.info.status === 'finished' && <RunEorSection>{dtStop && renderDTTable(dtStop)}</RunEorSection>}
    </Box>
  );
};

export default RunTabDT;
