'use client';

import { useState, useEffect } from 'react';
import { BOTTLES, APP_VERSION } from '@/lib/constants';
import { saveMeasurement, cleanupHistory } from '@/lib/storage';
import BottleSelector from '@/components/BottleSelector';
import ImageUploader from '@/components/ImageUploader';
import MeasurementCanvas from '@/components/MeasurementCanvas';
import Options from '@/components/Options';
import History from '@/components/History';

type Step = 'upload' | 'measure' | 'result';

export default function Home() {
  const [step, setStep] = useState<Step>('upload');
  const [selectedBottleId, setSelectedBottleId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(0);
  const [showOptions, setShowOptions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Load default bottle on mount and cleanup history
  useEffect(() => {
    const storedDefault = localStorage.getItem('defaultBottleId');
    if (storedDefault) {
      setSelectedBottleId(storedDefault);
    } else {
      // Default to first bottle if nothing saved
      setSelectedBottleId(BOTTLES[0].id);
    }
    cleanupHistory();
  }, []);

  const selectedBottle = BOTTLES.find(b => b.id === selectedBottleId) || BOTTLES[0];

  const handleImageSelect = (url: string) => {
    setImageUrl(url);
    setStep('measure');
  };

  const handleReset = () => {
    setStep('upload');
    setImageUrl(null);
    setVolume(0);
    // Keep selected bottle
  };

  const handleConfirm = () => {
    if (imageUrl && selectedBottleId) {
      // Convert image URL to Base64 (simplified for blob URLs, might need fetch)
      // Since we use createObjectURL, we need to fetch the blob and convert to base64
      fetch(imageUrl)
        .then(r => r.blob())
        .then(blob => {
          saveMeasurement({
            volume,
            bottleId: selectedBottleId,
            imageData: blob
          });
        });
    }
    setStep('result');
  };

  return (
    <div className="flex flex-col h-screen relative">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md z-10 flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          💧 PeeMeter <span className="text-xs font-normal opacity-70 bg-blue-800 px-1.5 py-0.5 rounded-full">v{APP_VERSION}</span>
        </h1>
        <div className="flex items-center gap-2">
          {step !== 'upload' && (
            <button
              onClick={handleReset}
              className="text-sm bg-blue-700 px-3 py-1 rounded hover:bg-blue-800 transition"
            >
              New
            </button>
          )}
          <button
            onClick={() => setShowHistory(true)}
            className="p-1 rounded hover:bg-blue-700 transition"
            title="History"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            onClick={() => setShowOptions(true)}
            className="p-1 rounded hover:bg-blue-700 transition"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Modals */}
      {showOptions && (
        <Options
          onClose={() => setShowOptions(false)}
          onUpdate={(newId) => setSelectedBottleId(newId)}
        />
      )}
      {showHistory && <History onClose={() => setShowHistory(false)} />}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {step === 'upload' && (
          <div className="space-y-6 my-auto">
            <div className="text-center py-4">
              <h2 className="text-2xl font-bold text-gray-800">Capture Photo</h2>
              <p className="text-gray-500">Take a clear photo of the bottle upright</p>
            </div>
            <ImageUploader onImageSelect={handleImageSelect} />
            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
              <strong>Tip:</strong> Ensure the liquid level and the bottle's shoulder are clearly visible.
            </div>
          </div>
        )}

        {step === 'measure' && imageUrl && (
          <div className="flex flex-col landscape:flex-row h-full overflow-hidden">
            {/* Left Side (or Top): Canvas */}
            <div className="flex-1 min-h-0 relative flex flex-col">
              <div className="flex items-center justify-between p-2 shrink-0 landscape:hidden">
                <div className="flex items-center gap-2 text-gray-500 cursor-pointer" onClick={() => setStep('upload')}>
                  <span>← Retake</span>
                </div>
              </div>

              <div className="flex-1 relative m-2 rounded-lg overflow-hidden border border-gray-200 bg-black">
                <MeasurementCanvas
                  imageUrl={imageUrl}
                  bottle={selectedBottle}
                  onVolumeChange={setVolume}
                />

                {/* Retake button overlay for landscape */}
                <button
                  onClick={() => setStep('upload')}
                  className="hidden landscape:flex absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm hover:bg-black/70 transition backdrop-blur-sm z-50"
                >
                  ← Retake
                </button>
              </div>
            </div>

            {/* Right Side (or Bottom): Controls */}
            <div className="shrink-0 p-3 bg-white border-t landscape:border-t-0 landscape:border-l border-gray-100 landscape:w-80 landscape:flex landscape:flex-col landscape:justify-center overflow-y-auto">
              {/* Compact Bottle Selector */}
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2 hidden landscape:block">Container Type</p>
                <BottleSelector
                  selectedId={selectedBottleId}
                  onSelect={setSelectedBottleId}
                  compact={true}
                />
              </div>

              <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-4 landscape:flex-col landscape:items-start landscape:gap-2">
                  <span className="text-gray-500 uppercase text-xs font-bold tracking-wider">Estimated Volume</span>
                  <div className="text-3xl font-bold text-blue-600 font-mono">
                    {volume}<span className="text-xl text-gray-400">/{selectedBottle.capacityMl}</span><span className="text-lg text-gray-400 ml-1">ml</span>
                  </div>
                </div>
                <button
                  onClick={handleConfirm}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="flex flex-col items-center justify-center h-full space-y-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Measurement Complete</h2>
              <p className="text-gray-500">Recorded volume for patient chart</p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl w-full max-w-xs border border-gray-200">
              <div className="text-6xl font-bold text-gray-900 font-mono mb-2">
                {volume}
              </div>
              <div className="text-xl text-gray-500 font-medium">milliliters</div>
              <div className="mt-2 text-sm text-gray-400">
                Container: {selectedBottle.name}
              </div>
            </div>

            <button
              onClick={handleReset}
              className="px-8 py-3 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-800 transition-colors"
            >
              Start New Measurement
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
