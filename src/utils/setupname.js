function setupName(setup) {
  const sites = require('../sites.json');
  let i_setup = parseInt(setup);

  for (let i = 0; i < sites.length; i++) {
    if (sites[i].id === i_setup) {
      return sites[i].name;
    }
  }

  return "???";
}

export default setupName
