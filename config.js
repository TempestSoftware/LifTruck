// 1. Pricing & Weight Logic
export const PRICING_LOGIC = {
    small: { 
        label: 'Small (Bike/Probox)', 
        base: 300, 
        perKm: 30, 
        maxWeight: 50 
    },
    medium: { 
        label: 'Medium (Van/Pickup)', 
        base: 600, 
        perKm: 50, 
        maxWeight: 500 
    },
    large: { 
        label: 'Large (Light Truck)', 
        base: 1200, 
        perKm: 80, 
        maxWeight: 2000 
    },
    heavy: { 
        label: 'Heavy (Lorry)', 
        base: 2500, 
        perKm: 150, 
        maxWeight: 10000 
    }
};

// 2. The Active Fleet (This is what shows up on the website)
// When MK approves a driver, you add them here.
export const initialDrivers = [
   
];

// 3. Document Checklist (For the WhatsApp Bridge)
export const REQUIRED_DOCS = [
    "National ID (Front & Back)",
    "Driving License",
    "NTSA Inspection Certificate",
    "Vehicle Insurance",
    "Vehicle Logbook"
];
