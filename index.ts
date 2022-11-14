import {ObjectDetector, Detection} from '@mediapipe/tasks-vision';

let detector: ObjectDetector;
let video: HTMLVideoElement;

// Interval in seconds at which we refresh the results.
const DRAW_OBJECTS_INTERVAL = 0.1;
const DRAW_PROCESSING_TIME_INTERVAL = 0.25;

const messageTag = document.getElementById('message') as HTMLElement;
const outputBox = document.getElementById('container') as HTMLElement;
outputBox.style.bottom = '-30px';

const canvas = document.getElementById('output') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function drawBox(
    label: string, x: number, y: number, w: number, h: number): void {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    ctx.font = '24px roboto';
    ctx.beginPath();
    ctx.strokeStyle = 'white';
    ctx.strokeText(label, x, y - 8);
    ctx.strokeStyle = 'red';
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.stroke();
}

// The last time in ms we processed data. Since we do not special handle the
// first detection, we only display accurate value after the second frame.
let lastVideoTime = -1;
let lastObjectDrawTime = -1;
let lastProcessingTimeDrawTime = -1;
let detectionsSinceLastRefresh = 0;

// Process video detections in a loop
function detectLoop(): void {
    if (video.currentTime !== lastVideoTime) {
        const startTime = performance.now();
        const detections = detector.detect(video, startTime);
        const endTime = performance.now();
        ++detectionsSinceLastRefresh;

        if (endTime - lastObjectDrawTime > DRAW_OBJECTS_INTERVAL) {
            drawObjects(detections);
            lastObjectDrawTime = endTime;
        }

        if (endTime - lastProcessingTimeDrawTime > DRAW_PROCESSING_TIME_INTERVAL) {
            drawProcessingTime(
                (endTime - lastProcessingTimeDrawTime) / detectionsSinceLastRefresh);
            lastProcessingTimeDrawTime = endTime;
            detectionsSinceLastRefresh = 0;
        }

        lastVideoTime = video.currentTime;
    }

    requestAnimationFrame(() => {
        detectLoop();
    });
}

function drawObjects(detections: Detection[]): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const detection of detections) {
        const box = detection.boundingBox!;
        for (const category of detection.categories) {
            const label = `${category.categoryName} (${category.index}): ${
                category.score.toFixed(2)}`;
            drawBox(label, box.originX, box.originY, box.width, box.height);
        }
    }
}

function drawProcessingTime(frameAverage: number): void {
    messageTag.textContent = `Throughput: ${frameAverage.toFixed(2)} ms`;
}

// Stream webcam into detections loop (and also make video visible)
async function streamWebcamThroughDetector(): Promise<void> {
    video = document.getElementById('video') as HTMLVideoElement;

    function onAcquiredUserMedia(stream: MediaStream): void {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            video.play();
            detectLoop();
        };
    }

    try {
        const evt = await navigator.mediaDevices.getUserMedia({
            'audio': false,
            'video': {
                facingMode: 'user',
                width: 1280,
                height: 720,
            }
        });
        onAcquiredUserMedia(evt);
    } catch (e) {
        console.error(`Failed to acquire camera feed: ${e}`);
    }
}

async function runDemo() {
    detector = await ObjectDetector.createFromOptions(
        {
            wasmLoaderPath: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.1.0-alpha-1668420868/wasm/vision_wasm_internal.js`,
            wasmBinaryPath: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.1.0-alpha-1668420868/wasm/vision_wasm_internal.wasm`,
        },
        {
            baseOptions: {
                modelAssetPath:
                    `coco_ssd_mobilenet_v1_1.0_quant_2018_06_29.tflite`
            },
            maxResults: 1
        });
    await streamWebcamThroughDetector();
}

runDemo();
