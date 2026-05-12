/**
 * LIFTRUCK MASTER ENGINE - CORE LOGIC
 * Section: Navigation, Math, Data Fetching, and Booking
 */

import { PRICING_LOGIC, MK_WHATSAPP, REQUIRED_DOCS } from './config.js';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz1jnpJSUAMX8uBjhfz4ZcJIM0GFgVOD5A6c4EwdPhdWujq6T1nGhmP7LwNvezkHZsc7A/exec"; 

// --- SECTION 1: TABS & NAVIGATION ---
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

// --- SECTION 2: GEOLOCATION MATH (Haversine Formula) ---
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// --- SECTION 3: DATABASE FETCH (Live Drivers) ---
async function getLiveDrivers() {
    try {
        const response = await fetch(`${SCRIPT_URL}?type=getDrivers&t=${Date.now()}`);
        const drivers = await response.json();
        return drivers.map(d => ({
            name: d[0], phone: d[1], plate: d[2], category: d[3], model: d[4]
        }));
    } catch (error) {
        console.error("Fetch Error:", error);
        return [];
    }
}

// --- SECTION 4: CLIENT BOOKING & CALCULATION ---
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
        const d1 = await r1.json();
        const d2 = await r2.json();

        const dist = getDistance(d1[0].lat, d1[0].lon, d2[0].lat, d2[0].lon) * 1.3;
        const price = Math.ceil(dist < 1 ? PRICING_LOGIC[cat].base : PRICING_LOGIC[cat].base + (dist * PRICING_LOGIC[cat].perKm));

        const allDrivers = await getLiveDrivers();
        const filtered = allDrivers.filter(d => d.category.toLowerCase() === cat.toLowerCase());

        renderResults(dist.toFixed(1), price, name, phone, pick, drop, filtered);
    } catch (e) { alert("Location not found. Please be more specific (e.g. 'Section 9, Thika')"); }
};

function renderResults(dist, price, cName, cPhone, pick, drop, drivers) {
    const list = document.getElementById('driverList');
    list.innerHTML = `
        <div class="bg-purple-900 text-white p-4 rounded-xl mb-4 flex justify-between shadow-lg">
            <span>Distance: ${dist} KM</span><span>Total: KES ${price}</span>
        </div>
        ${drivers.length > 0 ? drivers.map(d => `
            <div class="bg-white p-4 rounded-xl border mb-2 flex justify-between items-center shadow-sm">
                <div>
                    <h4 class="font-bold text-gray-800">${d.name}</h4>
                    <p class="text-xs text-purple-600 font-bold uppercase">${d.model} • ${d.plate}</p>
                </div>
                <button onclick="window.confirmBooking('${d.name}', '${d.model}', '${d.phone}', ${price}, '${cName}', '${cPhone}', '${pick}', '${drop}', ${dist})" 
                    class="bg-purple-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md">Book</button>
            </div>
        `).join('') : '<div class="p-4 bg-gray-100 rounded-xl text-center text-gray-500 italic">No approved drivers found in this category.</div>'}
    `;
}

// --- SECTION 5: DISPATCH (WhatsApp Bridge) ---
window.confirmBooking = async (dName, dModel, dPhone, price, cName, cPhone, pick, drop, dist) => {
    const bookingPayload = { 
        type: "newBooking",
        name: cName, phone: cPhone, pickup: pick, destination: drop, 
        category: document.getElementById('weightSelect').value,
        vehicleModel: dModel, driverPhone: dPhone, distance: dist 
    };
    
    // Save to Google Sheet
    fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(bookingPayload) });
    
    // Send WhatsApp to MK
    const msg = encodeURIComponent(
        `*NEW BOOKING REQUEST*\n` +
        `----------------------\n` +
        `Client: ${cName} (${cPhone})\n` +
        `Route: ${pick} to ${drop}\n` +
        `Distance: ${dist} KM\n` +
        `Price: KES ${price}\n` +
        `Vehicle: ${dModel}\n` +
        `Assigned Driver: ${dName} (${dPhone})`
    );
    window.location.href = `https://wa.me/${MK_WHATSAPP}?text=${msg}`;
};

// --- SECTION 6: DRIVER REGISTRATION ---
document.getElementById('driverForm').onsubmit = async (e) => {
    e.preventDefault();
    const driverData = {
        type: "newDriver",
        name: "Driver Pending", // You can add a name field to form if needed
        phone: document.getElementById('dPlate').value, // Used plate as unique ID for now
        plate: document.getElementById('dPlate').value,
        model: document.getElementById('dModel').value,
        category: document.getElementById('dVehType').value
    };

    await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(driverData) });

    const msg = encodeURIComponent(
        `*LIFTRUCK DRIVER APPLICATION*\n` +
        `Vehicle: ${driverData.model} (${driverData.plate})\n\n` +
        `*DOCUMENTS TO ATTACH:*\n${REQUIRED_DOCS.join('\n')}`
    );
    window.location.href = `https://wa.me/${MK_WHATSAPP}?text=${msg}`;
};

// --- SECTION 7: DASHBOARD & LEGAL ---
async function loadDashboard() {
    const dash = document.getElementById('clientDashboard');
    if (!dash) return;
    try {
        const res = await fetch(`${SCRIPT_URL}?type=getDashboard&t=${Date.now()}`);
        const data = await res.json();
        
        dash.innerHTML = data.slice(-5).reverse().map(b => {
            let color = "text-gray-500";
            if (b[10] === "Pending") color = "text-orange-500";
            if (b[10] === "Delivered") color = "text-green-600 font-bold";

            return `
                <div class="flex justify-between items-center p-3 border-b text-xs bg-white mb-2 rounded-lg">
                    <div>
                        <p class="font-bold">${b[3]} → ${b[4]}</p>
                        <p class="text-[10px] text-gray-400 italic">${b[6]}</p>
                    </div>
                    <span class="${color} uppercase font-black">${b[10]}</span>
                </div>
            `;
        }).join('');
    } catch (e) { dash.innerHTML = "Syncing with server..."; }
}

window.openTerms = function(type) {
    const modal = document.getElementById('termsModal');
    const title = document.getElementById('modalTitle');
    const content = document.getElementById('modalContent');
    
    const legalVault = {
       driver: `
            <div class="space-y-4 text-gray-700">
                <p class="font-bold text-red-600 underline">Last updated: 5/6/2026</p>
                <h4 class="font-bold">1. Introduction</h4>
                <p>These Terms & Conditions apply to all truck owners, drivers, or transport service providers ("Drivers") who use the Platform to accept and complete delivery jobs. By registering, you agree to these terms.</p>
                <h4 class="font-bold">2. Relationship Between Driver and Platform</h4>
                <p>You are an independent contractor, not an employee. You provide transport services directly to the client. The Platform only facilitates matching and payment.</p>
                <h4 class="font-bold">3. Driver Eligibility</h4>
                <p>To join, Drivers must: Upload valid ID, Provide a valid driving license, Provide proof of vehicle ownership or authorization, Submit insurance documents. Providing false documents will lead to permanent suspension.</p>
                <h4 class="font-bold">4. Obligations of Drivers</h4>
                <p>Drivers agree to: Transport goods safely, Follow all traffic laws, Handle cargo with care, Arrive on time for pickup.</p>
                <h4 class="font-bold">5. Responsibility for Goods</h4>
                <p>You, the Driver, accept full responsibility for goods once handed over to you. You may be held liable for theft due to negligence, loss of goods, or damage caused by improper handling.</p>
                <h4 class="font-bold">6. Prohibited Conduct</h4>
                <p>Drivers may NOT: Carry unauthorized passengers, Demand extra payment outside the Platform, or Use alcohol/drugs while working.</p>
                <h4 class="font-bold">7. Pricing and Earnings</h4>
                <p>The Platform sets or suggests trip prices. Drivers earn the trip amount minus platform commission paid through mobile money.</p>
                <h4 class="font-bold">8. Insurance Requirements</h4>
                <p>Drivers must maintain valid motor insurance and report accidents immediately.</p>
                <h4 class="font-bold">9. Liability</h4>
                <p>Drivers are liable for goods damaged through negligence. The Platform does not cover losses unless the client purchased insurance.</p>
                <h4 class="font-bold">10. Account Suspension</h4>
                <p>Account may be suspended for fraud, overcharging, mishandling cargo, or illegal activities.</p>
            </div>
        `,
        client: `
            <div class="space-y-4 text-gray-700">
                <p class="font-bold text-red-600 underline">Last updated: 5/6/2026</p>
                <h4 class="font-bold">1. Introduction</h4>
                <p>These Terms & Conditions govern the use of the platform that connects clients ("Users") with independent truck owners. By using the Platform, you agree to these terms.</p>
                <h4 class="font-bold">2. Service Description</h4>
                <p>The Platform is not a transporter. It does not own vehicles or employ Drivers. It only connects Users with Drivers.</p>
                <h4 class="font-bold">3. Booking Transport Services</h4>
                <p>Users must provide accurate information (weight, destination). Misleading information may result in additional charges.</p>
                <h4 class="font-bold">4. Payments</h4>
                <p>All payments must be made through the Platform (M-Pesa/Card). Payment confirms acceptance of service.</p>
                <h4 class="font-bold">5. User Responsibilities</h4>
                <p>You agree to provide correct cargo details and ensure goods are properly packaged. Improper packaging leads to denial of compensation.</p>
                <h4 class="font-bold">6. Liability for Goods</h4>
                <p>The Platform is not liable for damage, theft, loss, or delays. The Driver is primarily responsible once in possession of goods.</p>
                <h4 class="font-bold">7. Insurance</h4>
                <p>Clients may purchase optional cargo insurance. If declined, they accept full risk for theft or damage.</p>
                <h4 class="font-bold">8. Cancellation Policy</h4>
                <p>Once a Driver is assigned, cancellation may attract a fee.</p>
                <h4 class="font-bold">9. Dispute Resolution</h4>
                <p>Disputes must be raised within 24–48 hours of delivery through the Platform support system.</p>
                <h4 class="font-bold">10. Prohibited Goods</h4>
                <p>Illegal drugs, weapons, bulk cash, and hazardous materials are strictly prohibited.</p>
            </div>
        `
    };

    title.innerText = type === 'driver' ? "Partner Terms & Conditions" : "Client Service Agreement";
    content.innerHTML = legalVault[type];
    modal.classList.remove('hidden');
};

window.closeTerms = () => document.getElementById('termsModal').classList.add('hidden');
loadDashboard();
