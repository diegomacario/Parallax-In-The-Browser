import DeviceDetector from "https://cdn.skypack.dev/device-detector-js@2.2.10";

// Usage: testSupport({client?: string, os?: string}[])
// Client and os are regular expressions.
// See: https://cdn.jsdelivr.net/npm/device-detector-js@2.2.10/README.md for
// legal values for client and os
testSupport([
    { client: 'Chrome' },
]);

function testSupport(supportedDevices) {
    const deviceDetector = new DeviceDetector();
    const detectedDevice = deviceDetector.parse(navigator.userAgent);
    let isSupported = false;
    for (const device of supportedDevices) {
        if (device.client !== undefined) {
            const re = new RegExp(`^${device.client}$`);
            if (!re.test(detectedDevice.client.name)) {
                continue;
            }
        }
        if (device.os !== undefined) {
            const re = new RegExp(`^${device.os}$`);
            if (!re.test(detectedDevice.os.name)) {
                continue;
            }
        }
        isSupported = true;
        break;
    }
    if (!isSupported) {
        alert(`This demo, running on ${detectedDevice.client.name}/${detectedDevice.os.name}, ` +
            `is not well supported at this time, continue at your own risk.`);
    }
}

const controls = window;
const drawingUtils = window;
const mpFaceDetection = window;

// Our input frames will come from here.
const videoElement = document.getElementsByClassName('input_video')[0];
//const canvasElement = document.getElementsByClassName('output_canvas')[0];
const controlsElement = document.getElementsByClassName('control-panel')[0];
//const canvasCtx = canvasElement.getContext('2d');

// We'll add this to our control panel later, but we'll save it here so we can
// call tick() each time the graph runs.
//const fpsControl = new controls.FPS();

// Optimization: Turn off animated spinner after its hiding animation is done.
const spinnerContainer = document.querySelector('.container');
const spinner = document.querySelector('.loading');
spinner.ontransitionend = () => {
    spinnerContainer.style.display = 'none';
    spinner.style.display = 'none';
};

function onResults(results) {
    // Hide the spinner.
    document.body.classList.add('loaded');
    // Update the frame rate.
    //fpsControl.tick();
    // Draw the overlays.
    //canvasCtx.save();
    //canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    //canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    //if (results.detections.length > 0) {
    //    drawingUtils.drawRectangle(canvasCtx, results.detections[0].boundingBox, { color: 'blue', lineWidth: 4, fillColor: '#00000000' });
    //    drawingUtils.drawLandmarks(canvasCtx, results.detections[0].landmarks, {
    //        color: 'red',
    //        radius: 5,
    //    });
    //}
    //canvasCtx.restore();

    //console.log(results.detections);

    if (window.SpatialComputingModule._sendFaceDataToRenderer) {
        if (results.detections.length > 0) {
            let faceData = [];
            faceData.push(true);
            faceData.push(results.detections[0].boundingBox.height);
            faceData.push(results.detections[0].boundingBox.width);
            faceData.push(results.detections[0].boundingBox.xCenter);
            faceData.push(results.detections[0].boundingBox.yCenter);
            const landmarks = results.detections[0].landmarks;
            for (let landmarkIndex = 0; landmarkIndex < landmarks.length; landmarkIndex++) {
                faceData.push(landmarks[landmarkIndex].x);
                faceData.push(landmarks[landmarkIndex].y);
            }

            // Init the typed array with the same length as the number of items in the array parameter
            const typedArray = new Float64Array(faceData.length);

            // Populate the array with the values
            for (let i = 0; i < faceData.length; i++) {
              typedArray[i] = faceData[i];
            }

            if (!window.SpatialComputingModule._malloc || !window.SpatialComputingModule._free) {
                return;
            }

            // Allocate some space in the heap for the data (making sure to use the appropriate memory size of the elements)
            let faceDataBuffer = window.SpatialComputingModule._malloc(
              typedArray.length * typedArray.BYTES_PER_ELEMENT
            );

            // Assign the data to the heap - Keep in mind bytes per element
            window.SpatialComputingModule.HEAPF64.set(typedArray, faceDataBuffer / 8);

            window.SpatialComputingModule._sendFaceDataToRenderer(faceDataBuffer);

            if (faceDataBuffer !== undefined) {
                window.SpatialComputingModule._free(faceDataBuffer);
            }
        }
        else
        {
            let faceData = [];
            faceData.push(false);

            // Init the typed array with the same length as the number of items in the array parameter
            const typedArray = new Float64Array(faceData.length);

            // Populate the array with the values
            for (let i = 0; i < faceData.length; i++) {
              typedArray[i] = faceData[i];
            }

            if (!window.SpatialComputingModule._malloc || !window.SpatialComputingModule._free) {
                return;
            }

            // Allocate some space in the heap for the data (making sure to use the appropriate memory size of the elements)
            let faceDataBuffer = window.SpatialComputingModule._malloc(
              typedArray.length * typedArray.BYTES_PER_ELEMENT
            );

            // Assign the data to the heap - Keep in mind bytes per element
            window.SpatialComputingModule.HEAPF64.set(typedArray, faceDataBuffer / 8);

            window.SpatialComputingModule._sendFaceDataToRenderer(faceDataBuffer);

            if (faceDataBuffer !== undefined) {
                window.SpatialComputingModule._free(faceDataBuffer);
            }
        }
    }
}

const faceDetection = new mpFaceDetection.FaceDetection({ locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4/${file}`;
    } });
faceDetection.onResults(onResults);

faceDetection.setOptions({
    model: 'short',
    minDetectionConfidence: 0.9,
    selfieMode: false
});

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await faceDetection.send({image: videoElement});
    },
    width: 1280,
    height: 720
});
camera.start();

// Present a control panel through which the user can manipulate the solution
// options.
/*
new controls
    .ControlPanel(controlsElement, {
    selfieMode: false,
    model: 'short',
    minDetectionConfidence: 0.9,
})
    .add([
    new controls.StaticText({ title: 'MediaPipe Face Detection' }),
    fpsControl,
    new controls.Toggle({ title: 'Selfie Mode', field: 'selfieMode' }),
    new controls.SourcePicker({
        onSourceChanged: () => {
            faceDetection.reset();
        },
        onFrame: async (input, size) => {
            const aspect = size.height / size.width;
            let width, height;
            if (window.innerWidth > window.innerHeight) {
                height = window.innerHeight;
                width = height / aspect;
            }
            else {
                width = window.innerWidth;
                height = width * aspect;
            }
            //canvasElement.width = width;
            //canvasElement.height = height;
            await faceDetection.send({ image: input });
        },
        examples: {
            images: [],
            videos: [],
        },
    }),
    new controls.Slider({
        title: 'Model Selection',
        field: 'model',
        discrete: { 'short': 'Short-Range', 'full': 'Full-Range' },
    }),
    new controls.Slider({
        title: 'Min Detection Confidence',
        field: 'minDetectionConfidence',
        range: [0, 1],
        step: 0.01
    }),
])
    .on(x => {
    const options = x;
    videoElement.classList.toggle('selfie', options.selfieMode);
    faceDetection.setOptions(options);
});
*/