import { PRICING_LOGIC, initialDrivers } from './config.js';

// --- Tab Navigation ---
const tabBook = document.getElementById('tabBook');
const tabDrive = document.getElementById('tabDrive');
const clientSection = document.getElementById('clientSection');
const driverSection = document.getElementById('driverSection');

tabDrive.onclick = () => {
    clientSection.classList.add('hidden');
    driverSection.classList.remove('hidden');
    tabDrive.classList.add('tab-active');
    tabBook.classList.remove('tab-active');
};

tabBook.onclick = () => {
    driverSection.classList.add('hidden');
    clientSection.classList.remove('hidden');
    tabBook.classList.add('tab-active');
    tabDrive.classList.remove('tab-active');
};

// --- Haversine Math ---
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // KM
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// --- Client Booking Logic ---
document.getElementById('calculateBtn').onclick = async () => {
    const cName = document.getElementById('clientName').value;
const cPhone = document.getElementById('clientPhone').value;
    const pickup = document.getElementById('pickup').value;
    const dropoff = document.getElementById('dropoff').value;
    const wClass = document.getElementById('weightSelect').value;
    // Update the button's onclick URL:
const whatsappMsg = *LIFTRUCK BOOKING REQUEST*%0A +
     --------------------------%0A +
                    *Client Name:* ${cName}%0A +
                    *Client Phone:* ${cPhone};

                    --------------------------%0A +
                    *Driver:* ${d.name}%0A +
                    *From:* ${pick}%0A +
                    *To:* ${drop}%0A +
                    *Price:* KES ${Math.ceil(price)}%0A +
                   
// The button HTML:
<button onclick="window.location.href='https://wa.me/2547XXXXXXXX?text=${whatsappMsg}'" 
    class="bg-purple-600 text-white px-5 py-2 rounded-xl text-sm font-bold">
    Select Driver
</button>

    if (!pickup || !dropoff) return alert("Please enter both locations");

    // Mocking Geocoding (In a real app, you'd fetch Lat/Long from a search API)
    // For now, let's assume a random distance for testing, 
    // but the logic below handles the "Short Move" scenario:
    
    let simulatedDistance = Math.random() * 15; // Random 0-15km for demo
    if(pickup.toLowerCase().includes("next door")) simulatedDistance = 0.5;

    const rates = PRICING_LOGIC[wClass];
    
    // --- The 1KM Logic ---
    let finalPrice;
    let distanceLabel;
    
    if (simulatedDistance < 1) {
        finalPrice = rates.base; // Flat fee for ultra-short moves
        distanceLabel = "Short Distance Move (Under 1KM)";
    } else {
        finalPrice = rates.base + (simulatedDistance * rates.perKm);
        distanceLabel = `${simulatedDistance.toFixed(1)} KM`;
    }

    const available = initialDrivers.filter(d => d.class === wClass && d.status === "Available");

    document.getElementById('driverList').innerHTML = `
        <div class="bg-purple-900 text-white p-4 rounded-2xl flex justify-between">
            <span>Distance: ${distanceLabel}</span>
            <span class="font-bold">Total: KES ${Math.ceil(finalPrice)}</span>
        </div>
        ${available.map(d => `
            <div class="bg-white p-5 rounded-2xl border flex justify-between items-center shadow-sm">
                <div>
                    <h4 class="font-bold text-gray-800">${d.name}</h4>
                    <p class="text-xs text-purple-600 font-bold">${d.vehicle} • ${d.plate}</p>
                </div>
                <button onclick="window.location.href='https://wa.me/2547XXXXXXXX?text=Booking request for ${d.name}. Pick up at ${pickup}, Drop at ${dropoff}. Price: KES ${Math.ceil(finalPrice)}'" 
                    class="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold">Book</button>
            </div>
        `).join('')}
    `;
};

// --- Driver WhatsApp Logic ---
import { REQUIRED_DOCS } from './config.js';

document.getElementById('driverForm').onsubmit = (e) => {
    e.preventDefault();
    
    const name = document.getElementById('dName').value;
    const plate = document.getElementById('dPlate').value;
    
    // This part dynamically creates the checklist for the WhatsApp message
    const docChecklist = REQUIRED_DOCS.map(doc => `[ ] ${doc}`).join('%0A');

    const msg = `*NEW DRIVER APPLICATION*%0A` +
                `Name: ${name}%0A` +
                `Plate: ${plate}%0A%0A` +
                `*I will now send these documents:*%0A${docChecklist}`;

    const mkNumber = "2547XXXXXXXX"; // Replace with MK's actual number
    window.location.href = `https://wa.me/${mkNumber}?text=${msg}`;
};
// --- TERMS & CONDITIONS MODAL LOGIC ---

// 1. Grab the Modal Elements
const termsModal = document.getElementById('termsModal');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');
const closeModal = document.getElementById('closeModal');
const modalOk = document.getElementById('modalOk');

// 2. The Data (Condensed for the UI)
const LEGAL_CONTENT = {
    driver: `
        <div class="space-y-4">
            <p class="font-bold text-purple-700">Effective: 5/6/2026</p>
            <p><b>Contractor Status:</b> You are an independent contractor, not an employee. You provide services directly to the client.</p>
            <p><b>Responsibility:</b> You accept full liability for goods. Theft, loss, or damage due to negligence is your responsibility.</p>
            <p><b>Conduct:</b> No unauthorized passengers, no diversions, and no demanding extra payment outside the platform.</p>
            <p><b>Tracking:</b> You agree to live GPS tracking while on active trips.</p>
        </div>
    `,
    client: `
        <div class="space-y-4">
            <p class="font-bold text-purple-700">Effective: 5/6/2026</p>
            <p><b>Platform Role:</b> LifTruck is a matching platform, not a transporter. We do not own vehicles or handle goods.</p>
            <p><b>Cargo:</b> You must provide accurate weight/type details. Misdeclaration leads to extra charges.</p>
            <p><b>Liability:</b> The Driver is primarily responsible for goods. LifTruck is not liable for theft or damage unless optional insurance is purchased.</p>
            <p><b>Prohibited:</b> No illegal drugs, weapons, or bulk cash.</p>
        </div>
    `
};

// 3. The Function to Open the Modal
// This is what the "Terms & Conditions" link in your HTML will call
window.openTerms = function(type) {
    if (LEGAL_CONTENT[type]) {
        modalTitle.innerText = type === 'driver' ? "Driver Terms & Conditions" : "Client Terms & Conditions";
        modalContent.innerHTML = LEGAL_CONTENT[type];
        termsModal.classList.remove('hidden');
        // Prevent background scrolling while modal is open
        document.body.style.overflow = 'hidden';
    }
};

// 4. Closing Logic
const hideModal = () => {
    termsModal.classList.add('hidden');
    document.body.style.overflow = 'auto'; // Re-enable scrolling
};

closeModal.onclick = hideModal;
modalOk.onclick = hideModal;

// Close if they click outside the white box
termsModal.onclick = (e) => {
    if (e.target === termsModal) hideModal();
};
