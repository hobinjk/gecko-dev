/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

const { notEqual, ok } = Cu.import('resource://testing-common/Assert.jsm');
const { LogCapture } = Cu.import('resources://gre/modules/devtools/LogCapture.jsm');

/**
 * Test that LogCapture successfully reads from the /dev/log devices, returning
 * a Uint8Array of some length, including zero. This tests the standard
 * /dev/log devices: main, system, events, and radio.
 */
function run_test() {
  function verifyLog(log) {
    // log exists
    notEqual(log, null);
    // log has a length and it is non-negative (is probably array-like)
    ok(log.length >= 0);
  }

  let mainLog = LogCapture.readLogFile('main');
  verifyLog(mainLog);

  let systemLog = LogCapture.readLogFile('system');
  verifyLog(systemLog);

  let eventsLog = LogCapture.readLogFile('events');
  verifyLog(eventsLog);

  let radioLog = LogCapture.readLogFile('radio');
  verifyLog(radioLog);
}

