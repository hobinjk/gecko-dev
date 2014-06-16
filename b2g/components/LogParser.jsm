/* jshint esnext: true */
/* global DataView, Uint8Array */

'use strict';

this.EXPORTED_SYMBOLS = ['LogParser'];

function parseLogArrayBuffer(arrayBuffer) {
  let data = new DataView(arrayBuffer);
  let byteString = String.fromCharCode.apply(null, new Uint8Array(arrayBuffer));

  let logMessages = [];
  let offset = 0;
  while (offset < byteString.length) {
    let length = data.getUint32(offset, true);
    offset += 4;
    let processId = data.getUint32(offset, true);
    offset += 4;
    let threadId = data.getUint32(offset, true);
    offset += 4;
    let seconds = data.getUint32(offset, true);
    offset += 4;
    let nanoseconds = data.getUint32(offset, true);
    offset += 4;
    let priority = data.getUint8(offset);
    offset += 1;

    // read the tag and message c-style strings
    let tag = '';
    while (byteString[offset] != '\0') {
      tag += byteString[offset];
      offset ++;
    }
    offset ++;

    let message = '';
    while (byteString[offset] != '\0') {
      message += byteString[offset];
      offset ++;
    }
    offset ++;

    // add an aditional time property to mimic the milliseconds since UTC
    // expected by Date
    let time = seconds * 1000.0 + nanoseconds/1000000.0;

    logMessages.push({
      processId: processId,
      threadId: threadId,
      seconds: seconds,
      nanoseconds: nanoseconds,
      time: time,
      priority: priority,
      tag: tag,
      message: message
    });
  }

  return logMessages;
}

function getTimeString(time) {
  let date = new Date(time);
  function pad(number) {
    if ( number < 10 ) {
      return '0' + number;
    }
    return number;
  }
  return pad( date.getMonth() + 1 ) +
         '-' + pad( date.getDate() ) +
         ' ' + pad( date.getHours() ) +
         ':' + pad( date.getMinutes() ) +
         ':' + pad( date.getSeconds() ) +
         '.' + (date.getMilliseconds() / 1000).toFixed(3).slice(2, 5);
}

function padLeft(str, width) {
  while (str.length < width) {
    str = ' ' + str;
  }
  return str;
}

function padRight(str, width) {
  while (str.length < width) {
    str = str + ' ';
  }
  return str;
}

const ANDROID_LOG_UNKNOWN = 0;
const ANDROID_LOG_DEFAULT = 1;
const ANDROID_LOG_VERBOSE = 2;
const ANDROID_LOG_DEBUG   = 3;
const ANDROID_LOG_INFO    = 4;
const ANDROID_LOG_WARN    = 5;
const ANDROID_LOG_ERROR   = 6;
const ANDROID_LOG_FATAL   = 7;
const ANDROID_LOG_SILENT  = 8;

function getPriorityString(priorityNumber) {
  switch (priorityNumber) {
  case ANDROID_LOG_VERBOSE:
    return 'V';
  case ANDROID_LOG_DEBUG:
    return 'D';
  case ANDROID_LOG_INFO:
    return 'I';
  case ANDROID_LOG_WARN:
    return 'W';
  case ANDROID_LOG_ERROR:
    return 'E';
  case ANDROID_LOG_FATAL:
    return 'F';
  case ANDROID_LOG_SILENT:
    return 'S';
  default:
    return '?';
  }
}


// Mimic the logcat "threadtime" format
function formatLogMessage(logMessage) {
  // MM-DD HH:MM:SS.ms pid tid priority tag: message
  // from liblog/logprint.c:
  // snprintf(prefixBuf, sizeof(prefixBuf), "%s.%03ld %5d %5d %c %-8s: ",
  //          timeBuf, entry->tv_nsec / 1000000,
  //          entry->pid, entry->tid, priChar, entry->tag);
  return getTimeString(logMessage.time) +
         ' ' + padLeft(logMessage.processId, 5) +
         ' ' + padLeft(logMessage.processId, 5) +
         ' ' + getPriorityString(logMessage.priority) +
         ' ' + padRight(logMessage.tag) +
         ': ' + logMessage.message;
}

function prettyPrintLogArrayBuffer(arrayBuffer) {
  let logMessages = parseLogArrayBuffer(arrayBuffer);
  return logMessages.map(formatLogMessage).join('\n');
}

function parsePropertiesArrayBuffer(arrayBuffer) {
  let data = new DataView(arrayBuffer);
  let byteString = String.fromCharCode.apply(null, new Uint8Array(arrayBuffer));

  let properties = {};

  let propIndex = 0;
  let propCount = data.getUint32(0, true);

  // first TOC entry is at 32
  let tocOffset = 32;

  const PROP_NAME_MAX = 32;
  const PROP_VALUE_MAX = 92;

  while (propIndex < propCount) {
    // retrieve offset from file start
    let infoOffset = data.getUint32(tocOffset, true) & 0xffffff;

    // now read the name:, serial:4, and value
    let propName = '';
    let nameOffset = infoOffset;
    while (byteString[nameOffset] != '\0' &&
           (nameOffset - infoOffset) < PROP_NAME_MAX) {
      propName += byteString[nameOffset];
      nameOffset ++;
    }

    infoOffset += PROP_NAME_MAX;
    // skip serial number
    infoOffset += 4;

    let propValue = '';
    nameOffset = infoOffset;
    while (byteString[nameOffset] != '\0' &&
           (nameOffset - infoOffset) < PROP_VALUE_MAX) {
      propValue += byteString[nameOffset];
      nameOffset ++;
    }

    tocOffset += 4;

    properties[propName] = propValue;
    propIndex += 1;
  }

  return properties;
}

function prettyPrintPropertiesArrayBuffer(arrayBuffer) {
  let properties = parsePropertiesArrayBuffer(arrayBuffer);
  let propertiesString = '';
  for(let propName in properties) {
    propertiesString += propName + ': ' + properties[propName] + '\n';
  }
  return propertiesString;
}


this.LogParser = {
  parseLogArrayBuffer: parseLogArrayBuffer,
  parsePropertiesArrayBuffer: parsePropertiesArrayBuffer,
  prettyPrintLogArrayBuffer: prettyPrintLogArrayBuffer,
  prettyPrintPropertiesArrayBuffer: prettyPrintPropertiesArrayBuffer
};
