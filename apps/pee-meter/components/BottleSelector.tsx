'use client';

import { BOTTLES } from '@/lib/constants';

interface BottleSelectorProps {
    selectedId: string | null;
    onSelect: (id: string) => void;
    compact?: boolean;
}

export default function BottleSelector({ selectedId, onSelect, compact = false }: BottleSelectorProps) {
    if (compact) {
        return (
            <div className="flex overflow-x-auto gap-3 pb-2 snap-x w-full">
                {BOTTLES.map((bottle) => (
                    <button
                        key={bottle.id}
                        onClick={() => onSelect(bottle.id)}
                        className={`flex-shrink-0 snap-center flex items-center justify-center p-3 border rounded-full transition-all ${selectedId === bottle.id
                            ? 'border-blue-500 bg-blue-600 text-white shadow-md'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                        title={bottle.name}
                    >
                        <span className="text-2xl">{bottle.id.includes('pet') ? '🧴' : '🏥'}</span>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {BOTTLES.map((bottle) => (
                <button
                    key={bottle.id}
                    onClick={() => onSelect(bottle.id)}
                    className={`relative flex flex-col items-center p-4 border-2 rounded-xl transition-all ${selectedId === bottle.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                        }`}
                >
                    <div className="h-16 w-16 mb-3 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
                        {bottle.id.includes('pet') ? '🧴' : '🏥'}
                    </div>
                    <h3 className="font-semibold text-gray-900">{bottle.name}</h3>
                    <p className="text-sm text-gray-500">{bottle.description}</p>
                    {selectedId === bottle.id && (
                        <div className="absolute top-2 right-2 text-blue-500">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}
                </button>
            ))}
        </div>
    );
}
