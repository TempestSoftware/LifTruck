import { PRICING_LOGIC, REQUIRED_DOCS } from './config.js';

// --- CONFIGURATION ---
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz1jnpJSUAMX8uBjhfz4ZcJIM0GFgVOD5A6c4EwdPhdWujq6T1nGhmP7LwNvezkHZsc7A/exec"; 
const MK_WHATSAPP = "254794152875";

// --- TAB NAVIGATION (The "Infinity" Fix) ---
const tabBook = document.getElementById('tabBook');
const tabDrive = document.getElementById('tabDrive');
const clientSection = document.getElementById('clientSection');
const driverSection = document.getElementById('driverSection');

// Using window. to ensure buttons work even if there's a script delay
window.switchTab = function(target) {
    if (target === 'drive') {
        clientSection.classList.add('hidden');
        driverSection.classList.remove('hidden');
        tabDrive.classList.add('tab-active');
        tabBook.classList.remove('tab-active');
    } else {
        driverSection.classList.add('hidden');
        clientSection.classList.remove('hidden');
        tabBook.classList.add('tab-active');
        tabDrive.classList.remove('tab-active');
    }
};

// Re-attach listeners to the header buttons
tabDrive.onclick = () => window.switchTab('drive');
tabBook.onclick = () => window.switchTab('client');

// --- CORE MATH (HAVERSINE) ---
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// --- DATABASE FETCHING ---
async function getLiveDrivers() {
    try {
        // This calls the Apps Script we just updated
        const res = await fetch(`${SCRIPT_URL}?type=getDrivers`);
        const drivers = await res.json();
        
        // Map the approved drivers into the format the website uses
        return drivers.map(d => ({
            name: d[0], 
            phone: d[1], 
            plate: d[2], 
            vehicle: d[3], 
            class: d[3].toLowerCase().includes('lorry') ? 'heavy' : 
                   d[3].toLowerCase().includes('pickup') ? 'large' : 'medium'
        }));
    } catch (e) {
        console.error("Database error:", e);
        return []; 
    }
}

// --- CLIENT LOGIC ---
document.getElementById('calculateBtn').onclick = async () => {
    const cName = document.getElementById('clientName').value;
    const cPhone = document.getElementById('clientPhone').value;
    const pickup = document.getElementById('pickup').value;
    const dropoff = document.getElementById('dropoff').value;
    const wClass = document.getElementById('weightSelect').value;

    if (!cName || !cPhone || !pickup || !dropoff) return alert("Please fill all fields!");

    const btn = document.getElementById('calculateBtn');
    btn.innerText = "Processing...";

    try {
        const [res1, res2] = await Promise.all([
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickup + ", Kenya")}`),
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dropoff + ", Kenya")}`)
        ]);
        const [data1, data2] = await Promise.all([res1.json(), res2.json()]);

        const rawDist = getDistance(data1[0].lat, data1[0].lon, data2[0].lat, data2[0].lon);
        const actualDist = rawDist * 1.3;
        const rates = PRICING_LOGIC[wClass];
        const finalPrice = Math.ceil(actualDist < 1 ? rates.base : rates.base + (actualDist * rates.perKm));

        const allDrivers = await getLiveDrivers();
        const filtered = allDrivers.filter(d => d.class === wClass || wClass === 'medium');

        renderDriverResults(actualDist.toFixed(1) + " KM", finalPrice, cName, cPhone, pickup, dropoff, filtered);
        btn.innerText = "Calculate Rate & Find Drivers";

    } catch (err) {
        alert("Error finding locations.");
        btn.innerText = "Calculate Rate & Find Drivers";
    }
};

function renderDriverResults(distLabel, price, cName, cPhone, pick, drop, drivers) {
    const list = document.getElementById('driverList');
    list.innerHTML = `
        <div class="bg-purple-900 text-white p-5 rounded-2xl flex justify-between shadow-lg mb-6">
            <span>Distance: ${distLabel}</span>
            <span>Total: KES ${price}</span>
        </div>
        ${drivers.map(d => `
            <div class="bg-white p-5 rounded-2xl border flex justify-between items-center shadow-sm mb-4">
                <div>
                    <h4 class="font-bold text-gray-800">${d.name}</h4>
                    <p class="text-xs text-purple-600 font-bold uppercase">${d.vehicle} • ${d.plate}</p>
                </div>
                <button onclick="window.confirmAndBook('${d.name}', ${price}, '${cName}', '${cPhone}', '${pick}', '${drop}')" 
                    class="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold">Book</button>
            </div>`).join('')}
    `;
}

// --- GLOBAL EXPOSURE (Fixes the javascript:void(0) error) ---
window.confirmAndBook = async (dName, price, cName, cPhone, pick, drop) => {
    const booking = { name: cName, phone: cPhone, pickup: pick, destination: drop, vehicle: dName, price: price };
    
    // Save to Sheet
    fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ type: "newBooking", ...booking }) });

    // WhatsApp
    const msg = encodeURIComponent(`*LIFTRUCK BOOKING*\nClient: ${cName}\nDriver: ${dName}\nRoute: ${pick} to ${drop}\nPrice: KES ${price}`);
    window.location.href = `https://wa.me/${MK_WHATSAPP}?text=${msg}`;
};

window.openTerms = function(type) {
    const modal = document.getElementById('termsModal');
    const title = document.getElementById('modalTitle');
    const content = document.getElementById('modalContent');
    
    const terms = {
        driver: `<p><b>Driver Terms:</b> Independent contractor status. You are responsible for cargo safety and traffic laws.</p>`,
        client: `<p><b>Client Terms:</b> LifTruck is a platform. We connect you to drivers but are not the transporters.</p>`
    };

    title.innerText = type === 'driver' ? "Driver Terms" : "Client Terms";
    content.innerHTML = terms[type];
    modal.classList.remove('hidden');
};

window.closeTerms = () => document.getElementById('termsModal').classList.add('hidden');

// Attach closing logic to modal buttons
document.getElementById('closeModal').onclick = window.closeTerms;
document.getElementById('modalOk').onclick = window.closeTerms;

// Registration Logic
document.getElementById('driverForm').onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('dName').value;
    const phone = document.getElementById('dPhone').value;
    const msg = encodeURIComponent(`*NEW DRIVER*\nName: ${name}\nPhone: ${phone}\nReady for verification.`);
    window.location.href = `https://wa.me/${MK_WHATSAPP}?text=${msg}`;
};
