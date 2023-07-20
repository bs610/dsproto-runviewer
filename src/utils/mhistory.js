function getBaseURL(setup) {
   var baseURL = '';
   const sites = require("../sites.json");
   let i_setup = parseInt(setup);

   for (let i = 0; i < sites.length; i++) {
      if (sites[i].id === i_setup) {
         baseURL = sites[i].history_url;
         break;
      }
   }

   return baseURL;
}

function historyURL(setup, group, panel, tstart, tstop) {
   var baseURL = getBaseURL(setup);

   if (baseURL === '') {
      return '';
   }
   
   if (tstop === undefined)
      tstop = Math.floor(Date.now() / 1000)

   return [baseURL, '/?cmd=History', `&group=${group}`, `&panel=${panel}`, `&A=${tstart}`, `&B=${tstop}`].join('')
}

function isHistoryURLDefined(setup) {
   return getBaseURL(setup) !== '';
}

export {historyURL as default, isHistoryURLDefined}
