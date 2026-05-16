/**
 * LIFTRUCK CONFIGURATION HUB
 * Section: Pricing, Labels, and Legal Requirements
 */

// 1. Pricing & Weight Logic (KES)
export const PRICING_LOGIC = {
    small: { 
        label: 'Small (Bike/Probox)', 
        base: 200, 
        perKm: 35, 
        maxWeight: 50 
    },
    medium: { 
        label: 'Medium (Van/Pickup)', 
        base: 600, 
        perKm: 55, 
        maxWeight: 500 
    },
    large: { 
        label: 'Large (Light Truck)', 
        base: 1500, 
        perKm: 85, 
        maxWeight: 2000 
    },
    heavy: { 
        label: 'Heavy (Lorry)', 
        base: 3500, 
        perKm: 130, 
        maxWeight: 10000 
    }
};

// 2. Document Checklist (For the WhatsApp Bridge)
export const REQUIRED_DOCS = [
    "✅ National ID (Front & Back)",
    "✅ Valid Driving License",
    "✅ NTSA Inspection Certificate",
    "✅ Valid Vehicle Insurance",
    "✅ Vehicle Logbook"
];

// 3. Business Contact
export const MK_WHATSAPP = "254794152875";
