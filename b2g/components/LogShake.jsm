/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/* jshint moz: true */
/* global Blob, Components, dump, LogCapture, LogParser, OS, Promise, Uint8Array, volumeService, XPCOMUtils */
'use strict';

Components.utils.import('resource://gre/modules/LogCapture.jsm');
Components.utils.import('resource://gre/modules/LogParser.jsm');
Components.utils.import('resource://gre/modules/osfile.jsm');
Components.utils.import('resource://gre/modules/Promise.jsm');
Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');


XPCOMUtils.defineLazyServiceGetter(this, "volumeService",
                                   "@mozilla.org/telephony/volume-service;1",
                                   "nsIVolumeService");

this.EXPORTED_SYMBOLS = ['LogShake'];

function debug(msg) {
  dump('LogShake.jsm: '+msg);
}

function getLogFilename(logLocation) {
  // sanitize the log location
  let logName = logLocation.replace(/\//g, '-');
  if (logName[0] === '-') {
    logName = logName.substring(1);
  }
  return logName + '.log';
}

function getSdcardPrefix() {
  return volumeService.getVolumeByName('sdcard').mountPoint;
}

function getLogDirectory() {
  let d = new Date();
  d = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  let timestamp = d.toISOString().slice(0, -5).replace(/[:T]/g, '-');
  return 'logs/' + timestamp + '/';
}

// Map of files which have log-type information to their parsers
let logsWithParsers = {
  '/dev/__properties__': LogParser.prettyPrintPropertiesArray,
  '/dev/log/main': LogParser.prettyPrintLogArray,
  '/dev/log/system': LogParser.prettyPrintLogArray,
  '/dev/log/radio': LogParser.prettyPrintLogArray,
  '/dev/log/events': LogParser.prettyPrintLogArray,
  '/proc/cmdline': LogParser.prettyPrintArray,
  '/proc/kmsg': LogParser.prettyPrintArray,
  '/proc/meminfo': LogParser.prettyPrintArray,
  '/proc/uptime': LogParser.prettyPrintArray,
  '/proc/version': LogParser.prettyPrintArray,
  '/proc/vmallocinfo': LogParser.prettyPrintArray,
  '/proc/vmstat': LogParser.prettyPrintArray
};

/**
 * Captures and saves the current device logs, returning a promise that will
 * resolve to an array of log filenames.
 */
function captureLogs(doneCallback) {
  let logArrays = readLogs();
  return saveLogs(logArrays);
}

function readLogs() {
  let logArrays = {};
  for (let loc in logsWithParsers) {
    let logArray = LogCapture.readLogFile(loc);
    if (!logArray) {
      return;
    }
    let prettyLogArray = logsWithParsers[loc](logArray);

    logArrays[loc] = prettyLogArray;
  }
  return logArrays;
}

function saveLogs(logArrays) {
  let deferred = Promise.defer();

  let sdcardPrefix = getSdcardPrefix();
  let dirName = getLogDirectory();
  debug('making a directory all the way from '+sdcardPrefix+' to '+(sdcardPrefix + '/' + dirName));
  return OS.File.makeDir(sdcardPrefix + '/' + dirName, {from: sdcardPrefix})
    .then(function() {
    // Now the directory is guaranteed to exist, save the logs
    let logFilenames = [];
    let saveRequests = [];

    for (let logLocation in logArrays) {
      debug('requesting save of ' + logLocation);
      let logArray = logArrays[logLocation];
      // The filename represents the relative path within the SD card, not the
      // absolute path because Gaia will refer to it using the DeviceStorage
      // API
      let filename = dirName + getLogFilename(logLocation);
      logFilenames.push(filename);
      let saveRequest = OS.File.writeAtomic(sdcardPrefix + '/' + filename, logArray);
      saveRequests.push(saveRequest);
    }

    return Promise.all(saveRequests).then(function() {
      debug('returning logfilenames');
      return logFilenames;
    });
  });
}

this.LogShake = {
  captureLogs: captureLogs
};
