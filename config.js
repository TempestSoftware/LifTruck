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
    { 
        id: 1, 
        name: "John Kariuki", 
        vehicle: "Toyota Probox", 
        plate: "KCP 442Z", 
        class: "small", 
        status: "Available" 
    },
    { 
        id: 2, 
        name: "John Kariuki", 
        vehicle: "Toyota Probox", 
        plate: "KCP 442Z", 
        class: "medium", 
        status: "Available" 
    },
    { 
        id: 3, 
        name: "Sarah Wanjiku", 
        vehicle: "Isuzu FRR", 
        plate: "KDD 901L", 
        class: "large", 
        status: "Available" 
    },
    { 
        id: 4, 
        name: "Mike’s Logistics", 
        vehicle: "Mercedes Actros", 
        plate: "ZEE 554A", 
        class: "heavy", 
        status: "Occupied" // This driver won't show up on the client side!
    }
];

// 3. Document Checklist (For the WhatsApp Bridge)
export const REQUIRED_DOCS = [
    "National ID (Front & Back)",
    "Driving License",
    "NTSA Inspection Certificate",
    "Vehicle Insurance",
    "Vehicle Logbook"
];
