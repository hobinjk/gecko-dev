/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

const { LogCapture } = Cu.import('resources://gre/modules/devtools/LogCapture.jsm');

/**
 * Test that LogCapture successfully reads from the /dev/log devices, returning
 * a Uint8Array of some length, including zero. This tests a few standard
 * log devices
 */
function run_test() {
  function verifyLog(log) {
    // log exists
    notEqual(log, null);
    // log has a length and it is non-negative (is probably array-like)
    ok(log.length >= 0);
  }

  let mainLog = LogCapture.readLogFile('/dev/log/main');
  verifyLog(mainLog);

  let systemLog = LogCapture.readLogFile('/dev/log/system');
  verifyLog(systemLog);

  let meminfoLog = LogCapture.readLogFile('/proc/meminfo');
  verifyLog(meminfoLog);
}

