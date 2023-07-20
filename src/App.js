import React from "react";
import { Routes, Route } from "react-router-dom";
import Box from "@mui/material/Box";
import "./App.css";

import RunList from "./components/runList.component";
import RunInfo from "./components/runInfo.component";
import RunInfoProvider from "./components/runInfoProvider.component";

// layouts
import RootLayout from "./layouts/RootLayout";

// pages
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

const App = () => {
  const site_list = require('./sites.json');

  return (
    <Box sx={{
      width: 5 / 5,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignSelf: "center",
    }}>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="runs">
            <Route index element={<RunList />} />
            <Route path="info" element={<RunInfo />} />
            <Route path={"get/:setup/:run"} element={<RunInfoProvider />} />
          </Route>

          {site_list.map((site)=>{
            return <Route path={`${site.name}`} element={<RunList setup={`${site.id}`} />} />;
          })}

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Box>
  );
};

export default App;
