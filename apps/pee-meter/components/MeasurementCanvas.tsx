'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { BottleType } from '@/lib/constants';
import { useLanguage } from '@/contexts/LanguageContext';

interface MeasurementCanvasProps {
    imageUrl: string;
    bottle: BottleType;
    onVolumeChange: (volume: number) => void;
}

export default function MeasurementCanvas({ imageUrl, bottle, onVolumeChange }: MeasurementCanvasProps) {
    const { t } = useLanguage();
    const containerRef = useRef<HTMLDivElement>(null);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<'none' | 'enhance' | 'edge'>('none');
    const [isProcessing, setIsProcessing] = useState(false);

    // Detection State
    const [detectionStatus, setDetectionStatus] = useState<'idle' | 'loading' | 'detecting' | 'found' | 'not-found'>('idle');
    const [model, setModel] = useState<any>(null);
    const [detectedBox, setDetectedBox] = useState<number[] | null>(null);

    // AI Settings
    const [aiSettings, setAiSettings] = useState({
        enabled: true,
        threshold: 0.3
    });

    // Positions in percentage (0 to 100) from top
    const [lines, setLines] = useState({
        top: 20,    // Max capacity line (shoulder)
        liquid: 50, // Current liquid level
        bottom: 80  // Base of bottle
    });

    const [dragging, setDragging] = useState<'top' | 'liquid' | 'bottom' | null>(null);

    useEffect(() => {
        calculateVolume();
    }, [lines, bottle.capacityMl]);

    // Load AI Settings
    useEffect(() => {
        const storedAuto = localStorage.getItem('aiAutoPosition');
        const storedThreshold = localStorage.getItem('aiThreshold');

        setAiSettings({
            enabled: storedAuto === null ? true : storedAuto === 'true',
            threshold: storedThreshold ? parseFloat(storedThreshold) : 0.3
        });
    }, []);

    // Load Model
    useEffect(() => {
        const loadModel = async () => {
            setDetectionStatus('loading');
            try {
                // Dynamic imports to avoid SSR/Runtime issues
                const tf = await import('@tensorflow/tfjs');
                const cocoSsd = await import('@tensorflow-models/coco-ssd');

                await tf.ready();
                const loadedModel = await cocoSsd.load();
                setModel(loadedModel);
                setDetectionStatus('idle');
            } catch (err) {
                console.error("Failed to load model:", err);
                setDetectionStatus('idle'); // Fail silently or handle error
            }
        };
        loadModel();
    }, []);

    // Run Detection
    const runDetection = useCallback(async () => {
        if (!model || !imageUrl) return;

        setDetectionStatus('detecting');
        setDetectedBox(null);

        // Minimum delay to ensure "Scanning..." is visible for UX
        const minDelayPromise = new Promise(resolve => setTimeout(resolve, 800));

        try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = imageUrl;
            await new Promise((resolve) => { img.onload = resolve; });

            // Run detection and delay in parallel
            const [predictions] = await Promise.all([
                model.detect(img, 20, aiSettings.threshold),
                minDelayPromise
            ]);

            console.log("AI Predictions:", predictions); // Debugging

            const validClasses = ['bottle', 'cup', 'wine glass', 'vase'];

            // Filter and sort predictions
            const validPredictions = predictions
                .filter((p: any) => validClasses.includes(p.class))
                .filter((p: any) => {
                    // Filter out small objects (e.g. background items)
                    // bbox is [x, y, width, height]
                    const [, , w, h] = p.bbox;
                    // Check if height is at least 15% of image height
                    return h > (img.height * 0.15);
                })
                .sort((a: any, b: any) => {
                    // Sort by area (largest first)
                    const areaA = a.bbox[2] * a.bbox[3];
                    const areaB = b.bbox[2] * b.bbox[3];
                    return areaB - areaA;
                });

            const bottlePrediction = validPredictions[0];

            if (bottlePrediction) {
                setDetectionStatus('found');
                setDetectedBox(bottlePrediction.bbox);

                // Auto-position lines if enabled
                if (aiSettings.enabled && containerRef.current) {
                    const [x, y, w, h] = bottlePrediction.bbox; // relative to image natural size

                    // We need to map these to percentages of the container height
                    // This is tricky because object-contain scales the image.
                    // Ideally, we calculate percentages relative to the *image*, not the container.
                    // But our lines are percentages of the *container*.
                    // So we need to know where the image sits in the container.

                    const naturalWidth = img.naturalWidth;
                    const naturalHeight = img.naturalHeight;
                    const clientWidth = containerRef.current.clientWidth;
                    const clientHeight = containerRef.current.clientHeight;

                    const scale = Math.min(clientWidth / naturalWidth, clientHeight / naturalHeight);
                    const displayedHeight = naturalHeight * scale;
                    const offsetY = (clientHeight - displayedHeight) / 2;

                    // Convert bbox Y and Height to container coordinates
                    const boxTopY = offsetY + (y * scale);
                    const boxBottomY = offsetY + ((y + h) * scale);

                    // Convert to percentages
                    const topPct = (boxTopY / clientHeight) * 100;
                    const bottomPct = (boxBottomY / clientHeight) * 100;

                    // Apply with some padding/logic
                    // Top line = Shoulder (approx top 20% of bottle?)
                    // Bottom line = Base (bottom of bottle)

                    const newTop = Math.max(0, topPct + (bottomPct - topPct) * 0.15);
                    const newBottom = Math.min(100, bottomPct);
                    let newLiquid = topPct + (bottomPct - topPct) * 0.5; // Default to middle

                    // Attempt to find liquid level using edge detection within the bottle box
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(img, 0, 0);
                            // ROI: Inside the bottle box, but skip top 20% (shoulder/cap) and bottom 10% (base)
                            const roiX = Math.floor(x);
                            const roiY = Math.floor(y + h * 0.2);
                            const roiW = Math.floor(w);
                            const roiH = Math.floor(h * 0.7); // 20% top skipped, 10% bottom skipped = 70% height

                            if (roiW > 0 && roiH > 0) {
                                const imageData = ctx.getImageData(roiX, roiY, roiW, roiH);
                                const data = imageData.data;
                                const width = roiW;
                                const height = roiH;

                                let maxEdgeScore = 0;
                                let maxEdgeY = 0;

                                // Simple horizontal edge detection (Sobel Y-ish)
                                // We sum the edge magnitude for each row
                                for (let r = 1; r < height - 1; r++) {
                                    let rowScore = 0;
                                    for (let c = 0; c < width; c++) {
                                        const idx = (r * width + c) * 4;
                                        const idxAbove = ((r - 1) * width + c) * 4;
                                        const idxBelow = ((r + 1) * width + c) * 4;

                                        // Grayscale values
                                        const val = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                                        const valAbove = (data[idxAbove] + data[idxAbove + 1] + data[idxAbove + 2]) / 3;
                                        const valBelow = (data[idxBelow] + data[idxBelow + 1] + data[idxBelow + 2]) / 3;

                                        // Vertical gradient
                                        const dy = Math.abs(valBelow - valAbove);
                                        rowScore += dy;
                                    }

                                    if (rowScore > maxEdgeScore) {
                                        maxEdgeScore = rowScore;
                                        maxEdgeY = r;
                                    }
                                }

                                // If we found a significant edge
                                if (maxEdgeScore > width * 20) { // Threshold to avoid noise
                                    const liquidYInImage = roiY + maxEdgeY;
                                    const liquidYInContainer = offsetY + (liquidYInImage * scale);
                                    newLiquid = (liquidYInContainer / clientHeight) * 100;
                                }
                            }
                        }
                    } catch (e) {
                        console.error("Liquid detection failed:", e);
                    }

                    setLines(prev => ({
                        ...prev,
                        top: newTop,
                        bottom: newBottom,
                        liquid: newLiquid
                    }));
                }
            } else {
                setDetectionStatus('not-found');
            }
        } catch (err) {
            console.error("Detection failed:", err);
            setDetectionStatus('idle');
        }
    }, [model, imageUrl, aiSettings, containerRef, setDetectionStatus, setDetectedBox, setLines]);

    useEffect(() => {
        runDetection();
    }, [runDetection]);

    // Apply filters when activeFilter changes
    useEffect(() => {
        if (activeFilter === 'none') {
            setProcessedImage(null);
            return;
        }

        const processImage = async () => {
            setIsProcessing(true);
            try {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = imageUrl;
                await new Promise((resolve) => { img.onload = resolve; });

                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                if (activeFilter === 'enhance') {
                    // Auto-Contrast (Histogram Normalization)
                    let min = 255, max = 0;
                    // Find min/max luminance
                    for (let i = 0; i < data.length; i += 4) {
                        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                        if (lum < min) min = lum;
                        if (lum > max) max = lum;
                    }

                    // Stretch
                    if (max > min) {
                        const range = max - min;
                        for (let i = 0; i < data.length; i += 4) {
                            for (let j = 0; j < 3; j++) {
                                data[i + j] = ((data[i + j] - min) / range) * 255;
                            }
                        }
                    }
                } else if (activeFilter === 'edge') {
                    // Sobel Edge Detection
                    const width = canvas.width;
                    const height = canvas.height;
                    const grayData = new Float32Array(width * height);

                    // Convert to grayscale
                    for (let i = 0; i < data.length; i += 4) {
                        grayData[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    }

                    const outputData = new Uint8ClampedArray(data.length);

                    for (let y = 1; y < height - 1; y++) {
                        for (let x = 1; x < width - 1; x++) {
                            // Sobel kernels
                            // Gx: -1 0 1
                            //     -2 0 2
                            //     -1 0 1
                            const gx =
                                -1 * grayData[(y - 1) * width + (x - 1)] +
                                1 * grayData[(y - 1) * width + (x + 1)] +
                                -2 * grayData[y * width + (x - 1)] +
                                2 * grayData[y * width + (x + 1)] +
                                -1 * grayData[(y + 1) * width + (x - 1)] +
                                1 * grayData[(y + 1) * width + (x + 1)];

                            // Gy: -1 -2 -1
                            //      0  0  0
                            //      1  2  1
                            const gy =
                                -1 * grayData[(y - 1) * width + (x - 1)] +
                                -2 * grayData[(y - 1) * width + x] +
                                -1 * grayData[(y - 1) * width + (x + 1)] +
                                1 * grayData[(y + 1) * width + (x - 1)] +
                                2 * grayData[(y + 1) * width + x] +
                                1 * grayData[(y + 1) * width + (x + 1)];

                            const magnitude = Math.sqrt(gx * gx + gy * gy);
                            const val = Math.min(255, magnitude);

                            const idx = (y * width + x) * 4;
                            // Green edges on black background
                            outputData[idx] = 0;     // R
                            outputData[idx + 1] = val; // G
                            outputData[idx + 2] = 0; // B
                            outputData[idx + 3] = 255; // A
                        }
                    }

                    // Replace image data
                    for (let i = 0; i < data.length; i++) {
                        data[i] = outputData[i];
                    }
                }

                ctx.putImageData(imageData, 0, 0);
                setProcessedImage(canvas.toDataURL());
            } catch (e) {
                console.error("Image processing failed:", e);
            } finally {
                setIsProcessing(false);
            }
        };

        processImage();
    }, [activeFilter, imageUrl]);

    const calculateVolume = () => {
        const totalHeight = lines.bottom - lines.top;
        const liquidHeight = lines.bottom - lines.liquid;

        if (totalHeight <= 0) return;

        let ratio = liquidHeight / totalHeight;
        // Clamp ratio between 0 and 1 (optional, maybe allow >1 if overfilled?)
        ratio = Math.max(0, Math.min(1, ratio));

        const volume = Math.round(ratio * bottle.capacityMl);
        onVolumeChange(volume);
    };

    const handlePointerDown = (e: React.PointerEvent, line: 'top' | 'liquid' | 'bottom') => {
        e.preventDefault();
        setDragging(line);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragging || !containerRef.current) return;
        e.preventDefault();

        const rect = containerRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top;
        let percentage = (y / rect.height) * 100;

        // Clamp to 0-100
        percentage = Math.max(0, Math.min(100, percentage));

        setLines(prev => ({
            ...prev,
            [dragging]: percentage
        }));
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setDragging(null);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    // Helper to render bounding box
    const renderBoundingBox = () => {
        if (!detectedBox || !containerRef.current) return null;

        // detectedBox is [x, y, width, height] relative to the image size
        // We need to scale it to the displayed image size
        // However, the image is object-contain, so this is tricky.
        // For simplicity in this MVP, we might skip drawing the exact box over the image 
        // unless we calculate the aspect ratio.
        // A simpler approach for visual feedback is just the success message.
        // BUT, if we want to draw it, we need the image natural dimensions.

        // Let's try to get the image element
        const imgElement = containerRef.current.querySelector('img');
        if (!imgElement) return null;

        const naturalWidth = imgElement.naturalWidth;
        const naturalHeight = imgElement.naturalHeight;
        const clientWidth = imgElement.clientWidth;
        const clientHeight = imgElement.clientHeight;

        if (!naturalWidth || !naturalHeight) return null;

        // Calculate scale and offset for object-contain
        const scale = Math.min(clientWidth / naturalWidth, clientHeight / naturalHeight);
        const displayedWidth = naturalWidth * scale;
        const displayedHeight = naturalHeight * scale;
        const offsetX = (clientWidth - displayedWidth) / 2;
        const offsetY = (clientHeight - displayedHeight) / 2;

        const [x, y, w, h] = detectedBox;

        const style = {
            left: `${offsetX + x * scale}px`,
            top: `${offsetY + y * scale}px`,
            width: `${w * scale}px`,
            height: `${h * scale}px`,
        };

        return (
            <div
                className="absolute border-2 border-green-500 bg-green-500/10 z-10 pointer-events-none animate-in fade-in duration-500"
                style={style}
            >
                <span className="absolute -top-6 left-0 bg-green-500 text-white text-xs px-1 rounded">{t('measurement.bottle')}</span>
            </div>
        );
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full bg-black rounded-lg overflow-hidden touch-none select-none group"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {/* Image */}
            <img
                src={processedImage || imageUrl}
                alt="Measurement"
                className={`absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-300 ${isProcessing ? 'opacity-50' : 'opacity-80'}`}
            />

            {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
            )}

            {/* Detection Feedback */}
            {renderBoundingBox()}

            {detectionStatus === 'not-found' && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    {t('measurement.noBottleDetected')}
                </div>
            )}

            {detectionStatus === 'found' && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-500/90 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('measurement.bottleDetected')}
                </div>
            )}

            {detectionStatus === 'loading' && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm z-50 flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    {t('measurement.loadingAI')}
                </div>
            )}

            {detectionStatus === 'detecting' && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm z-50 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    {t('measurement.scanning')}
                </div>
            )}

            {/* Filter Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-40">
                <button
                    onClick={runDetection}
                    className="p-2 rounded-full backdrop-blur-md bg-black/50 text-white hover:bg-black/70 transition-all"
                    title={t('measurement.rescan')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                </button>
                <div className="h-px bg-white/20 my-1"></div>
                <button
                    onClick={() => setActiveFilter('none')}
                    className={`p-2 rounded-full backdrop-blur-md transition-all ${activeFilter === 'none' ? 'bg-white text-black' : 'bg-black/50 text-white hover:bg-black/70'}`}
                    title={t('measurement.original')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                </button>
                <button
                    onClick={() => setActiveFilter('enhance')}
                    className={`p-2 rounded-full backdrop-blur-md transition-all ${activeFilter === 'enhance' ? 'bg-blue-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'}`}
                    title={t('measurement.autoContrast')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.263l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                    </svg>
                </button>
                <button
                    onClick={() => setActiveFilter('edge')}
                    className={`p-2 rounded-full backdrop-blur-md transition-all ${activeFilter === 'edge' ? 'bg-green-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'}`}
                    title={t('measurement.edgeDetection')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                </button>
            </div>

            {/* Lines */}
            {/* Top Line (Max Capacity) */}
            <div
                className="absolute left-0 right-0 h-8 -mt-4 flex items-center cursor-ns-resize group z-20"
                style={{ top: `${lines.top}%` }}
                onPointerDown={(e) => handlePointerDown(e, 'top')}
            >
                <div className="w-full border-t-2 border-dashed border-red-500 shadow-sm group-hover:border-red-400"></div>
                <span className="absolute right-2 -top-6 text-xs font-bold text-red-500 bg-black/50 px-1 rounded">
                    {t('measurement.max')} ({bottle.capacityMl}{t('common.ml')})
                </span>
            </div>

            {/* Liquid Level Line */}
            <div
                className="absolute left-0 right-0 h-12 -mt-6 flex items-center cursor-ns-resize group z-30"
                style={{ top: `${lines.liquid}%` }}
                onPointerDown={(e) => handlePointerDown(e, 'liquid')}
            >
                <div className="w-full border-t-4 border-yellow-400 shadow-md group-hover:border-yellow-300"></div>
                <div className="absolute left-1/2 -translate-x-1/2 -top-8 bg-yellow-400 text-black font-bold px-2 py-1 rounded-full text-sm shadow-lg">
                    {t('measurement.liquidLevel')}
                </div>
            </div>

            {/* Bottom Line (Base) */}
            <div
                className="absolute left-0 right-0 h-8 -mt-4 flex items-center cursor-ns-resize group z-20"
                style={{ top: `${lines.bottom}%` }}
                onPointerDown={(e) => handlePointerDown(e, 'bottom')}
            >
                <div className="w-full border-t-2 border-dashed border-blue-500 shadow-sm group-hover:border-blue-400"></div>
                <span className="absolute right-2 top-2 text-xs font-bold text-blue-500 bg-black/50 px-1 rounded">
                    {t('measurement.base')} (0{t('common.ml')})
                </span>
            </div>

            {/* Fill Visualization (Optional) */}
            <div
                className="absolute left-0 right-0 bg-yellow-400/20 pointer-events-none z-10"
                style={{
                    top: `${lines.liquid}%`,
                    bottom: `${100 - lines.bottom}%`
                }}
            />
        </div>
    );
}
