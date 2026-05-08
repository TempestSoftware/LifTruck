import { PRICING_LOGIC } from './config.js';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz1jnpJSUAMX8uBjhfz4ZcJIM0GFgVOD5A6c4EwdPhdWujq6T1nGhmP7LwNvezkHZsc7A/exec"; 
const MK_WHATSAPP = "254794152875";

// --- TABS & NAVIGATION ---
window.switchTab = function(target) {
    const client = document.getElementById('clientSection');
    const driver = document.getElementById('driverSection');
    const tabB = document.getElementById('tabBook');
    const tabD = document.getElementById('tabDrive');

    if (target === 'drive') {
        client.classList.add('hidden');
        driver.classList.remove('hidden');
        tabD.classList.add('tab-active');
        tabB.classList.remove('tab-active');
    } else {
        driver.classList.add('hidden');
        client.classList.remove('hidden');
        tabB.classList.add('tab-active');
        tabD.classList.remove('tab-active');
    }
};
document.getElementById('tabBook').onclick = () => switchTab('book');
document.getElementById('tabDrive').onclick = () => switchTab('drive');

// --- MATH & DISTANCE ---
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// --- DATABASE FETCH ---
async function getLiveDrivers() {
    try {
        const res = await fetch(`${SCRIPT_URL}?type=getDrivers`);
        const drivers = await res.json();
        // Mapping: 0:Name, 1:Phone, 2:Plate, 3:Category, 4:Model
        return drivers.map(d => ({
            name: d[0], phone: d[1], plate: d[2], category: d[3], model: d[4]
        }));
    } catch (e) { return []; }
}

// --- CLIENT BOOKING ---
document.getElementById('calculateBtn').onclick = async () => {
    const name = document.getElementById('clientName').value;
    const phone = document.getElementById('clientPhone').value;
    const pick = document.getElementById('pickup').value;
    const drop = document.getElementById('dropoff').value;
    const cat = document.getElementById('weightSelect').value;

    if (!name || !phone || !pick || !drop) return alert("Fill all fields");

    try {
        const [r1, r2] = await Promise.all([
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pick + ", Kenya")}`),
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(drop + ", Kenya")}`)
        ]);
        const [d1, d2] = await Promise.all([r1.json(), r2.json()]);

        const dist = getDistance(d1[0].lat, d1[0].lon, d2[0].lat, d2[0].lon) * 1.3;
        const price = Math.ceil(dist < 1 ? PRICING_LOGIC[cat].base : PRICING_LOGIC[cat].base + (dist * PRICING_LOGIC[cat].perKm));

        const allDrivers = await getLiveDrivers();
        const filtered = allDrivers.filter(d => d.category === cat);

        renderResults(dist.toFixed(1), price, name, phone, pick, drop, filtered);
    } catch (e) { alert("Location error"); }
};

function renderResults(dist, price, cName, cPhone, pick, drop, drivers) {
    const list = document.getElementById('driverList');
    list.innerHTML = `
        <div class="bg-purple-900 text-white p-4 rounded-xl mb-4 flex justify-between">
            <span>Dist: ${dist} KM</span><span>Total: KES ${price}</span>
        </div>
        ${drivers.map(d => `
            <div class="bg-white p-4 rounded-xl border mb-2 flex justify-between items-center">
                <div>
                    <h4 class="font-bold">${d.name}</h4>
                    <p class="text-xs text-purple-600 font-bold uppercase">${d.model} • ${d.plate}</p>
                </div>
                <button onclick="window.confirmBooking('${d.name}', '${d.model}', ${price}, '${cName}', '${cPhone}', '${pick}', '${drop}')" 
                    class="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">Book</button>
            </div>
        `).join('')}
    `;
}

window.confirmBooking = async (dName, dModel, price, cName, cPhone, pick, drop) => {
    const booking = { name: cName, phone: cPhone, pickup: pick, destination: drop, vehicle: `${dName} (${dModel})`, price: price };
    fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ type: "newBooking", ...booking }) });

    const msg = encodeURIComponent(`*NEW BOOKING*\nClient: ${cName}\nDriver: ${dName}\nVehicle: ${dModel}\nRoute: ${pick} to ${drop}\nPrice: KES ${price}`);
    window.location.href = `https://wa.me/${MK_WHATSAPP}?text=${msg}`;
};

// --- DRIVER REGISTRATION ---
document.getElementById('driverForm').onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('dName').value;
    const phone = document.getElementById('dPhone').value;
    const plate = document.getElementById('dPlate').value;
    const model = document.getElementById('dModel').value; // THE NEW FIELD
    const cat = document.getElementById('dVehType').value;

    const msg = encodeURIComponent(`*NEW DRIVER*\nName: ${name}\nPhone: ${phone}\nPlate: ${plate}\nModel: ${model}\nCategory: ${cat.toUpperCase()}`);
    window.location.href = `https://wa.me/${MK_WHATSAPP}?text=${msg}`;
};

// --- DASHBOARD & TERMS ---
async function loadDashboard() {
    const dash = document.getElementById('clientDashboard');
    if (!dash) return;
    try {
        const res = await fetch(`${SCRIPT_URL}?type=getDashboard`);
        const data = await res.json();
        dash.innerHTML = data.slice(-5).reverse().map(b => `
            <div class="p-2 border-b flex justify-between text-xs">
                <span>${b[2]} to ${b[3]}</span><span class="font-bold">${b[7]}</span>
            </div>
        `).join('');
    } catch (e) { dash.innerHTML = "No recent moves."; }
}

window.openTerms = function(type) {
    const modal = document.getElementById('termsModal');
    document.getElementById('modalTitle').innerText = type === 'driver' ? "Driver Terms" : "Client Terms";
    document.getElementById('modalContent').innerHTML = `<p>Legal information regarding LifTruck ${type} policy...</p>`;
    modal.classList.remove('hidden');
};

window.closeTerms = () => document.getElementById('termsModal').classList.add('hidden');
document.getElementById('closeModal').onclick = window.closeTerms;
document.getElementById('modalOk').onclick = window.closeTerms;

loadDashboard();
