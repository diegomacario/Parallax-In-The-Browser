var statusElement = document.getElementById("status"),
  progressElement = document.getElementById("progress"),
  spinnerElement = document.getElementById("spinner"),
  BaseSpatialComputingModule = {
    noImageDecoding: true,
    noAudioDecoding: true,
    preRun: [],
    postRun: [],
    print: (function () {
      var e = document.getElementById("output");
      return (
        e && (e.value = ""),
        function (t) {
          arguments.length > 1 &&
            (t = Array.prototype.slice.call(arguments).join(" ")),
            console.log(t),
            e && ((e.value += t + "\n"), (e.scrollTop = e.scrollHeight));
        }
      );
    })(),
    printErr: function (e) {
      arguments.length > 1 &&
        (e = Array.prototype.slice.call(arguments).join(" ")),
        console.error(e);
    },
    canvas: document.getElementById("canvas"),
    setStatus: function (e) {
      if (
        (BaseSpatialComputingModule.setStatus.last ||
          (BaseSpatialComputingModule.setStatus.last = { time: Date.now(), text: "" }),
        e !== BaseSpatialComputingModule.setStatus.last.text)
      ) {
        var t = e.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/),
          n = Date.now();
        (t && n - BaseSpatialComputingModule.setStatus.last.time < 30) ||
          ((BaseSpatialComputingModule.setStatus.last.time = n),
          (BaseSpatialComputingModule.setStatus.last.text = e),
          t
            ? ((e = t[1]),
              (progressElement.value = 100 * parseInt(t[2])),
              (progressElement.max = 100 * parseInt(t[4])),
              (progressElement.hidden = !1),
              (spinnerElement.hidden = !1))
            : ((progressElement.value = null),
              (progressElement.max = null),
              (progressElement.hidden = !0),
              e || (spinnerElement.style.display = "none")),
          (statusElement.innerHTML = e));
      }
    },
    totalDependencies: 0,
    monitorRunDependencies: function (e) {
      (this.totalDependencies = Math.max(this.totalDependencies, e)),
        BaseSpatialComputingModule.setStatus(
          e
            ? "Preparing... (" +
                (this.totalDependencies - e) +
                "/" +
                this.totalDependencies +
                ")"
            : "All downloads complete."
        );
    },
  };
BaseSpatialComputingModule.setStatus("Downloading..."),
  (window.onerror = function (e) {
    BaseSpatialComputingModule.setStatus("Exception thrown, see JavaScript console"),
      (spinnerElement.style.display = "none"),
      (BaseSpatialComputingModule.setStatus = function (e) {
        e && BaseSpatialComputingModule.printErr("[post-exception status] " + e);
      });
  });

createSpatialComputingModule(BaseSpatialComputingModule).then((SpatialComputingModule) => {
  function resizeCanvas() {
      var canvas = document.getElementById("canvas");
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
  };

  function resizeFramebuffers() {
      window.SpatialComputingModule._updateWindowDimensions(window.innerWidth, window.innerHeight);
  };

  window.addEventListener('resize', resizeCanvas, false);

  window.addEventListener('load', () => {
      resizeCanvas();
  
      window.addEventListener('resize', resizeFramebuffers, false);
  
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) {
        document.getElementById('webgl_unsupported_popup').style.display = 'block';
      }
  });

  // HACK: Need the Module object defined in this file to be a global so that the WASM JavaScript glue code can use it.
  // The alternative to this would be to have the WASM JS code import the module, but since that is generated code I'm not
  // sure how to accomplish it.
  window.SpatialComputingModule = SpatialComputingModule;

  SpatialComputingModule['onRuntimeInitialized'] = function () {
    console.log("Module Rendering", Module);
  };
});
