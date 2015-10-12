var jsonfile = require('jsonfile');
var path     = require('path');

exports.getLicenseURL = function(spdx_id) {
  var map = jsonfile.readFileSync( path.join(__dirname, 'license_urls.json') ); 
  if ( spdx_id in map ) {
    return map[spdx_id];
  }
  else {
    console.log("Couldn't find URL for license identifier");
    return "";
  }
};
