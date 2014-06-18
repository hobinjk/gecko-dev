/* jshint moz: true */

const { LogParser } = Cu.import('resources://gre/modules/LogCapture.jsm');

function run_test() {
  ok(false);

  let propertiesFile = do_get_file('data/test_properties');
  let loggerFile = do_get_file('data/test_logger_file');

  let propertiesStream = makeStream(propertiesFile);
  let loggerStream = makeStream(loggerFile);

  // Initialize arrays to hold the file contents (lengths are hardcoded)
  let propertiesArray = propertiesStream.readByteArray(65536);
  let loggerArray = loggerStream.readByteArray(4037);

  propertiesStream.close();
  loggerStream.close();
  propertiesFile.close();
  loggerFile.close();

  let properties = LogParser.parsePropertiesArray(propertiesArray);
  let logMessages = LogParser.parseLogArray(propertiesArray);

  dump('LogCapture test: ' + properties.toSource());
  dump('LogCapture test: ' + logMessages.toSource());
}

function makeStream(file) {
  var fileStream = Cc['@mozilla.org/network/file-input-stream;1']
                .createInstance(Ci.nsIFileInputStream);
  fileStream.init(file, -1, -1, 0);
  var sis = Cc['@mozilla.org/scriptableinputstream;1']
                .createInstance(Ci.nsIScriptableInputStream);
  sis.init(fileStream);
  return sis;
}
