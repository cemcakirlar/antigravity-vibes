'use client';

import { useRef, useState, useEffect } from 'react';

interface ImageUploaderProps {
    onImageSelect: (imageUrl: string) => void;
    onSmartCameraClick?: () => void;
}

type CameraStatus = 'loading' | 'ready' | 'insecure' | 'unsupported';

export default function ImageUploader({ onImageSelect, onSmartCameraClick }: ImageUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cameraStatus, setCameraStatus] = useState<CameraStatus>('loading');
    const [statusMessage, setStatusMessage] = useState<string>('');

    useEffect(() => {
        // Check environment capabilities
        if (typeof window !== 'undefined') {
            if (!window.isSecureContext) {
                setCameraStatus('insecure');
                setStatusMessage('Requires HTTPS connection');
            } else if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setCameraStatus('unsupported');
                setStatusMessage('Camera API not supported');
            } else {
                setCameraStatus('ready');
                setStatusMessage('Auto-level & guidance');
            }
        }
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            onImageSelect(url);
        }
    };

    const isSmartCameraDisabled = cameraStatus !== 'ready';

    return (
        <div className="w-full space-y-4">
            {/* Smart Camera Button */}
            <button
                onClick={isSmartCameraDisabled ? undefined : onSmartCameraClick}
                disabled={isSmartCameraDisabled}
                className={`w-full p-8 rounded-2xl text-white shadow-lg transition-all flex flex-col items-center gap-3 relative overflow-hidden
                    ${isSmartCameraDisabled
                        ? 'bg-gray-400 cursor-not-allowed opacity-80'
                        : 'bg-gradient-to-br from-blue-500 to-blue-700 hover:shadow-xl active:scale-95 cursor-pointer'
                    }`}
            >
                <div className={`p-3 rounded-full ${isSmartCameraDisabled ? 'bg-white/10' : 'bg-white/20'}`}>
                    {isSmartCameraDisabled ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                        </svg>
                    )}
                </div>
                <div className="text-center z-10">
                    <span className="block text-xl font-bold">
                        {cameraStatus === 'loading' ? 'Checking Camera...' : 'Smart Camera'}
                    </span>
                    <span className={`text-sm ${isSmartCameraDisabled ? 'text-red-100 font-medium' : 'text-blue-100'}`}>
                        {statusMessage}
                    </span>
                </div>

                {/* Visual indicator for disabled state */}
                {isSmartCameraDisabled && (
                    <div className="absolute inset-0 bg-black/10" />
                )}
            </button>

            {/* Standard Upload */}
            <div
                className="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-gray-400"
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
                <span className="text-sm font-medium">Upload from Gallery / Camera App</span>
            </div>
        </div>
    );
}
