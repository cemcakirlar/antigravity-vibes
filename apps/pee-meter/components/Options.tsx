'use client';

import { useState, useEffect } from 'react';
import { BOTTLES } from '@/lib/constants';
import { getRetentionPeriod, setRetentionPeriod, RetentionPeriod } from '@/lib/storage';

interface OptionsProps {
    onClose: () => void;
    onUpdate?: (newId: string) => void;
}

export default function Options({ onClose, onUpdate }: OptionsProps) {
    const [defaultBottleId, setDefaultBottleId] = useState<string>('');
    const [retention, setRetention] = useState<RetentionPeriod>('forever');

    useEffect(() => {
        const stored = localStorage.getItem('defaultBottleId');
        if (stored) {
            setDefaultBottleId(stored);
        }
        setRetention(getRetentionPeriod());
    }, []);

    const handleSave = () => {
        if (defaultBottleId) {
            localStorage.setItem('defaultBottleId', defaultBottleId);
            if (onUpdate) onUpdate(defaultBottleId);
        } else {
            localStorage.removeItem('defaultBottleId');
        }
        setRetentionPeriod(retention);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
                    <h2 className="text-lg font-bold text-gray-900">Settings</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Default Bottle Section */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                            Default Container
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                            Pre-selected container for new measurements.
                        </p>
                        <div className="space-y-2">
                            {BOTTLES.map((bottle) => (
                                <label
                                    key={bottle.id}
                                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${defaultBottleId === bottle.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="defaultBottle"
                                        value={bottle.id}
                                        checked={defaultBottleId === bottle.id}
                                        onChange={(e) => setDefaultBottleId(e.target.value)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="ml-3 text-sm font-medium text-gray-900">{bottle.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Retention Section */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                            History Retention
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                            Automatically delete old measurements.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { val: 'forever', label: 'Keep Forever' },
                                { val: '24h', label: '24 Hours' },
                                { val: '7d', label: '7 Days' },
                                { val: '30d', label: '30 Days' },
                            ].map((opt) => (
                                <label
                                    key={opt.val}
                                    className={`flex items-center justify-center p-2 border rounded-lg cursor-pointer text-sm font-medium transition-colors ${retention === opt.val
                                            ? 'border-blue-500 bg-blue-600 text-white'
                                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="retention"
                                        value={opt.val}
                                        checked={retention === opt.val}
                                        onChange={(e) => setRetention(e.target.value as RetentionPeriod)}
                                        className="hidden"
                                    />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end sticky bottom-0 z-10">
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
