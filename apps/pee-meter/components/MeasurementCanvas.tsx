'use client';

import { useState, useRef, useEffect } from 'react';
import { BottleType } from '@/lib/constants';

interface MeasurementCanvasProps {
    imageUrl: string;
    bottle: BottleType;
    onVolumeChange: (volume: number) => void;
}

export default function MeasurementCanvas({ imageUrl, bottle, onVolumeChange }: MeasurementCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);

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

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full bg-black rounded-lg overflow-hidden touch-none select-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {/* Image */}
            <img
                src={imageUrl}
                alt="Measurement"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-80"
            />

            {/* Lines */}
            {/* Top Line (Max Capacity) */}
            <div
                className="absolute left-0 right-0 h-8 -mt-4 flex items-center cursor-ns-resize group z-20"
                style={{ top: `${lines.top}%` }}
                onPointerDown={(e) => handlePointerDown(e, 'top')}
            >
                <div className="w-full border-t-2 border-dashed border-red-500 shadow-sm group-hover:border-red-400"></div>
                <span className="absolute right-2 -top-6 text-xs font-bold text-red-500 bg-black/50 px-1 rounded">
                    MAX ({bottle.capacityMl}ml)
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
                    LIQUID LEVEL
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
                    BASE (0ml)
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
