// Weight Class Definitions
export const WEIGHT_CLASSES = {
    SMALL: { id: 'small', label: 'Small (Up to 50kg - Bike/Small Car)', maxWeight: 50 },
    MEDIUM: { id: 'medium', label: 'Medium (51kg - 500kg - Van/Pickup)', maxWeight: 500 },
    LARGE: { id: 'large', label: 'Large (501kg - 2000kg - Light Truck)', maxWeight: 2000 },
    HEAVY: { id: 'heavy', label: 'Heavy (Over 2000kg - Lorry)', maxWeight: 10000 }
};

// Initial Placeholder Drivers
export const initialDrivers = [
    { id: 1, name: "John Kariuki", class: "small", rating: 4.8 },
    { id: 2, name: "Sarah W.", class: "medium", rating: 4.9 },
    { id: 3, name: "Mike Logistics", class: "large", rating: 4.7 },
    { id: 4, name: "Heavy Haulers Ltd", class: "heavy", rating: 4.5 }
];
