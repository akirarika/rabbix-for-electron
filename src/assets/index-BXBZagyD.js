import require$$0$1 from "path";
import require$$1$1 from "child_process";
import require$$0 from "tty";
import require$$1 from "util";
import require$$3 from "fs";
import require$$4 from "net";
import require$$3$1 from "electron";
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var src = { exports: {} };
var browser = { exports: {} };
var debug = { exports: {} };
var ms;
var hasRequiredMs;
function requireMs() {
  if (hasRequiredMs) return ms;
  hasRequiredMs = 1;
  var s = 1e3;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var y = d * 365.25;
  ms = function(val, options) {
    options = options || {};
    var type = typeof val;
    if (type === "string" && val.length > 0) {
      return parse(val);
    } else if (type === "number" && isNaN(val) === false) {
      return options.long ? fmtLong(val) : fmtShort(val);
    }
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
    );
  };
  function parse(str) {
    str = String(str);
    if (str.length > 100) {
      return;
    }
    var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
      str
    );
    if (!match) {
      return;
    }
    var n = parseFloat(match[1]);
    var type = (match[2] || "ms").toLowerCase();
    switch (type) {
      case "years":
      case "year":
      case "yrs":
      case "yr":
      case "y":
        return n * y;
      case "days":
      case "day":
      case "d":
        return n * d;
      case "hours":
      case "hour":
      case "hrs":
      case "hr":
      case "h":
        return n * h;
      case "minutes":
      case "minute":
      case "mins":
      case "min":
      case "m":
        return n * m;
      case "seconds":
      case "second":
      case "secs":
      case "sec":
      case "s":
        return n * s;
      case "milliseconds":
      case "millisecond":
      case "msecs":
      case "msec":
      case "ms":
        return n;
      default:
        return void 0;
    }
  }
  function fmtShort(ms2) {
    if (ms2 >= d) {
      return Math.round(ms2 / d) + "d";
    }
    if (ms2 >= h) {
      return Math.round(ms2 / h) + "h";
    }
    if (ms2 >= m) {
      return Math.round(ms2 / m) + "m";
    }
    if (ms2 >= s) {
      return Math.round(ms2 / s) + "s";
    }
    return ms2 + "ms";
  }
  function fmtLong(ms2) {
    return plural(ms2, d, "day") || plural(ms2, h, "hour") || plural(ms2, m, "minute") || plural(ms2, s, "second") || ms2 + " ms";
  }
  function plural(ms2, n, name) {
    if (ms2 < n) {
      return;
    }
    if (ms2 < n * 1.5) {
      return Math.floor(ms2 / n) + " " + name;
    }
    return Math.ceil(ms2 / n) + " " + name + "s";
  }
  return ms;
}
var hasRequiredDebug;
function requireDebug() {
  if (hasRequiredDebug) return debug.exports;
  hasRequiredDebug = 1;
  (function(module, exports$1) {
    exports$1 = module.exports = createDebug.debug = createDebug["default"] = createDebug;
    exports$1.coerce = coerce;
    exports$1.disable = disable;
    exports$1.enable = enable;
    exports$1.enabled = enabled;
    exports$1.humanize = requireMs();
    exports$1.names = [];
    exports$1.skips = [];
    exports$1.formatters = {};
    var prevTime;
    function selectColor(namespace) {
      var hash = 0, i;
      for (i in namespace) {
        hash = (hash << 5) - hash + namespace.charCodeAt(i);
        hash |= 0;
      }
      return exports$1.colors[Math.abs(hash) % exports$1.colors.length];
    }
    function createDebug(namespace) {
      function debug2() {
        if (!debug2.enabled) return;
        var self = debug2;
        var curr = +/* @__PURE__ */ new Date();
        var ms2 = curr - (prevTime || curr);
        self.diff = ms2;
        self.prev = prevTime;
        self.curr = curr;
        prevTime = curr;
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        args[0] = exports$1.coerce(args[0]);
        if ("string" !== typeof args[0]) {
          args.unshift("%O");
        }
        var index2 = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
          if (match === "%%") return match;
          index2++;
          var formatter = exports$1.formatters[format];
          if ("function" === typeof formatter) {
            var val = args[index2];
            match = formatter.call(self, val);
            args.splice(index2, 1);
            index2--;
          }
          return match;
        });
        exports$1.formatArgs.call(self, args);
        var logFn = debug2.log || exports$1.log || console.log.bind(console);
        logFn.apply(self, args);
      }
      debug2.namespace = namespace;
      debug2.enabled = exports$1.enabled(namespace);
      debug2.useColors = exports$1.useColors();
      debug2.color = selectColor(namespace);
      if ("function" === typeof exports$1.init) {
        exports$1.init(debug2);
      }
      return debug2;
    }
    function enable(namespaces) {
      exports$1.save(namespaces);
      exports$1.names = [];
      exports$1.skips = [];
      var split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
      var len = split.length;
      for (var i = 0; i < len; i++) {
        if (!split[i]) continue;
        namespaces = split[i].replace(/\*/g, ".*?");
        if (namespaces[0] === "-") {
          exports$1.skips.push(new RegExp("^" + namespaces.substr(1) + "$"));
        } else {
          exports$1.names.push(new RegExp("^" + namespaces + "$"));
        }
      }
    }
    function disable() {
      exports$1.enable("");
    }
    function enabled(name) {
      var i, len;
      for (i = 0, len = exports$1.skips.length; i < len; i++) {
        if (exports$1.skips[i].test(name)) {
          return false;
        }
      }
      for (i = 0, len = exports$1.names.length; i < len; i++) {
        if (exports$1.names[i].test(name)) {
          return true;
        }
      }
      return false;
    }
    function coerce(val) {
      if (val instanceof Error) return val.stack || val.message;
      return val;
    }
  })(debug, debug.exports);
  return debug.exports;
}
var hasRequiredBrowser;
function requireBrowser() {
  if (hasRequiredBrowser) return browser.exports;
  hasRequiredBrowser = 1;
  (function(module, exports$1) {
    exports$1 = module.exports = requireDebug();
    exports$1.log = log;
    exports$1.formatArgs = formatArgs;
    exports$1.save = save;
    exports$1.load = load;
    exports$1.useColors = useColors;
    exports$1.storage = "undefined" != typeof chrome && "undefined" != typeof chrome.storage ? chrome.storage.local : localstorage();
    exports$1.colors = [
      "lightseagreen",
      "forestgreen",
      "goldenrod",
      "dodgerblue",
      "darkorchid",
      "crimson"
    ];
    function useColors() {
      if (typeof window !== "undefined" && window.process && window.process.type === "renderer") {
        return true;
      }
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || // double check webkit in userAgent just in case we are in a worker
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    exports$1.formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (err) {
        return "[UnexpectedJSONParseError]: " + err.message;
      }
    };
    function formatArgs(args) {
      var useColors2 = this.useColors;
      args[0] = (useColors2 ? "%c" : "") + this.namespace + (useColors2 ? " %c" : " ") + args[0] + (useColors2 ? "%c " : " ") + "+" + exports$1.humanize(this.diff);
      if (!useColors2) return;
      var c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      var index2 = 0;
      var lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, function(match) {
        if ("%%" === match) return;
        index2++;
        if ("%c" === match) {
          lastC = index2;
        }
      });
      args.splice(lastC, 0, c);
    }
    function log() {
      return "object" === typeof console && console.log && Function.prototype.apply.call(console.log, console, arguments);
    }
    function save(namespaces) {
      try {
        if (null == namespaces) {
          exports$1.storage.removeItem("debug");
        } else {
          exports$1.storage.debug = namespaces;
        }
      } catch (e) {
      }
    }
    function load() {
      var r;
      try {
        r = exports$1.storage.debug;
      } catch (e) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = process.env.DEBUG;
      }
      return r;
    }
    exports$1.enable(load());
    function localstorage() {
      try {
        return window.localStorage;
      } catch (e) {
      }
    }
  })(browser, browser.exports);
  return browser.exports;
}
var node = { exports: {} };
var hasRequiredNode;
function requireNode() {
  if (hasRequiredNode) return node.exports;
  hasRequiredNode = 1;
  (function(module, exports$1) {
    var tty = require$$0;
    var util = require$$1;
    exports$1 = module.exports = requireDebug();
    exports$1.init = init;
    exports$1.log = log;
    exports$1.formatArgs = formatArgs;
    exports$1.save = save;
    exports$1.load = load;
    exports$1.useColors = useColors;
    exports$1.colors = [6, 2, 3, 4, 5, 1];
    exports$1.inspectOpts = Object.keys(process.env).filter(function(key) {
      return /^debug_/i.test(key);
    }).reduce(function(obj, key) {
      var prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, function(_, k) {
        return k.toUpperCase();
      });
      var val = process.env[key];
      if (/^(yes|on|true|enabled)$/i.test(val)) val = true;
      else if (/^(no|off|false|disabled)$/i.test(val)) val = false;
      else if (val === "null") val = null;
      else val = Number(val);
      obj[prop] = val;
      return obj;
    }, {});
    var fd = parseInt(process.env.DEBUG_FD, 10) || 2;
    if (1 !== fd && 2 !== fd) {
      util.deprecate(function() {
      }, "except for stderr(2) and stdout(1), any other usage of DEBUG_FD is deprecated. Override debug.log if you want to use a different log function (https://git.io/debug_fd)")();
    }
    var stream = 1 === fd ? process.stdout : 2 === fd ? process.stderr : createWritableStdioStream(fd);
    function useColors() {
      return "colors" in exports$1.inspectOpts ? Boolean(exports$1.inspectOpts.colors) : tty.isatty(fd);
    }
    exports$1.formatters.o = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts).split("\n").map(function(str) {
        return str.trim();
      }).join(" ");
    };
    exports$1.formatters.O = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts);
    };
    function formatArgs(args) {
      var name = this.namespace;
      var useColors2 = this.useColors;
      if (useColors2) {
        var c = this.color;
        var prefix = "  \x1B[3" + c + ";1m" + name + " \x1B[0m";
        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push("\x1B[3" + c + "m+" + exports$1.humanize(this.diff) + "\x1B[0m");
      } else {
        args[0] = (/* @__PURE__ */ new Date()).toUTCString() + " " + name + " " + args[0];
      }
    }
    function log() {
      return stream.write(util.format.apply(util, arguments) + "\n");
    }
    function save(namespaces) {
      if (null == namespaces) {
        delete process.env.DEBUG;
      } else {
        process.env.DEBUG = namespaces;
      }
    }
    function load() {
      return process.env.DEBUG;
    }
    function createWritableStdioStream(fd2) {
      var stream2;
      var tty_wrap = process.binding("tty_wrap");
      switch (tty_wrap.guessHandleType(fd2)) {
        case "TTY":
          stream2 = new tty.WriteStream(fd2);
          stream2._type = "tty";
          if (stream2._handle && stream2._handle.unref) {
            stream2._handle.unref();
          }
          break;
        case "FILE":
          var fs = require$$3;
          stream2 = new fs.SyncWriteStream(fd2, { autoClose: false });
          stream2._type = "fs";
          break;
        case "PIPE":
        case "TCP":
          var net = require$$4;
          stream2 = new net.Socket({
            fd: fd2,
            readable: false,
            writable: true
          });
          stream2.readable = false;
          stream2.read = null;
          stream2._type = "pipe";
          if (stream2._handle && stream2._handle.unref) {
            stream2._handle.unref();
          }
          break;
        default:
          throw new Error("Implement me. Unknown stream file type!");
      }
      stream2.fd = fd2;
      stream2._isStdio = true;
      return stream2;
    }
    function init(debug2) {
      debug2.inspectOpts = {};
      var keys = Object.keys(exports$1.inspectOpts);
      for (var i = 0; i < keys.length; i++) {
        debug2.inspectOpts[keys[i]] = exports$1.inspectOpts[keys[i]];
      }
    }
    exports$1.enable(load());
  })(node, node.exports);
  return node.exports;
}
var hasRequiredSrc;
function requireSrc() {
  if (hasRequiredSrc) return src.exports;
  hasRequiredSrc = 1;
  if (typeof process !== "undefined" && process.type === "renderer") {
    src.exports = requireBrowser();
  } else {
    src.exports = requireNode();
  }
  return src.exports;
}
var electronSquirrelStartup;
var hasRequiredElectronSquirrelStartup;
function requireElectronSquirrelStartup() {
  if (hasRequiredElectronSquirrelStartup) return electronSquirrelStartup;
  hasRequiredElectronSquirrelStartup = 1;
  var path = require$$0$1;
  var spawn = require$$1$1.spawn;
  var debug2 = requireSrc()("electron-squirrel-startup");
  var app = require$$3$1.app;
  var run = function(args, done) {
    var updateExe = path.resolve(path.dirname(process.execPath), "..", "Update.exe");
    debug2("Spawning `%s` with args `%s`", updateExe, args);
    spawn(updateExe, args, {
      detached: true
    }).on("close", done);
  };
  var check = function() {
    if (process.platform === "win32") {
      var cmd = process.argv[1];
      debug2("processing squirrel command `%s`", cmd);
      var target = path.basename(process.execPath);
      if (cmd === "--squirrel-install" || cmd === "--squirrel-updated") {
        run(["--createShortcut=" + target], app.quit);
        return true;
      }
      if (cmd === "--squirrel-uninstall") {
        run(["--removeShortcut=" + target], app.quit);
        return true;
      }
      if (cmd === "--squirrel-obsolete") {
        app.quit();
        return true;
      }
    }
    return false;
  };
  electronSquirrelStartup = check();
  return electronSquirrelStartup;
}
var electronSquirrelStartupExports = requireElectronSquirrelStartup();
const index = /* @__PURE__ */ getDefaultExportFromCjs(electronSquirrelStartupExports);
const index$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: index
}, Symbol.toStringTag, { value: "Module" }));
export {
  index$1 as i
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXgtQlhCWmFneUQuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9tcy9pbmRleC5qcyIsIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9kZWJ1Zy9zcmMvZGVidWcuanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvZGVidWcvc3JjL2Jyb3dzZXIuanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvZGVidWcvc3JjL25vZGUuanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvZGVidWcvc3JjL2luZGV4LmpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2VsZWN0cm9uLXNxdWlycmVsLXN0YXJ0dXAvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBIZWxwZXJzLlxuICovXG5cbnZhciBzID0gMTAwMDtcbnZhciBtID0gcyAqIDYwO1xudmFyIGggPSBtICogNjA7XG52YXIgZCA9IGggKiAyNDtcbnZhciB5ID0gZCAqIDM2NS4yNTtcblxuLyoqXG4gKiBQYXJzZSBvciBmb3JtYXQgdGhlIGdpdmVuIGB2YWxgLlxuICpcbiAqIE9wdGlvbnM6XG4gKlxuICogIC0gYGxvbmdgIHZlcmJvc2UgZm9ybWF0dGluZyBbZmFsc2VdXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8TnVtYmVyfSB2YWxcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAqIEB0aHJvd3Mge0Vycm9yfSB0aHJvdyBhbiBlcnJvciBpZiB2YWwgaXMgbm90IGEgbm9uLWVtcHR5IHN0cmluZyBvciBhIG51bWJlclxuICogQHJldHVybiB7U3RyaW5nfE51bWJlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2YWwsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbDtcbiAgaWYgKHR5cGUgPT09ICdzdHJpbmcnICYmIHZhbC5sZW5ndGggPiAwKSB7XG4gICAgcmV0dXJuIHBhcnNlKHZhbCk7XG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gJ251bWJlcicgJiYgaXNOYU4odmFsKSA9PT0gZmFsc2UpIHtcbiAgICByZXR1cm4gb3B0aW9ucy5sb25nID8gZm10TG9uZyh2YWwpIDogZm10U2hvcnQodmFsKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgJ3ZhbCBpcyBub3QgYSBub24tZW1wdHkgc3RyaW5nIG9yIGEgdmFsaWQgbnVtYmVyLiB2YWw9JyArXG4gICAgICBKU09OLnN0cmluZ2lmeSh2YWwpXG4gICk7XG59O1xuXG4vKipcbiAqIFBhcnNlIHRoZSBnaXZlbiBgc3RyYCBhbmQgcmV0dXJuIG1pbGxpc2Vjb25kcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBwYXJzZShzdHIpIHtcbiAgc3RyID0gU3RyaW5nKHN0cik7XG4gIGlmIChzdHIubGVuZ3RoID4gMTAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBtYXRjaCA9IC9eKCg/OlxcZCspP1xcLj9cXGQrKSAqKG1pbGxpc2Vjb25kcz98bXNlY3M/fG1zfHNlY29uZHM/fHNlY3M/fHN8bWludXRlcz98bWlucz98bXxob3Vycz98aHJzP3xofGRheXM/fGR8eWVhcnM/fHlycz98eSk/JC9pLmV4ZWMoXG4gICAgc3RyXG4gICk7XG4gIGlmICghbWF0Y2gpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIG4gPSBwYXJzZUZsb2F0KG1hdGNoWzFdKTtcbiAgdmFyIHR5cGUgPSAobWF0Y2hbMl0gfHwgJ21zJykudG9Mb3dlckNhc2UoKTtcbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSAneWVhcnMnOlxuICAgIGNhc2UgJ3llYXInOlxuICAgIGNhc2UgJ3lycyc6XG4gICAgY2FzZSAneXInOlxuICAgIGNhc2UgJ3knOlxuICAgICAgcmV0dXJuIG4gKiB5O1xuICAgIGNhc2UgJ2RheXMnOlxuICAgIGNhc2UgJ2RheSc6XG4gICAgY2FzZSAnZCc6XG4gICAgICByZXR1cm4gbiAqIGQ7XG4gICAgY2FzZSAnaG91cnMnOlxuICAgIGNhc2UgJ2hvdXInOlxuICAgIGNhc2UgJ2hycyc6XG4gICAgY2FzZSAnaHInOlxuICAgIGNhc2UgJ2gnOlxuICAgICAgcmV0dXJuIG4gKiBoO1xuICAgIGNhc2UgJ21pbnV0ZXMnOlxuICAgIGNhc2UgJ21pbnV0ZSc6XG4gICAgY2FzZSAnbWlucyc6XG4gICAgY2FzZSAnbWluJzpcbiAgICBjYXNlICdtJzpcbiAgICAgIHJldHVybiBuICogbTtcbiAgICBjYXNlICdzZWNvbmRzJzpcbiAgICBjYXNlICdzZWNvbmQnOlxuICAgIGNhc2UgJ3NlY3MnOlxuICAgIGNhc2UgJ3NlYyc6XG4gICAgY2FzZSAncyc6XG4gICAgICByZXR1cm4gbiAqIHM7XG4gICAgY2FzZSAnbWlsbGlzZWNvbmRzJzpcbiAgICBjYXNlICdtaWxsaXNlY29uZCc6XG4gICAgY2FzZSAnbXNlY3MnOlxuICAgIGNhc2UgJ21zZWMnOlxuICAgIGNhc2UgJ21zJzpcbiAgICAgIHJldHVybiBuO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG59XG5cbi8qKlxuICogU2hvcnQgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gZm10U2hvcnQobXMpIHtcbiAgaWYgKG1zID49IGQpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGQpICsgJ2QnO1xuICB9XG4gIGlmIChtcyA+PSBoKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBoKSArICdoJztcbiAgfVxuICBpZiAobXMgPj0gbSkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gbSkgKyAnbSc7XG4gIH1cbiAgaWYgKG1zID49IHMpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIHMpICsgJ3MnO1xuICB9XG4gIHJldHVybiBtcyArICdtcyc7XG59XG5cbi8qKlxuICogTG9uZyBmb3JtYXQgZm9yIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBmbXRMb25nKG1zKSB7XG4gIHJldHVybiBwbHVyYWwobXMsIGQsICdkYXknKSB8fFxuICAgIHBsdXJhbChtcywgaCwgJ2hvdXInKSB8fFxuICAgIHBsdXJhbChtcywgbSwgJ21pbnV0ZScpIHx8XG4gICAgcGx1cmFsKG1zLCBzLCAnc2Vjb25kJykgfHxcbiAgICBtcyArICcgbXMnO1xufVxuXG4vKipcbiAqIFBsdXJhbGl6YXRpb24gaGVscGVyLlxuICovXG5cbmZ1bmN0aW9uIHBsdXJhbChtcywgbiwgbmFtZSkge1xuICBpZiAobXMgPCBuKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChtcyA8IG4gKiAxLjUpIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcihtcyAvIG4pICsgJyAnICsgbmFtZTtcbiAgfVxuICByZXR1cm4gTWF0aC5jZWlsKG1zIC8gbikgKyAnICcgKyBuYW1lICsgJ3MnO1xufVxuIiwiXG4vKipcbiAqIFRoaXMgaXMgdGhlIGNvbW1vbiBsb2dpYyBmb3IgYm90aCB0aGUgTm9kZS5qcyBhbmQgd2ViIGJyb3dzZXJcbiAqIGltcGxlbWVudGF0aW9ucyBvZiBgZGVidWcoKWAuXG4gKlxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZURlYnVnLmRlYnVnID0gY3JlYXRlRGVidWdbJ2RlZmF1bHQnXSA9IGNyZWF0ZURlYnVnO1xuZXhwb3J0cy5jb2VyY2UgPSBjb2VyY2U7XG5leHBvcnRzLmRpc2FibGUgPSBkaXNhYmxlO1xuZXhwb3J0cy5lbmFibGUgPSBlbmFibGU7XG5leHBvcnRzLmVuYWJsZWQgPSBlbmFibGVkO1xuZXhwb3J0cy5odW1hbml6ZSA9IHJlcXVpcmUoJ21zJyk7XG5cbi8qKlxuICogVGhlIGN1cnJlbnRseSBhY3RpdmUgZGVidWcgbW9kZSBuYW1lcywgYW5kIG5hbWVzIHRvIHNraXAuXG4gKi9cblxuZXhwb3J0cy5uYW1lcyA9IFtdO1xuZXhwb3J0cy5za2lwcyA9IFtdO1xuXG4vKipcbiAqIE1hcCBvZiBzcGVjaWFsIFwiJW5cIiBoYW5kbGluZyBmdW5jdGlvbnMsIGZvciB0aGUgZGVidWcgXCJmb3JtYXRcIiBhcmd1bWVudC5cbiAqXG4gKiBWYWxpZCBrZXkgbmFtZXMgYXJlIGEgc2luZ2xlLCBsb3dlciBvciB1cHBlci1jYXNlIGxldHRlciwgaS5lLiBcIm5cIiBhbmQgXCJOXCIuXG4gKi9cblxuZXhwb3J0cy5mb3JtYXR0ZXJzID0ge307XG5cbi8qKlxuICogUHJldmlvdXMgbG9nIHRpbWVzdGFtcC5cbiAqL1xuXG52YXIgcHJldlRpbWU7XG5cbi8qKlxuICogU2VsZWN0IGEgY29sb3IuXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzZWxlY3RDb2xvcihuYW1lc3BhY2UpIHtcbiAgdmFyIGhhc2ggPSAwLCBpO1xuXG4gIGZvciAoaSBpbiBuYW1lc3BhY2UpIHtcbiAgICBoYXNoICA9ICgoaGFzaCA8PCA1KSAtIGhhc2gpICsgbmFtZXNwYWNlLmNoYXJDb2RlQXQoaSk7XG4gICAgaGFzaCB8PSAwOyAvLyBDb252ZXJ0IHRvIDMyYml0IGludGVnZXJcbiAgfVxuXG4gIHJldHVybiBleHBvcnRzLmNvbG9yc1tNYXRoLmFicyhoYXNoKSAlIGV4cG9ydHMuY29sb3JzLmxlbmd0aF07XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgZGVidWdnZXIgd2l0aCB0aGUgZ2l2ZW4gYG5hbWVzcGFjZWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZVxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGNyZWF0ZURlYnVnKG5hbWVzcGFjZSkge1xuXG4gIGZ1bmN0aW9uIGRlYnVnKCkge1xuICAgIC8vIGRpc2FibGVkP1xuICAgIGlmICghZGVidWcuZW5hYmxlZCkgcmV0dXJuO1xuXG4gICAgdmFyIHNlbGYgPSBkZWJ1ZztcblxuICAgIC8vIHNldCBgZGlmZmAgdGltZXN0YW1wXG4gICAgdmFyIGN1cnIgPSArbmV3IERhdGUoKTtcbiAgICB2YXIgbXMgPSBjdXJyIC0gKHByZXZUaW1lIHx8IGN1cnIpO1xuICAgIHNlbGYuZGlmZiA9IG1zO1xuICAgIHNlbGYucHJldiA9IHByZXZUaW1lO1xuICAgIHNlbGYuY3VyciA9IGN1cnI7XG4gICAgcHJldlRpbWUgPSBjdXJyO1xuXG4gICAgLy8gdHVybiB0aGUgYGFyZ3VtZW50c2AgaW50byBhIHByb3BlciBBcnJheVxuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgICAgYXJnc1tpXSA9IGFyZ3VtZW50c1tpXTtcbiAgICB9XG5cbiAgICBhcmdzWzBdID0gZXhwb3J0cy5jb2VyY2UoYXJnc1swXSk7XG5cbiAgICBpZiAoJ3N0cmluZycgIT09IHR5cGVvZiBhcmdzWzBdKSB7XG4gICAgICAvLyBhbnl0aGluZyBlbHNlIGxldCdzIGluc3BlY3Qgd2l0aCAlT1xuICAgICAgYXJncy51bnNoaWZ0KCclTycpO1xuICAgIH1cblxuICAgIC8vIGFwcGx5IGFueSBgZm9ybWF0dGVyc2AgdHJhbnNmb3JtYXRpb25zXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICBhcmdzWzBdID0gYXJnc1swXS5yZXBsYWNlKC8lKFthLXpBLVolXSkvZywgZnVuY3Rpb24obWF0Y2gsIGZvcm1hdCkge1xuICAgICAgLy8gaWYgd2UgZW5jb3VudGVyIGFuIGVzY2FwZWQgJSB0aGVuIGRvbid0IGluY3JlYXNlIHRoZSBhcnJheSBpbmRleFxuICAgICAgaWYgKG1hdGNoID09PSAnJSUnKSByZXR1cm4gbWF0Y2g7XG4gICAgICBpbmRleCsrO1xuICAgICAgdmFyIGZvcm1hdHRlciA9IGV4cG9ydHMuZm9ybWF0dGVyc1tmb3JtYXRdO1xuICAgICAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBmb3JtYXR0ZXIpIHtcbiAgICAgICAgdmFyIHZhbCA9IGFyZ3NbaW5kZXhdO1xuICAgICAgICBtYXRjaCA9IGZvcm1hdHRlci5jYWxsKHNlbGYsIHZhbCk7XG5cbiAgICAgICAgLy8gbm93IHdlIG5lZWQgdG8gcmVtb3ZlIGBhcmdzW2luZGV4XWAgc2luY2UgaXQncyBpbmxpbmVkIGluIHRoZSBgZm9ybWF0YFxuICAgICAgICBhcmdzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGluZGV4LS07XG4gICAgICB9XG4gICAgICByZXR1cm4gbWF0Y2g7XG4gICAgfSk7XG5cbiAgICAvLyBhcHBseSBlbnYtc3BlY2lmaWMgZm9ybWF0dGluZyAoY29sb3JzLCBldGMuKVxuICAgIGV4cG9ydHMuZm9ybWF0QXJncy5jYWxsKHNlbGYsIGFyZ3MpO1xuXG4gICAgdmFyIGxvZ0ZuID0gZGVidWcubG9nIHx8IGV4cG9ydHMubG9nIHx8IGNvbnNvbGUubG9nLmJpbmQoY29uc29sZSk7XG4gICAgbG9nRm4uYXBwbHkoc2VsZiwgYXJncyk7XG4gIH1cblxuICBkZWJ1Zy5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG4gIGRlYnVnLmVuYWJsZWQgPSBleHBvcnRzLmVuYWJsZWQobmFtZXNwYWNlKTtcbiAgZGVidWcudXNlQ29sb3JzID0gZXhwb3J0cy51c2VDb2xvcnMoKTtcbiAgZGVidWcuY29sb3IgPSBzZWxlY3RDb2xvcihuYW1lc3BhY2UpO1xuXG4gIC8vIGVudi1zcGVjaWZpYyBpbml0aWFsaXphdGlvbiBsb2dpYyBmb3IgZGVidWcgaW5zdGFuY2VzXG4gIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgZXhwb3J0cy5pbml0KSB7XG4gICAgZXhwb3J0cy5pbml0KGRlYnVnKTtcbiAgfVxuXG4gIHJldHVybiBkZWJ1Zztcbn1cblxuLyoqXG4gKiBFbmFibGVzIGEgZGVidWcgbW9kZSBieSBuYW1lc3BhY2VzLiBUaGlzIGNhbiBpbmNsdWRlIG1vZGVzXG4gKiBzZXBhcmF0ZWQgYnkgYSBjb2xvbiBhbmQgd2lsZGNhcmRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGVuYWJsZShuYW1lc3BhY2VzKSB7XG4gIGV4cG9ydHMuc2F2ZShuYW1lc3BhY2VzKTtcblxuICBleHBvcnRzLm5hbWVzID0gW107XG4gIGV4cG9ydHMuc2tpcHMgPSBbXTtcblxuICB2YXIgc3BsaXQgPSAodHlwZW9mIG5hbWVzcGFjZXMgPT09ICdzdHJpbmcnID8gbmFtZXNwYWNlcyA6ICcnKS5zcGxpdCgvW1xccyxdKy8pO1xuICB2YXIgbGVuID0gc3BsaXQubGVuZ3RoO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoIXNwbGl0W2ldKSBjb250aW51ZTsgLy8gaWdub3JlIGVtcHR5IHN0cmluZ3NcbiAgICBuYW1lc3BhY2VzID0gc3BsaXRbaV0ucmVwbGFjZSgvXFwqL2csICcuKj8nKTtcbiAgICBpZiAobmFtZXNwYWNlc1swXSA9PT0gJy0nKSB7XG4gICAgICBleHBvcnRzLnNraXBzLnB1c2gobmV3IFJlZ0V4cCgnXicgKyBuYW1lc3BhY2VzLnN1YnN0cigxKSArICckJykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBleHBvcnRzLm5hbWVzLnB1c2gobmV3IFJlZ0V4cCgnXicgKyBuYW1lc3BhY2VzICsgJyQnKSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRGlzYWJsZSBkZWJ1ZyBvdXRwdXQuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBkaXNhYmxlKCkge1xuICBleHBvcnRzLmVuYWJsZSgnJyk7XG59XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIHRoZSBnaXZlbiBtb2RlIG5hbWUgaXMgZW5hYmxlZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBlbmFibGVkKG5hbWUpIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gZXhwb3J0cy5za2lwcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGlmIChleHBvcnRzLnNraXBzW2ldLnRlc3QobmFtZSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgZm9yIChpID0gMCwgbGVuID0gZXhwb3J0cy5uYW1lcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGlmIChleHBvcnRzLm5hbWVzW2ldLnRlc3QobmFtZSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQ29lcmNlIGB2YWxgLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbFxuICogQHJldHVybiB7TWl4ZWR9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBjb2VyY2UodmFsKSB7XG4gIGlmICh2YWwgaW5zdGFuY2VvZiBFcnJvcikgcmV0dXJuIHZhbC5zdGFjayB8fCB2YWwubWVzc2FnZTtcbiAgcmV0dXJuIHZhbDtcbn1cbiIsIi8qKlxuICogVGhpcyBpcyB0aGUgd2ViIGJyb3dzZXIgaW1wbGVtZW50YXRpb24gb2YgYGRlYnVnKClgLlxuICpcbiAqIEV4cG9zZSBgZGVidWcoKWAgYXMgdGhlIG1vZHVsZS5cbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2RlYnVnJyk7XG5leHBvcnRzLmxvZyA9IGxvZztcbmV4cG9ydHMuZm9ybWF0QXJncyA9IGZvcm1hdEFyZ3M7XG5leHBvcnRzLnNhdmUgPSBzYXZlO1xuZXhwb3J0cy5sb2FkID0gbG9hZDtcbmV4cG9ydHMudXNlQ29sb3JzID0gdXNlQ29sb3JzO1xuZXhwb3J0cy5zdG9yYWdlID0gJ3VuZGVmaW5lZCcgIT0gdHlwZW9mIGNocm9tZVxuICAgICAgICAgICAgICAgJiYgJ3VuZGVmaW5lZCcgIT0gdHlwZW9mIGNocm9tZS5zdG9yYWdlXG4gICAgICAgICAgICAgICAgICA/IGNocm9tZS5zdG9yYWdlLmxvY2FsXG4gICAgICAgICAgICAgICAgICA6IGxvY2Fsc3RvcmFnZSgpO1xuXG4vKipcbiAqIENvbG9ycy5cbiAqL1xuXG5leHBvcnRzLmNvbG9ycyA9IFtcbiAgJ2xpZ2h0c2VhZ3JlZW4nLFxuICAnZm9yZXN0Z3JlZW4nLFxuICAnZ29sZGVucm9kJyxcbiAgJ2RvZGdlcmJsdWUnLFxuICAnZGFya29yY2hpZCcsXG4gICdjcmltc29uJ1xuXTtcblxuLyoqXG4gKiBDdXJyZW50bHkgb25seSBXZWJLaXQtYmFzZWQgV2ViIEluc3BlY3RvcnMsIEZpcmVmb3ggPj0gdjMxLFxuICogYW5kIHRoZSBGaXJlYnVnIGV4dGVuc2lvbiAoYW55IEZpcmVmb3ggdmVyc2lvbikgYXJlIGtub3duXG4gKiB0byBzdXBwb3J0IFwiJWNcIiBDU1MgY3VzdG9taXphdGlvbnMuXG4gKlxuICogVE9ETzogYWRkIGEgYGxvY2FsU3RvcmFnZWAgdmFyaWFibGUgdG8gZXhwbGljaXRseSBlbmFibGUvZGlzYWJsZSBjb2xvcnNcbiAqL1xuXG5mdW5jdGlvbiB1c2VDb2xvcnMoKSB7XG4gIC8vIE5COiBJbiBhbiBFbGVjdHJvbiBwcmVsb2FkIHNjcmlwdCwgZG9jdW1lbnQgd2lsbCBiZSBkZWZpbmVkIGJ1dCBub3QgZnVsbHlcbiAgLy8gaW5pdGlhbGl6ZWQuIFNpbmNlIHdlIGtub3cgd2UncmUgaW4gQ2hyb21lLCB3ZSdsbCBqdXN0IGRldGVjdCB0aGlzIGNhc2VcbiAgLy8gZXhwbGljaXRseVxuICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LnByb2Nlc3MgJiYgd2luZG93LnByb2Nlc3MudHlwZSA9PT0gJ3JlbmRlcmVyJykge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gaXMgd2Via2l0PyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xNjQ1OTYwNi8zNzY3NzNcbiAgLy8gZG9jdW1lbnQgaXMgdW5kZWZpbmVkIGluIHJlYWN0LW5hdGl2ZTogaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0LW5hdGl2ZS9wdWxsLzE2MzJcbiAgcmV0dXJuICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLldlYmtpdEFwcGVhcmFuY2UpIHx8XG4gICAgLy8gaXMgZmlyZWJ1Zz8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMzk4MTIwLzM3Njc3M1xuICAgICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuY29uc29sZSAmJiAod2luZG93LmNvbnNvbGUuZmlyZWJ1ZyB8fCAod2luZG93LmNvbnNvbGUuZXhjZXB0aW9uICYmIHdpbmRvdy5jb25zb2xlLnRhYmxlKSkpIHx8XG4gICAgLy8gaXMgZmlyZWZveCA+PSB2MzE/XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9Ub29scy9XZWJfQ29uc29sZSNTdHlsaW5nX21lc3NhZ2VzXG4gICAgKHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmIG5hdmlnYXRvci51c2VyQWdlbnQgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLm1hdGNoKC9maXJlZm94XFwvKFxcZCspLykgJiYgcGFyc2VJbnQoUmVnRXhwLiQxLCAxMCkgPj0gMzEpIHx8XG4gICAgLy8gZG91YmxlIGNoZWNrIHdlYmtpdCBpbiB1c2VyQWdlbnQganVzdCBpbiBjYXNlIHdlIGFyZSBpbiBhIHdvcmtlclxuICAgICh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IudXNlckFnZW50ICYmIG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvYXBwbGV3ZWJraXRcXC8oXFxkKykvKSk7XG59XG5cbi8qKlxuICogTWFwICVqIHRvIGBKU09OLnN0cmluZ2lmeSgpYCwgc2luY2Ugbm8gV2ViIEluc3BlY3RvcnMgZG8gdGhhdCBieSBkZWZhdWx0LlxuICovXG5cbmV4cG9ydHMuZm9ybWF0dGVycy5qID0gZnVuY3Rpb24odikge1xuICB0cnkge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh2KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuICdbVW5leHBlY3RlZEpTT05QYXJzZUVycm9yXTogJyArIGVyci5tZXNzYWdlO1xuICB9XG59O1xuXG5cbi8qKlxuICogQ29sb3JpemUgbG9nIGFyZ3VtZW50cyBpZiBlbmFibGVkLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZm9ybWF0QXJncyhhcmdzKSB7XG4gIHZhciB1c2VDb2xvcnMgPSB0aGlzLnVzZUNvbG9ycztcblxuICBhcmdzWzBdID0gKHVzZUNvbG9ycyA/ICclYycgOiAnJylcbiAgICArIHRoaXMubmFtZXNwYWNlXG4gICAgKyAodXNlQ29sb3JzID8gJyAlYycgOiAnICcpXG4gICAgKyBhcmdzWzBdXG4gICAgKyAodXNlQ29sb3JzID8gJyVjICcgOiAnICcpXG4gICAgKyAnKycgKyBleHBvcnRzLmh1bWFuaXplKHRoaXMuZGlmZik7XG5cbiAgaWYgKCF1c2VDb2xvcnMpIHJldHVybjtcblxuICB2YXIgYyA9ICdjb2xvcjogJyArIHRoaXMuY29sb3I7XG4gIGFyZ3Muc3BsaWNlKDEsIDAsIGMsICdjb2xvcjogaW5oZXJpdCcpXG5cbiAgLy8gdGhlIGZpbmFsIFwiJWNcIiBpcyBzb21ld2hhdCB0cmlja3ksIGJlY2F1c2UgdGhlcmUgY291bGQgYmUgb3RoZXJcbiAgLy8gYXJndW1lbnRzIHBhc3NlZCBlaXRoZXIgYmVmb3JlIG9yIGFmdGVyIHRoZSAlYywgc28gd2UgbmVlZCB0b1xuICAvLyBmaWd1cmUgb3V0IHRoZSBjb3JyZWN0IGluZGV4IHRvIGluc2VydCB0aGUgQ1NTIGludG9cbiAgdmFyIGluZGV4ID0gMDtcbiAgdmFyIGxhc3RDID0gMDtcbiAgYXJnc1swXS5yZXBsYWNlKC8lW2EtekEtWiVdL2csIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgaWYgKCclJScgPT09IG1hdGNoKSByZXR1cm47XG4gICAgaW5kZXgrKztcbiAgICBpZiAoJyVjJyA9PT0gbWF0Y2gpIHtcbiAgICAgIC8vIHdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gdGhlICpsYXN0KiAlY1xuICAgICAgLy8gKHRoZSB1c2VyIG1heSBoYXZlIHByb3ZpZGVkIHRoZWlyIG93bilcbiAgICAgIGxhc3RDID0gaW5kZXg7XG4gICAgfVxuICB9KTtcblxuICBhcmdzLnNwbGljZShsYXN0QywgMCwgYyk7XG59XG5cbi8qKlxuICogSW52b2tlcyBgY29uc29sZS5sb2coKWAgd2hlbiBhdmFpbGFibGUuXG4gKiBOby1vcCB3aGVuIGBjb25zb2xlLmxvZ2AgaXMgbm90IGEgXCJmdW5jdGlvblwiLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gbG9nKCkge1xuICAvLyB0aGlzIGhhY2tlcnkgaXMgcmVxdWlyZWQgZm9yIElFOC85LCB3aGVyZVxuICAvLyB0aGUgYGNvbnNvbGUubG9nYCBmdW5jdGlvbiBkb2Vzbid0IGhhdmUgJ2FwcGx5J1xuICByZXR1cm4gJ29iamVjdCcgPT09IHR5cGVvZiBjb25zb2xlXG4gICAgJiYgY29uc29sZS5sb2dcbiAgICAmJiBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHkuY2FsbChjb25zb2xlLmxvZywgY29uc29sZSwgYXJndW1lbnRzKTtcbn1cblxuLyoqXG4gKiBTYXZlIGBuYW1lc3BhY2VzYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlc1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc2F2ZShuYW1lc3BhY2VzKSB7XG4gIHRyeSB7XG4gICAgaWYgKG51bGwgPT0gbmFtZXNwYWNlcykge1xuICAgICAgZXhwb3J0cy5zdG9yYWdlLnJlbW92ZUl0ZW0oJ2RlYnVnJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4cG9ydHMuc3RvcmFnZS5kZWJ1ZyA9IG5hbWVzcGFjZXM7XG4gICAgfVxuICB9IGNhdGNoKGUpIHt9XG59XG5cbi8qKlxuICogTG9hZCBgbmFtZXNwYWNlc2AuXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSByZXR1cm5zIHRoZSBwcmV2aW91c2x5IHBlcnNpc3RlZCBkZWJ1ZyBtb2Rlc1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbG9hZCgpIHtcbiAgdmFyIHI7XG4gIHRyeSB7XG4gICAgciA9IGV4cG9ydHMuc3RvcmFnZS5kZWJ1ZztcbiAgfSBjYXRjaChlKSB7fVxuXG4gIC8vIElmIGRlYnVnIGlzbid0IHNldCBpbiBMUywgYW5kIHdlJ3JlIGluIEVsZWN0cm9uLCB0cnkgdG8gbG9hZCAkREVCVUdcbiAgaWYgKCFyICYmIHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiAnZW52JyBpbiBwcm9jZXNzKSB7XG4gICAgciA9IHByb2Nlc3MuZW52LkRFQlVHO1xuICB9XG5cbiAgcmV0dXJuIHI7XG59XG5cbi8qKlxuICogRW5hYmxlIG5hbWVzcGFjZXMgbGlzdGVkIGluIGBsb2NhbFN0b3JhZ2UuZGVidWdgIGluaXRpYWxseS5cbiAqL1xuXG5leHBvcnRzLmVuYWJsZShsb2FkKCkpO1xuXG4vKipcbiAqIExvY2Fsc3RvcmFnZSBhdHRlbXB0cyB0byByZXR1cm4gdGhlIGxvY2Fsc3RvcmFnZS5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHNhZmFyaSB0aHJvd3NcbiAqIHdoZW4gYSB1c2VyIGRpc2FibGVzIGNvb2tpZXMvbG9jYWxzdG9yYWdlXG4gKiBhbmQgeW91IGF0dGVtcHQgdG8gYWNjZXNzIGl0LlxuICpcbiAqIEByZXR1cm4ge0xvY2FsU3RvcmFnZX1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGxvY2Fsc3RvcmFnZSgpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZTtcbiAgfSBjYXRjaCAoZSkge31cbn1cbiIsIi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgdHR5ID0gcmVxdWlyZSgndHR5Jyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcblxuLyoqXG4gKiBUaGlzIGlzIHRoZSBOb2RlLmpzIGltcGxlbWVudGF0aW9uIG9mIGBkZWJ1ZygpYC5cbiAqXG4gKiBFeHBvc2UgYGRlYnVnKClgIGFzIHRoZSBtb2R1bGUuXG4gKi9cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9kZWJ1ZycpO1xuZXhwb3J0cy5pbml0ID0gaW5pdDtcbmV4cG9ydHMubG9nID0gbG9nO1xuZXhwb3J0cy5mb3JtYXRBcmdzID0gZm9ybWF0QXJncztcbmV4cG9ydHMuc2F2ZSA9IHNhdmU7XG5leHBvcnRzLmxvYWQgPSBsb2FkO1xuZXhwb3J0cy51c2VDb2xvcnMgPSB1c2VDb2xvcnM7XG5cbi8qKlxuICogQ29sb3JzLlxuICovXG5cbmV4cG9ydHMuY29sb3JzID0gWzYsIDIsIDMsIDQsIDUsIDFdO1xuXG4vKipcbiAqIEJ1aWxkIHVwIHRoZSBkZWZhdWx0IGBpbnNwZWN0T3B0c2Agb2JqZWN0IGZyb20gdGhlIGVudmlyb25tZW50IHZhcmlhYmxlcy5cbiAqXG4gKiAgICQgREVCVUdfQ09MT1JTPW5vIERFQlVHX0RFUFRIPTEwIERFQlVHX1NIT1dfSElEREVOPWVuYWJsZWQgbm9kZSBzY3JpcHQuanNcbiAqL1xuXG5leHBvcnRzLmluc3BlY3RPcHRzID0gT2JqZWN0LmtleXMocHJvY2Vzcy5lbnYpLmZpbHRlcihmdW5jdGlvbiAoa2V5KSB7XG4gIHJldHVybiAvXmRlYnVnXy9pLnRlc3Qoa2V5KTtcbn0pLnJlZHVjZShmdW5jdGlvbiAob2JqLCBrZXkpIHtcbiAgLy8gY2FtZWwtY2FzZVxuICB2YXIgcHJvcCA9IGtleVxuICAgIC5zdWJzdHJpbmcoNilcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5yZXBsYWNlKC9fKFthLXpdKS9nLCBmdW5jdGlvbiAoXywgaykgeyByZXR1cm4gay50b1VwcGVyQ2FzZSgpIH0pO1xuXG4gIC8vIGNvZXJjZSBzdHJpbmcgdmFsdWUgaW50byBKUyB2YWx1ZVxuICB2YXIgdmFsID0gcHJvY2Vzcy5lbnZba2V5XTtcbiAgaWYgKC9eKHllc3xvbnx0cnVlfGVuYWJsZWQpJC9pLnRlc3QodmFsKSkgdmFsID0gdHJ1ZTtcbiAgZWxzZSBpZiAoL14obm98b2ZmfGZhbHNlfGRpc2FibGVkKSQvaS50ZXN0KHZhbCkpIHZhbCA9IGZhbHNlO1xuICBlbHNlIGlmICh2YWwgPT09ICdudWxsJykgdmFsID0gbnVsbDtcbiAgZWxzZSB2YWwgPSBOdW1iZXIodmFsKTtcblxuICBvYmpbcHJvcF0gPSB2YWw7XG4gIHJldHVybiBvYmo7XG59LCB7fSk7XG5cbi8qKlxuICogVGhlIGZpbGUgZGVzY3JpcHRvciB0byB3cml0ZSB0aGUgYGRlYnVnKClgIGNhbGxzIHRvLlxuICogU2V0IHRoZSBgREVCVUdfRkRgIGVudiB2YXJpYWJsZSB0byBvdmVycmlkZSB3aXRoIGFub3RoZXIgdmFsdWUuIGkuZS46XG4gKlxuICogICAkIERFQlVHX0ZEPTMgbm9kZSBzY3JpcHQuanMgMz5kZWJ1Zy5sb2dcbiAqL1xuXG52YXIgZmQgPSBwYXJzZUludChwcm9jZXNzLmVudi5ERUJVR19GRCwgMTApIHx8IDI7XG5cbmlmICgxICE9PSBmZCAmJiAyICE9PSBmZCkge1xuICB1dGlsLmRlcHJlY2F0ZShmdW5jdGlvbigpe30sICdleGNlcHQgZm9yIHN0ZGVycigyKSBhbmQgc3Rkb3V0KDEpLCBhbnkgb3RoZXIgdXNhZ2Ugb2YgREVCVUdfRkQgaXMgZGVwcmVjYXRlZC4gT3ZlcnJpZGUgZGVidWcubG9nIGlmIHlvdSB3YW50IHRvIHVzZSBhIGRpZmZlcmVudCBsb2cgZnVuY3Rpb24gKGh0dHBzOi8vZ2l0LmlvL2RlYnVnX2ZkKScpKClcbn1cblxudmFyIHN0cmVhbSA9IDEgPT09IGZkID8gcHJvY2Vzcy5zdGRvdXQgOlxuICAgICAgICAgICAgIDIgPT09IGZkID8gcHJvY2Vzcy5zdGRlcnIgOlxuICAgICAgICAgICAgIGNyZWF0ZVdyaXRhYmxlU3RkaW9TdHJlYW0oZmQpO1xuXG4vKipcbiAqIElzIHN0ZG91dCBhIFRUWT8gQ29sb3JlZCBvdXRwdXQgaXMgZW5hYmxlZCB3aGVuIGB0cnVlYC5cbiAqL1xuXG5mdW5jdGlvbiB1c2VDb2xvcnMoKSB7XG4gIHJldHVybiAnY29sb3JzJyBpbiBleHBvcnRzLmluc3BlY3RPcHRzXG4gICAgPyBCb29sZWFuKGV4cG9ydHMuaW5zcGVjdE9wdHMuY29sb3JzKVxuICAgIDogdHR5LmlzYXR0eShmZCk7XG59XG5cbi8qKlxuICogTWFwICVvIHRvIGB1dGlsLmluc3BlY3QoKWAsIGFsbCBvbiBhIHNpbmdsZSBsaW5lLlxuICovXG5cbmV4cG9ydHMuZm9ybWF0dGVycy5vID0gZnVuY3Rpb24odikge1xuICB0aGlzLmluc3BlY3RPcHRzLmNvbG9ycyA9IHRoaXMudXNlQ29sb3JzO1xuICByZXR1cm4gdXRpbC5pbnNwZWN0KHYsIHRoaXMuaW5zcGVjdE9wdHMpXG4gICAgLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24oc3RyKSB7XG4gICAgICByZXR1cm4gc3RyLnRyaW0oKVxuICAgIH0pLmpvaW4oJyAnKTtcbn07XG5cbi8qKlxuICogTWFwICVvIHRvIGB1dGlsLmluc3BlY3QoKWAsIGFsbG93aW5nIG11bHRpcGxlIGxpbmVzIGlmIG5lZWRlZC5cbiAqL1xuXG5leHBvcnRzLmZvcm1hdHRlcnMuTyA9IGZ1bmN0aW9uKHYpIHtcbiAgdGhpcy5pbnNwZWN0T3B0cy5jb2xvcnMgPSB0aGlzLnVzZUNvbG9ycztcbiAgcmV0dXJuIHV0aWwuaW5zcGVjdCh2LCB0aGlzLmluc3BlY3RPcHRzKTtcbn07XG5cbi8qKlxuICogQWRkcyBBTlNJIGNvbG9yIGVzY2FwZSBjb2RlcyBpZiBlbmFibGVkLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZm9ybWF0QXJncyhhcmdzKSB7XG4gIHZhciBuYW1lID0gdGhpcy5uYW1lc3BhY2U7XG4gIHZhciB1c2VDb2xvcnMgPSB0aGlzLnVzZUNvbG9ycztcblxuICBpZiAodXNlQ29sb3JzKSB7XG4gICAgdmFyIGMgPSB0aGlzLmNvbG9yO1xuICAgIHZhciBwcmVmaXggPSAnICBcXHUwMDFiWzMnICsgYyArICc7MW0nICsgbmFtZSArICcgJyArICdcXHUwMDFiWzBtJztcblxuICAgIGFyZ3NbMF0gPSBwcmVmaXggKyBhcmdzWzBdLnNwbGl0KCdcXG4nKS5qb2luKCdcXG4nICsgcHJlZml4KTtcbiAgICBhcmdzLnB1c2goJ1xcdTAwMWJbMycgKyBjICsgJ20rJyArIGV4cG9ydHMuaHVtYW5pemUodGhpcy5kaWZmKSArICdcXHUwMDFiWzBtJyk7XG4gIH0gZWxzZSB7XG4gICAgYXJnc1swXSA9IG5ldyBEYXRlKCkudG9VVENTdHJpbmcoKVxuICAgICAgKyAnICcgKyBuYW1lICsgJyAnICsgYXJnc1swXTtcbiAgfVxufVxuXG4vKipcbiAqIEludm9rZXMgYHV0aWwuZm9ybWF0KClgIHdpdGggdGhlIHNwZWNpZmllZCBhcmd1bWVudHMgYW5kIHdyaXRlcyB0byBgc3RyZWFtYC5cbiAqL1xuXG5mdW5jdGlvbiBsb2coKSB7XG4gIHJldHVybiBzdHJlYW0ud3JpdGUodXRpbC5mb3JtYXQuYXBwbHkodXRpbCwgYXJndW1lbnRzKSArICdcXG4nKTtcbn1cblxuLyoqXG4gKiBTYXZlIGBuYW1lc3BhY2VzYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlc1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc2F2ZShuYW1lc3BhY2VzKSB7XG4gIGlmIChudWxsID09IG5hbWVzcGFjZXMpIHtcbiAgICAvLyBJZiB5b3Ugc2V0IGEgcHJvY2Vzcy5lbnYgZmllbGQgdG8gbnVsbCBvciB1bmRlZmluZWQsIGl0IGdldHMgY2FzdCB0byB0aGVcbiAgICAvLyBzdHJpbmcgJ251bGwnIG9yICd1bmRlZmluZWQnLiBKdXN0IGRlbGV0ZSBpbnN0ZWFkLlxuICAgIGRlbGV0ZSBwcm9jZXNzLmVudi5ERUJVRztcbiAgfSBlbHNlIHtcbiAgICBwcm9jZXNzLmVudi5ERUJVRyA9IG5hbWVzcGFjZXM7XG4gIH1cbn1cblxuLyoqXG4gKiBMb2FkIGBuYW1lc3BhY2VzYC5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHJldHVybnMgdGhlIHByZXZpb3VzbHkgcGVyc2lzdGVkIGRlYnVnIG1vZGVzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb2FkKCkge1xuICByZXR1cm4gcHJvY2Vzcy5lbnYuREVCVUc7XG59XG5cbi8qKlxuICogQ29waWVkIGZyb20gYG5vZGUvc3JjL25vZGUuanNgLlxuICpcbiAqIFhYWDogSXQncyBsYW1lIHRoYXQgbm9kZSBkb2Vzbid0IGV4cG9zZSB0aGlzIEFQSSBvdXQtb2YtdGhlLWJveC4gSXQgYWxzb1xuICogcmVsaWVzIG9uIHRoZSB1bmRvY3VtZW50ZWQgYHR0eV93cmFwLmd1ZXNzSGFuZGxlVHlwZSgpYCB3aGljaCBpcyBhbHNvIGxhbWUuXG4gKi9cblxuZnVuY3Rpb24gY3JlYXRlV3JpdGFibGVTdGRpb1N0cmVhbSAoZmQpIHtcbiAgdmFyIHN0cmVhbTtcbiAgdmFyIHR0eV93cmFwID0gcHJvY2Vzcy5iaW5kaW5nKCd0dHlfd3JhcCcpO1xuXG4gIC8vIE5vdGUgc3RyZWFtLl90eXBlIGlzIHVzZWQgZm9yIHRlc3QtbW9kdWxlLWxvYWQtbGlzdC5qc1xuXG4gIHN3aXRjaCAodHR5X3dyYXAuZ3Vlc3NIYW5kbGVUeXBlKGZkKSkge1xuICAgIGNhc2UgJ1RUWSc6XG4gICAgICBzdHJlYW0gPSBuZXcgdHR5LldyaXRlU3RyZWFtKGZkKTtcbiAgICAgIHN0cmVhbS5fdHlwZSA9ICd0dHknO1xuXG4gICAgICAvLyBIYWNrIHRvIGhhdmUgc3RyZWFtIG5vdCBrZWVwIHRoZSBldmVudCBsb29wIGFsaXZlLlxuICAgICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9qb3llbnQvbm9kZS9pc3N1ZXMvMTcyNlxuICAgICAgaWYgKHN0cmVhbS5faGFuZGxlICYmIHN0cmVhbS5faGFuZGxlLnVucmVmKSB7XG4gICAgICAgIHN0cmVhbS5faGFuZGxlLnVucmVmKCk7XG4gICAgICB9XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgJ0ZJTEUnOlxuICAgICAgdmFyIGZzID0gcmVxdWlyZSgnZnMnKTtcbiAgICAgIHN0cmVhbSA9IG5ldyBmcy5TeW5jV3JpdGVTdHJlYW0oZmQsIHsgYXV0b0Nsb3NlOiBmYWxzZSB9KTtcbiAgICAgIHN0cmVhbS5fdHlwZSA9ICdmcyc7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgJ1BJUEUnOlxuICAgIGNhc2UgJ1RDUCc6XG4gICAgICB2YXIgbmV0ID0gcmVxdWlyZSgnbmV0Jyk7XG4gICAgICBzdHJlYW0gPSBuZXcgbmV0LlNvY2tldCh7XG4gICAgICAgIGZkOiBmZCxcbiAgICAgICAgcmVhZGFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZVxuICAgICAgfSk7XG5cbiAgICAgIC8vIEZJWE1FIFNob3VsZCBwcm9iYWJseSBoYXZlIGFuIG9wdGlvbiBpbiBuZXQuU29ja2V0IHRvIGNyZWF0ZSBhXG4gICAgICAvLyBzdHJlYW0gZnJvbSBhbiBleGlzdGluZyBmZCB3aGljaCBpcyB3cml0YWJsZSBvbmx5LiBCdXQgZm9yIG5vd1xuICAgICAgLy8gd2UnbGwganVzdCBhZGQgdGhpcyBoYWNrIGFuZCBzZXQgdGhlIGByZWFkYWJsZWAgbWVtYmVyIHRvIGZhbHNlLlxuICAgICAgLy8gVGVzdDogLi9ub2RlIHRlc3QvZml4dHVyZXMvZWNoby5qcyA8IC9ldGMvcGFzc3dkXG4gICAgICBzdHJlYW0ucmVhZGFibGUgPSBmYWxzZTtcbiAgICAgIHN0cmVhbS5yZWFkID0gbnVsbDtcbiAgICAgIHN0cmVhbS5fdHlwZSA9ICdwaXBlJztcblxuICAgICAgLy8gRklYTUUgSGFjayB0byBoYXZlIHN0cmVhbSBub3Qga2VlcCB0aGUgZXZlbnQgbG9vcCBhbGl2ZS5cbiAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vam95ZW50L25vZGUvaXNzdWVzLzE3MjZcbiAgICAgIGlmIChzdHJlYW0uX2hhbmRsZSAmJiBzdHJlYW0uX2hhbmRsZS51bnJlZikge1xuICAgICAgICBzdHJlYW0uX2hhbmRsZS51bnJlZigpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG5cbiAgICBkZWZhdWx0OlxuICAgICAgLy8gUHJvYmFibHkgYW4gZXJyb3Igb24gaW4gdXZfZ3Vlc3NfaGFuZGxlKClcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW1wbGVtZW50IG1lLiBVbmtub3duIHN0cmVhbSBmaWxlIHR5cGUhJyk7XG4gIH1cblxuICAvLyBGb3Igc3VwcG9ydGluZyBsZWdhY3kgQVBJIHdlIHB1dCB0aGUgRkQgaGVyZS5cbiAgc3RyZWFtLmZkID0gZmQ7XG5cbiAgc3RyZWFtLl9pc1N0ZGlvID0gdHJ1ZTtcblxuICByZXR1cm4gc3RyZWFtO1xufVxuXG4vKipcbiAqIEluaXQgbG9naWMgZm9yIGBkZWJ1Z2AgaW5zdGFuY2VzLlxuICpcbiAqIENyZWF0ZSBhIG5ldyBgaW5zcGVjdE9wdHNgIG9iamVjdCBpbiBjYXNlIGB1c2VDb2xvcnNgIGlzIHNldFxuICogZGlmZmVyZW50bHkgZm9yIGEgcGFydGljdWxhciBgZGVidWdgIGluc3RhbmNlLlxuICovXG5cbmZ1bmN0aW9uIGluaXQgKGRlYnVnKSB7XG4gIGRlYnVnLmluc3BlY3RPcHRzID0ge307XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhleHBvcnRzLmluc3BlY3RPcHRzKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgZGVidWcuaW5zcGVjdE9wdHNba2V5c1tpXV0gPSBleHBvcnRzLmluc3BlY3RPcHRzW2tleXNbaV1dO1xuICB9XG59XG5cbi8qKlxuICogRW5hYmxlIG5hbWVzcGFjZXMgbGlzdGVkIGluIGBwcm9jZXNzLmVudi5ERUJVR2AgaW5pdGlhbGx5LlxuICovXG5cbmV4cG9ydHMuZW5hYmxlKGxvYWQoKSk7XG4iLCIvKipcbiAqIERldGVjdCBFbGVjdHJvbiByZW5kZXJlciBwcm9jZXNzLCB3aGljaCBpcyBub2RlLCBidXQgd2Ugc2hvdWxkXG4gKiB0cmVhdCBhcyBhIGJyb3dzZXIuXG4gKi9cblxuaWYgKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiBwcm9jZXNzLnR5cGUgPT09ICdyZW5kZXJlcicpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2Jyb3dzZXIuanMnKTtcbn0gZWxzZSB7XG4gIG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9ub2RlLmpzJyk7XG59XG4iLCJ2YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciBzcGF3biA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKS5zcGF3bjtcbnZhciBkZWJ1ZyA9IHJlcXVpcmUoJ2RlYnVnJykoJ2VsZWN0cm9uLXNxdWlycmVsLXN0YXJ0dXAnKTtcbnZhciBhcHAgPSByZXF1aXJlKCdlbGVjdHJvbicpLmFwcDtcblxudmFyIHJ1biA9IGZ1bmN0aW9uKGFyZ3MsIGRvbmUpIHtcbiAgdmFyIHVwZGF0ZUV4ZSA9IHBhdGgucmVzb2x2ZShwYXRoLmRpcm5hbWUocHJvY2Vzcy5leGVjUGF0aCksICcuLicsICdVcGRhdGUuZXhlJyk7XG4gIGRlYnVnKCdTcGF3bmluZyBgJXNgIHdpdGggYXJncyBgJXNgJywgdXBkYXRlRXhlLCBhcmdzKTtcbiAgc3Bhd24odXBkYXRlRXhlLCBhcmdzLCB7XG4gICAgZGV0YWNoZWQ6IHRydWVcbiAgfSkub24oJ2Nsb3NlJywgZG9uZSk7XG59O1xuXG52YXIgY2hlY2sgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicpIHtcbiAgICB2YXIgY21kID0gcHJvY2Vzcy5hcmd2WzFdO1xuICAgIGRlYnVnKCdwcm9jZXNzaW5nIHNxdWlycmVsIGNvbW1hbmQgYCVzYCcsIGNtZCk7XG4gICAgdmFyIHRhcmdldCA9IHBhdGguYmFzZW5hbWUocHJvY2Vzcy5leGVjUGF0aCk7XG5cbiAgICBpZiAoY21kID09PSAnLS1zcXVpcnJlbC1pbnN0YWxsJyB8fCBjbWQgPT09ICctLXNxdWlycmVsLXVwZGF0ZWQnKSB7XG4gICAgICBydW4oWyctLWNyZWF0ZVNob3J0Y3V0PScgKyB0YXJnZXQgKyAnJ10sIGFwcC5xdWl0KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoY21kID09PSAnLS1zcXVpcnJlbC11bmluc3RhbGwnKSB7XG4gICAgICBydW4oWyctLXJlbW92ZVNob3J0Y3V0PScgKyB0YXJnZXQgKyAnJ10sIGFwcC5xdWl0KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoY21kID09PSAnLS1zcXVpcnJlbC1vYnNvbGV0ZScpIHtcbiAgICAgIGFwcC5xdWl0KCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBjaGVjaygpO1xuIl0sIm5hbWVzIjpbIm1zIiwiZXhwb3J0cyIsInJlcXVpcmUkJDAiLCJkZWJ1ZyIsImluZGV4IiwidXNlQ29sb3JzIiwicmVxdWlyZSQkMiIsImZkIiwic3RyZWFtIiwic3JjTW9kdWxlIiwicmVxdWlyZSQkMSIsInJlcXVpcmUkJDMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUlBLE1BQUksSUFBSTtBQUNSLE1BQUksSUFBSSxJQUFJO0FBQ1osTUFBSSxJQUFJLElBQUk7QUFDWixNQUFJLElBQUksSUFBSTtBQUNaLE1BQUksSUFBSSxJQUFJO0FBZ0JaLE9B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
