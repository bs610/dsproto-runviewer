function setupName(setup) {
   var setupStr;

   if (setup === "1") {
     setupStr = process.env.REACT_APP_SETUP1NAME || `SETUP - ${setup}`;
   } else {
     setupStr = process.env.REACT_APP_SETUP2NAME || `SETUP - ${setup}`;
   }

   return setupStr;
}

export default setupName
