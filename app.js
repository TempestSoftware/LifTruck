const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz1jnpJSUAMX8uBjhfz4ZcJIM0GFgVOD5A6c4EwdPhdWujq6T1nGhmP7LwNvezkHZsc7A/exec";

// 1. DYNAMIC DRIVER FETCHING
async function getLiveDrivers() {
    const res = await fetch(`${SCRIPT_URL}?type=getDrivers`);
    const drivers = await res.json();
    return drivers.map(d => ({
        name: d[0], phone: d[1], plate: d[2], vehicle: d[3], class: d[3].toLowerCase(), status: "Available"
    }));
}

// 2. SENDING BOOKING TO SHEET
async function submitBooking(booking) {
    await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ type: "newBooking", ...booking })
    });
    alert("Booking Saved! MK is reviewing your request.");
    loadDashboard();
}

// 3. UPDATED CALCULATE LOGIC
document.getElementById('calculateBtn').onclick = async () => {
    const cName = document.getElementById('clientName').value;
    const cPhone = document.getElementById('clientPhone').value;
    const pickup = document.getElementById('pickup').value;
    const dropoff = document.getElementById('dropoff').value;
    const wClass = document.getElementById('weightSelect').value;

    if (!cName || !cPhone || !pickup || !dropoff) return alert("Fill all fields!");

    // (Add your Geocoding/Distance logic here from previous steps)
    const price = 1500; // Placeholder for demo

    const drivers = await getLiveDrivers();
    const available = drivers.filter(d => d.class.includes(wClass));

    renderResults(price, cName, cPhone, pickup, dropoff, available);
};

// 4. RENDERING & SAVING
function renderResults(price, cName, cPhone, pick, drop, drivers) {
    const list = document.getElementById('driverList');
    list.innerHTML = drivers.map(d => `
        <div class="bg-white p-4 rounded-xl shadow mb-2 flex justify-between items-center">
            <div><b>${d.name}</b> (${d.plate})</div>
            <button onclick="confirmBooking('${d.name}', ${price}, '${cName}', '${cPhone}', '${pick}', '${drop}')" 
                class="bg-purple-600 text-white px-4 py-2 rounded-lg">Book Now</button>
        </div>
    `).join('');
}

window.confirmBooking = async (driverName, price, name, phone, pick, drop) => {
    const booking = { name, phone, pickup: pick, destination: drop, vehicle: "Selected", price };
    await submitBooking(booking);
    
    // Send WhatsApp to MK
    const msg = encodeURIComponent(`New Booking: ${name} to ${drop} with Driver ${driverName}`);
    window.location.href = `https://wa.me/254794152875?text=${msg}`;
};

// 5. LIVE DASHBOARD
async function loadDashboard() {
    const res = await fetch(`${SCRIPT_URL}?type=getDashboard`);
    const data = await res.json();
    const dash = document.getElementById('clientDashboard');
    dash.innerHTML = data.map(b => `
        <div class="text-xs p-2 border-b flex justify-between">
            <span>${b[2]} → ${b[3]}</span>
            <span class="font-bold text-purple-700">${b[7]}</span>
        </div>
    `).join('');
}

loadDashboard();
setInterval(loadDashboard, 30000); // Auto-refresh every 30 seconds
