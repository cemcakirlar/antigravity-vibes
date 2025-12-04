'use client';

import { useState, useEffect } from 'react';
import { getHistory, deleteMeasurement, Measurement } from '@/lib/storage';
import { BOTTLES } from '@/lib/constants';

interface HistoryProps {
    onClose: () => void;
}

export default function History({ onClose }: HistoryProps) {
    const [history, setHistory] = useState<Measurement[]>([]);
    const [selectedItem, setSelectedItem] = useState<Measurement | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        loadHistory();
    }, []);

    useEffect(() => {
        if (selectedItem) {
            const url = URL.createObjectURL(selectedItem.imageData);
            setImageUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setImageUrl(null);
        }
    }, [selectedItem]);

    const loadHistory = async () => {
        const data = await getHistory();
        setHistory(data);
    };

    const handleDelete = async (id: string) => {
        await deleteMeasurement(id);
        setHistory(prev => prev.filter(m => m.id !== id));
        if (selectedItem?.id === id) setSelectedItem(null);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 h-[80vh] flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                    <h2 className="text-lg font-bold text-gray-900">History</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {selectedItem ? (
                        <div className="flex-1 flex flex-col p-4 overflow-y-auto">
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="flex items-center gap-2 text-blue-600 font-medium mb-4 hover:text-blue-800"
                            >
                                ← Back to List
                            </button>

                            <div className="bg-black rounded-lg overflow-hidden mb-4 relative aspect-[3/4]">
                                {imageUrl && (
                                    <img
                                        src={imageUrl}
                                        alt="Measurement"
                                        className="absolute inset-0 w-full h-full object-contain"
                                    />
                                )}
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-semibold text-gray-700">Volume</span>
                                    <span className="text-2xl font-bold text-blue-700">{selectedItem.volume}ml</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-semibold text-gray-700">Date</span>
                                    <span className="font-medium text-gray-900">{formatDate(selectedItem.timestamp)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-semibold text-gray-700">Container</span>
                                    <span className="font-medium text-gray-900">
                                        {BOTTLES.find(b => b.id === selectedItem.bottleId)?.name || 'Unknown'}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleDelete(selectedItem.id)}
                                className="mt-auto w-full py-3 text-red-600 font-medium hover:bg-red-50 rounded-xl transition-colors"
                            >
                                Delete Measurement
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p>No history yet</p>
                                </div>
                            ) : (
                                history.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedItem(item)}
                                        className="w-full flex items-center gap-4 p-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-left"
                                    >
                                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl shrink-0">
                                            {item.bottleId.includes('pet') ? '🧴' : '🏥'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-gray-900">{item.volume}ml</div>
                                            <div className="text-xs text-gray-600 truncate">
                                                {formatDate(item.timestamp)}
                                            </div>
                                        </div>
                                        <div className="text-gray-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                            </svg>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
