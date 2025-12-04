export type BottleType = {
    id: string;
    name: string;
    capacityMl: number;
    description?: string;
};

export const BOTTLES: BottleType[] = [
    {
        id: 'pet-500',
        name: '500ml Pet Bottle',
        capacityMl: 500,
        description: 'Standard small water bottle'
    },
    {
        id: 'pet-1500',
        name: '1.5L Pet Bottle',
        capacityMl: 1500,
        description: 'Standard large water bottle'
    },
    {
        id: 'hospital-urinal',
        name: 'Medical Urinal',
        capacityMl: 1000,
        description: 'Standard hospital handheld urinal'
    },
];

export const APP_VERSION = '1.0.0';
