import { PRICING_LOGIC, initialDrivers, REQUIRED_DOCS } from './config.js';

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
    const R = 6371; 
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

    // MANDATORY CHECK: Ensure all fields are filled
    if (!pickup || !dropoff || !cName || !cPhone) {
        return alert("Please enter your Name, Phone Number, and both Locations to continue.");
    }

    try {
        // Real Geocoding Logic
        const res1 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickup)}`);
        const data1 = await res1.json();
        const res2 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dropoff)}`);
        const data2 = await res2.json();

        if (data1.length === 0 || data2.length === 0) {
            alert("Could not find locations. Please be more specific (e.g. 'Thika Town').");
            return;
        }

        const rawDistance = getDistance(data1[0].lat, data1[0].lon, data2[0].lat, data2[0].lon);
        const actualDistance = rawDistance * 1.3; // 30% Road Buffer

        const rates = PRICING_LOGIC[wClass];
        let finalPrice = actualDistance < 1 ? rates.base : rates.base + (actualDistance * rates.perKm);
        let distLabel = actualDistance < 1 ? "Short Move (<1KM)" : `${actualDistance.toFixed(1)} KM`;

        // Filter and Render
        const available = initialDrivers.filter(d => d.class === wClass && d.status === "Available");
        renderResults(distLabel, finalPrice, cName, cPhone, pickup, dropoff, available);

    } catch (err) {
        alert("Network error. Please try again.");
    }
};

function renderResults(distLabel, price, cName, cPhone, pick, drop, drivers) {
    const list = document.getElementById('driverList');
    list.innerHTML = `
        <div class="bg-purple-900 text-white p-4 rounded-2xl flex justify-between shadow-md mb-4">
            <span>Distance: ${distLabel}</span>
            <span class="font-bold">Total: KES ${Math.ceil(price)}</span>
        </div>
        ${drivers.map(d => {
            const msg = encodeURIComponent(
                `*LIFTRUCK BOOKING REQUEST*\n` +
                `--------------------------\n` +
                `*Client Name:* ${cName}\n` +
                `*Client Phone:* ${cPhone}\n` +
                `--------------------------\n` +
                `*Driver:* ${d.name}\n` +
                `*From:* ${pick}\n` +
                `*To:* ${drop}\n` +
                `*Price:* KES ${Math.ceil(price)}`
            );
            return `
            <div class="bg-white p-5 rounded-2xl border flex justify-between items-center shadow-sm mb-3">
                <div>
                    <h4 class="font-bold text-gray-800">${d.name}</h4>
                    <p class="text-xs text-purple-600 font-bold">${d.vehicle} • ${d.plate}</p>
                </div>
                <button onclick="window.location.href='https://wa.me/254794152875?text=${msg}'" 
                    class="bg-purple-600 text-white px-5 py-2 rounded-xl text-sm font-bold">Book</button>
            </div>`;
        }).join('')}
    `;
}

// --- Driver Registration Logic ---
document.getElementById('driverForm').onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('dName').value;
    const phone = document.getElementById('dPhone').value; // Ensure your HTML has id="dPhone"
    const plate = document.getElementById('dPlate').value;

    if (!name || !phone || !plate) return alert("Please fill in all driver details.");

    const docChecklist = REQUIRED_DOCS.map(doc => `[ ] ${doc}`).join('\n');
    const msg = encodeURIComponent(
        `*NEW DRIVER APPLICATION*\n` +
        `Name: ${name}\n` +
        `Phone: ${phone}\n` +
        `Plate: ${plate}\n\n` +
        `*I will now send these documents:*\n${docChecklist}`
    );

    window.location.href = `https://wa.me/254794152875?text=${msg}`;
};

// --- TERMS & CONDITIONS MODAL LOGIC ---
const termsModal = document.getElementById('termsModal');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');
const closeModal = document.getElementById('closeModal');
const modalOk = document.getElementById('modalOk');

const LEGAL_CONTENT = {
    driver: `<p><b>Contractor Status:</b> Independent contractor, not employee...</p>`, // Your full text here
    client: `<p><b>Platform Role:</b> LifTruck is a platform, not a transporter...</p>` // Your full text here
};

window.openTerms = function(type) {
    if (LEGAL_CONTENT[type]) {
        modalTitle.innerText = type === 'driver' ? "Driver Terms" : "Client Terms";
        modalContent.innerHTML = LEGAL_CONTENT[type];
        termsModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
};

const hideModal = () => {
    termsModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
};

closeModal.onclick = hideModal;
modalOk.onclick = hideModal;
