import React from "react";
import { NavLink } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import { makeStyles, withStyles } from "@material-ui/core";

import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

// states
import { viewState } from "../state/atoms";
import setupName from "../utils/setupname";

const useStyles = makeStyles((theme) => ({
  root: {
    height: "50px",
    "& .MuiToolbar-regular": {
      minHeight: "50px",
    },
  },
}));

const AppBarButton = withStyles(theme => ({
  root: {
    color: 'white'
  }
}))(Button);

const SwitchSetupButton = (props) => {
  const setView = useSetRecoilState(viewState)

  return (
    <AppBarButton
            sx={{ display: "flex", justifyContent: "center", width: 0.5 / 5, p: 1 }}
            component={NavLink}
            to={"/runs"}
            color="inherit"
            onClick={() => setView((old) => ({...old, setup: props.new_setup}))}
          >
            {setupName(props.new_setup)}
          </AppBarButton>
  );
};

const AppToolBar = () => {
  const classes = useStyles();
  const sites = require("../sites.json")

  return (
    <Box>
      <AppBar className={classes.root} sx={{ display: "flex", flexDirection: "row", width: 5 / 5, color: "white" }} position="static">
        <Toolbar sx={{ display: "flex", flexDirection: "row", width: 5 / 5, bgcolor: 'primary.dark', color: "white" }}>
          <Typography variant="h6" sx={{ display: "flex", justifyContent: "center", width: 0.5 / 5, color: 'white' }}>Run Viewer</Typography>
          
          {sites.map((site)=>{
            return <SwitchSetupButton new_setup={`${site.id}`} />;
          })}
          
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default AppToolBar;
