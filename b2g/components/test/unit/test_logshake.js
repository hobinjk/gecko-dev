/**
 * Test the log capturing capabilities of LogShake.jsm
 */

/* jshint moz: true */
/* global Components */
/* global LogCapture, LogShake, OS */

Components.utils.import('resource:///modules/LogCapture.jsm');
Components.utils.import('resource:///modules/LogShake.jsm');
Components.utils.import('resource:///modules/osfile.jsm');


function run_test() {
  // We want to ensure that captureLogs
  //  actually captures the logs
  //  attempts to save the logs
  //  responds with the filenames it attempted to save
  let readLocations = [];
  LogCapture.readLogFile = function(loc) {
    readLocations.push(loc);
    return null; // we don't want to provide invalid data to a parser
  };

  LogShake.captureLogs();
  assert.ok(readLocations.length > 0,
      'LogShake should attempt to read at least one log');
}
