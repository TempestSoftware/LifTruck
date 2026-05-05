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
    const pickup = document.getElementById('pickup').value;
    const dropoff = document.getElementById('dropoff').value;
    const wClass = document.getElementById('weightSelect').value;

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
document.getElementById('driverForm').onsubmit = (e) => {
    e.preventDefault();
    const msg = `Hi MK, I want to apply to LifTruck. Name: ${document.getElementById('dName').value}, Plate: ${document.getElementById('dPlate').value}. I will now send my documents.`;
    window.location.href = `https://wa.me/2547XXXXXXXX?text=${encodeURIComponent(msg)}`;
};
