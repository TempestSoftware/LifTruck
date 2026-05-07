import { PRICING_LOGIC, REQUIRED_DOCS } from './config.js';

// --- CONFIGURATION ---
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz1jnpJSUAMX8uBjhfz4ZcJIM0GFgVOD5A6c4EwdPhdWujq6T1nGhmP7LwNvezkHZsc7A/exec"; 
const MK_WHATSAPP = "254794152875";

// --- TAB NAVIGATION ---
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

// --- CORE MATH (HAVERSINE) ---
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// --- DATABASE: FETCH APPROVED DRIVERS ---
async function getLiveDrivers() {
    try {
        const res = await fetch(`${SCRIPT_URL}?type=getDrivers`);
        const drivers = await res.json();
        // Mapping sheet columns: 0:Name, 1:Phone, 2:Plate, 3:Vehicle, 4:Status
        return drivers.map(d => ({
            name: d[0], phone: d[1], plate: d[2], vehicle: d[3], 
            class: d[3].toLowerCase().includes('lorry') ? 'heavy' : 
                   d[3].toLowerCase().includes('pickup') ? 'large' : 'medium', 
            status: "Available"
        }));
    } catch (e) {
        console.error("Driver Fetch Error:", e);
        return []; // Fallback to empty if sheet fails
    }
}

// --- DATABASE: SAVE BOOKING ---
async function submitBookingToSheet(booking) {
    await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Needed for Google Apps Script POST
        body: JSON.stringify({ type: "newBooking", ...booking })
    });
}

// --- CLIENT LOGIC: CALCULATE & SEARCH ---
document.getElementById('calculateBtn').onclick = async () => {
    const cName = document.getElementById('clientName').value;
    const cPhone = document.getElementById('clientPhone').value;
    const pickup = document.getElementById('pickup').value;
    const dropoff = document.getElementById('dropoff').value;
    const wClass = document.getElementById('weightSelect').value;

    if (!cName || !cPhone || !pickup || !dropoff) return alert("Please fill all fields!");

    const btn = document.getElementById('calculateBtn');
    btn.innerText = "Locating on Map...";
    btn.disabled = true;

    try {
        // 1. Geocoding
        const [res1, res2] = await Promise.all([
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickup + ", Kenya")}`),
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dropoff + ", Kenya")}`)
        ]);
        const [data1, data2] = await Promise.all([res1.json(), res2.json()]);

        if (data1.length === 0 || data2.length === 0) {
            btn.innerText = "Calculate Rate & Find Drivers";
            btn.disabled = false;
            return alert("Location not found. Try adding town name (e.g. 'Makongeni Thika')");
        }

        // 2. Distance + 30% Road Buffer
        const rawDist = getDistance(data1[0].lat, data1[0].lon, data2[0].lat, data2[0].lon);
        const actualDist = rawDist * 1.3;

        // 3. Pricing
        const rates = PRICING_LOGIC[wClass];
        const finalPrice = actualDist < 1 ? rates.base : rates.base + (actualDist * rates.perKm);
        const distLabel = actualDist < 1 ? "Short Move (<1KM)" : `${actualDist.toFixed(1)} KM`;

        // 4. Fetch Approved Drivers
        const allDrivers = await getLiveDrivers();
        const filtered = allDrivers.filter(d => d.class === wClass || wClass === 'medium'); // Simplified logic

        renderDriverResults(distLabel, finalPrice, cName, cPhone, pickup, dropoff, filtered);

        btn.innerText = "Calculate Rate & Find Drivers";
        btn.disabled = false;

    } catch (err) {
        alert("Connectivity error. Try again.");
        btn.disabled = false;
    }
};

function renderDriverResults(distLabel, price, cName, cPhone, pick, drop, drivers) {
    const list = document.getElementById('driverList');
    list.innerHTML = `
        <div class="bg-purple-900 text-white p-5 rounded-2xl flex justify-between shadow-lg mb-6">
            <span>Est. Distance: <b>${distLabel}</b></span>
            <span>Total: <b>KES ${Math.ceil(price)}</b></span>
        </div>
        ${drivers.length > 0 ? drivers.map(d => {
            const msg = encodeURIComponent(
                `*LIFTRUCK BOOKING REQUEST*\n` +
                `Client: ${cName} (${cPhone})\n` +
                `Route: ${pick} to ${drop}\n` +
                `Vehicle: ${d.vehicle} (${d.plate})\n` +
                `Quote: KES ${Math.ceil(price)}`
            );
            return `
            <div class="bg-white p-5 rounded-2xl border-2 border-purple-50 flex justify-between items-center shadow-sm mb-4">
                <div>
                    <h4 class="font-bold text-gray-800">${d.name}</h4>
                    <p class="text-xs text-purple-600 font-bold uppercase">${d.vehicle} • ${d.plate}</p>
                </div>
                <button onclick="confirmAndBook('${d.name}', ${price}, '${cName}', '${cPhone}', '${pick}', '${drop}', '${msg}')" 
                    class="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold shadow-md">Book</button>
            </div>`;
        }).join('') : '<p class="text-center text-gray-400">No approved drivers available for this class yet.</p>'}
    `;
}

window.confirmAndBook = async (dName, price, cName, cPhone, pick, drop, msg) => {
    const booking = { name: cName, phone: cPhone, pickup: pick, destination: drop, vehicle: dName, price: Math.ceil(price) };
    await submitBookingToSheet(booking);
    window.location.href = `https://wa.me/${MK_WHATSAPP}?text=${msg}`;
};

// --- DRIVER REGISTRATION ---
document.getElementById('driverForm').onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('dName').value;
    const phone = document.getElementById('dPhone').value;
    const plate = document.getElementById('dPlate').value;
    const type = document.getElementById('dVehType').value;

    const checklist = REQUIRED_DOCS.map(doc => `[ ] ${doc}`).join('\n');
    const msg = encodeURIComponent(
        `*NEW DRIVER REGISTRATION*\n` +
        `Name: ${name}\n` +
        `Phone: ${phone}\n` +
        `Plate: ${plate}\n` +
        `Vehicle: ${type}\n\n` +
        `*Documents I will send:*\n${checklist}`
    );

    window.location.href = `https://wa.me/${MK_WHATSAPP}?text=${msg}`;
};

// --- DASHBOARD: LIVE STATUS ---
async function loadDashboard() {
    const dash = document.getElementById('clientDashboard');
    if (!dash) return;
    
    try {
        const res = await fetch(`${SCRIPT_URL}?type=getDashboard`);
        const data = await res.json();
        dash.innerHTML = data.slice(-5).reverse().map(b => `
            <div class="flex justify-between items-center p-3 border-b text-xs">
                <div>
                    <p class="font-bold text-gray-800">${b[2]} → ${b[3]}</p>
                    <p class="text-gray-500 italic">Driver: ${b[6]}</p>
                </div>
                <span class="font-black ${b[7] === 'Pending' ? 'text-orange-500' : 'text-green-600'}">${b[7]}</span>
            </div>
        `).join('');
    } catch (e) { dash.innerHTML = "Log in to see status."; }
}

// --- TERMS MODAL ---
const termsModal = document.getElementById('termsModal');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');

const LEGAL_CONTENT = {
    driver: `<p><b>Contractor Status:</b> You are an independent contractor, not an employee. Liability for goods lies with the driver.</p>`,
    client: `<p><b>Platform Role:</b> LifTruck is a marketplace. We do not own vehicles or handle goods directly.</p>`
};

window.openTerms = function(type) {
    modalTitle.innerText = type === 'driver' ? "Driver Terms" : "Client Terms";
    modalContent.innerHTML = LEGAL_CONTENT[type];
    termsModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
};

document.getElementById('closeModal').onclick = () => { 
    termsModal.classList.add('hidden'); 
    document.body.style.overflow = 'auto'; 
};

document.getElementById('modalOk').onclick = () => { 
    termsModal.classList.add('hidden'); 
    document.body.style.overflow = 'auto'; 
};

// Initial Load
loadDashboard();
setInterval(loadDashboard, 60000); // Refresh every minute
