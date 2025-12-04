'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SmartCameraProps {
    onCapture: (imageUrl: string) => void;
    onCancel: () => void;
}

export default function SmartCamera({ onCapture, onCancel }: SmartCameraProps) {
    const { t } = useLanguage();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [orientation, setOrientation] = useState({ beta: 0, gamma: 0 }); // beta: front/back, gamma: left/right
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [isLevel, setIsLevel] = useState(false);
    const [strictLeveling, setStrictLeveling] = useState(false);

    const [error, setError] = useState<string | null>(null);

    // Initialize Camera and Settings
    useEffect(() => {
        startCamera();
        const storedStrict = localStorage.getItem('strictLeveling');
        setStrictLeveling(storedStrict === 'true');
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        setError(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError(t('camera.apiNotSupported'));
            return;
        }

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false,
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err: any) {
            console.error("Error accessing camera:", err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError(t('camera.accessDenied'));
            } else {
                setError(t('camera.accessError'));
            }
        }
    };

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    // Handle Orientation
    const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
        const beta = event.beta || 0;   // -180 to 180 (front/back tilt)
        const gamma = event.gamma || 0; // -90 to 90 (left/right tilt)

        setOrientation({ beta, gamma });

        // Level logic: Phone should be vertical (beta ~ 90) and not tilted sideways (gamma ~ 0)
        // Adjust thresholds as needed. 
        // Vertical portrait mode: beta is around 90 degrees.
        const isVertical = Math.abs(beta - 90) < 5; // Within 5 degrees of vertical
        const isStraight = Math.abs(gamma) < 5;     // Within 5 degrees of straight

        if (strictLeveling) {
            setIsLevel(isVertical && isStraight);
        } else {
            setIsLevel(isVertical);
        }
    }, [strictLeveling]);

    const requestAccess = async () => {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const response = await (DeviceOrientationEvent as any).requestPermission();
                if (response === 'granted') {
                    setPermissionGranted(true);
                    window.addEventListener('deviceorientation', handleOrientation);
                } else {
                    alert("Permission denied for device orientation.");
                }
            } catch (e) {
                console.error(e);
            }
        } else {
            // Non-iOS 13+ devices usually don't need permission
            setPermissionGranted(true);
            window.addEventListener('deviceorientation', handleOrientation);
        }
    };

    useEffect(() => {
        // Auto-enable sensors on non-iOS devices
        if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
            requestAccess();
        }

        // Clean up listener
        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, [handleOrientation]);

    const takePhoto = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const url = canvas.toDataURL('image/jpeg');
                onCapture(url);
                stopCamera();
            }
        }
    }, [onCapture, stopCamera]);

    // Auto-capture logic
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (isLevel) {
            timeout = setTimeout(() => {
                takePhoto();
            }, 1000); // Auto-capture after 1 second of stability
        }
        return () => clearTimeout(timeout);
    }, [isLevel, takePhoto]);

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
                {error ? (
                    <div className="text-center p-6 text-white max-w-sm">
                        <div className="mb-4 text-red-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                        </div>
                        <p className="mb-6">{error}</p>
                        <button
                            onClick={startCamera}
                            className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition"
                        >
                            {t('camera.retry')}
                        </button>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="absolute w-full h-full object-cover"
                        />

                        {/* Level Indicator Overlay */}
                        {permissionGranted ? (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                {/* Center Target */}
                                <div className={`w-64 h-64 border-2 rounded-full flex items-center justify-center transition-colors duration-300 ${isLevel ? 'border-green-500 bg-green-500/10' : 'border-white/50'}`}>
                                    <div className={`w-2 h-2 rounded-full ${isLevel ? 'bg-green-500' : 'bg-white'}`} />
                                </div>

                                {/* Moving Bubble */}
                                {strictLeveling && (
                                    <div
                                        className="absolute w-8 h-8 bg-yellow-400 rounded-full shadow-lg transition-transform duration-100 ease-out border-2 border-white"
                                        style={{
                                            transform: `translate(${orientation.gamma * 1.5}px, ${(orientation.beta - 90) * 3}px)`
                                        }}
                                    />
                                )}
                                {!strictLeveling && (
                                    <div
                                        className="absolute w-8 h-8 bg-yellow-400 rounded-full shadow-lg transition-transform duration-100 ease-out border-2 border-white"
                                        style={{
                                            transform: `translate(0px, ${(orientation.beta - 90) * 3}px)`
                                        }}
                                    />
                                )}

                                {/* Status Text */}
                                <div className="absolute top-20 bg-black/50 text-white px-4 py-2 rounded-full backdrop-blur-md font-mono text-sm">
                                    {isLevel ? t('camera.perfectLevel') : t('camera.tiltToCenter')}
                                </div>
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                                <div className="text-center p-6">
                                    <p className="text-white mb-4">{t('camera.enableSensors')}</p>
                                    <button
                                        onClick={requestAccess}
                                        className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold"
                                    >
                                        {t('camera.enableBtn')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Controls */}
            <div className="h-32 bg-black/90 flex items-center justify-between px-8 pb-8 pt-4">
                <button
                    onClick={onCancel}
                    className="text-white p-4"
                >
                    {t('common.cancel')}
                </button>

                <button
                    onClick={takePhoto}
                    className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all ${isLevel
                        ? 'border-green-500 bg-white/20 scale-110'
                        : 'border-white bg-transparent'
                        }`}
                >
                    <div className={`w-16 h-16 rounded-full ${isLevel ? 'bg-green-500' : 'bg-white'}`} />
                </button>

                <div className="w-12" /> {/* Spacer */}
            </div>

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
