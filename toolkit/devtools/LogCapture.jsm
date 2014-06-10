/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

this.EXPORTED_SYMBOLS = ['LogCapture'];

/**
 * captureLog
 * Read in /dev/log/{{log}} in nonblocking mode, which will return -1 if
 * reading would block the thread.
 *
 * @param log {String} The log from which to read. Must be present in /dev/log
 * @return {Uint8Array} Raw log data
 */
function captureLog(log) {
  // load in everything on demand
  Components.utils.import('resource://gre/modules/ctypes.jsm');

  let lib = ctypes.open(ctypes.libraryName('c'));

  let read = lib.declare('read',
    ctypes.default_abi,
    ctypes.int,       // bytes read (out)
    ctypes.int,       // file descriptor (in)
    ctypes.voidptr_t, // buffer to read into (in)
    ctypes.size_t     // size_t size of buffer (in)
  );

  let open = lib.declare('open',
    ctypes.default_abi,
    ctypes.int,      // file descriptor (returned)
    ctypes.char.ptr, // path
    ctypes.int       // flags
  );

  let close = lib.declare('close',
    ctypes.default_abi,
    ctypes.int, // error code (returned)
    ctypes.int  // file descriptor
  );

  const O_READONLY = 0;
  const O_NONBLOCK = 1 << 11;

  const logWhitelist = ['main', 'system', 'events', 'radio'];
  const BUF_SIZE = 1024;

  let okay = false;
  for(let okayLog of logWhitelist) {
    if(okayLog === log) {
      okay = true;
      break;
    }
  }

  if(!okay) {
    return;
  }

  let BufType = ctypes.ArrayType(ctypes.char);
  let buf = new BufType(BUF_SIZE);
  let logArray = [];

  let logFd = open('/dev/log/'+log, O_READONLY | O_NONBLOCK);

  while(true) {
    let count = read(logFd, buf, BUF_SIZE);

    if(count <= 0) {
      // log has return due to being nonblocking or running out of things
      break;
    }

    for(let i = 0; i < count; i++) {
      logArray.push(buf[i]);
    }
  }

  let logTypedArray = new Uint8Array(logArray.length);
  for(let i = 0; i < logArray.length; i++) {
    logTypedArray[i] = logArray[i];
  }

  close(logFd);
  lib.close();

  return logTypedArray;
}

this.LogCapture = { captureLog: captureLog };
