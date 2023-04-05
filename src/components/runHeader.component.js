import React, { useEffect, useState } from "react";
import { useRecoilValue } from "recoil";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

// states
import { viewState } from "../state/atoms";
import setupName from "../utils/setupname";

const RunHeader = () => {

  const view = useRecoilValue(viewState);
  const [title, setTitle] = useState(null)

  useEffect(() => {
    
    if (view.runNumber) {
      setTitle(`${setupName(view.setup)} / run: ${view.runNumber}`)
    } else {
      setTitle(`${setupName(view.setup)}`)
    }
  }, [view.setup, view.runNumber])

  return (
    <Box
      sx={{
        width: 5 / 5,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          width: 1 / 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          alignSelf: "center",
          borderRadius: 1,
          color: "white",
          bgcolor: "primary.dark",
          p: 1,
          m: 1
        }}
      >
        <Typography sx={{ fontSize: 16 }} variant='button'>{title}</Typography>
      </Box>
    </Box>
  );
}

export default RunHeader;
