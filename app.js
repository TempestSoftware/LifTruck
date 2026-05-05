import { PRICING_LOGIC, initialDrivers } from './config.js';

// --- Tab Switching Logic ---
const tabBook = document.getElementById('tabBook');
const tabDrive = document.getElementById('tabDrive');
const clientPortal = document.getElementById('clientPortal');
const driverPortal = document.getElementById('driverPortal');

tabDrive.onclick = () => {
    clientPortal.classList.add('hidden');
    driverPortal.classList.remove('hidden');
    tabDrive.classList.add('tab-active');
    tabBook.classList.remove('tab-active');
};

tabBook.onclick = () => {
    driverPortal.classList.add('hidden');
    clientPortal.classList.remove('hidden');
    tabBook.classList.add('tab-active');
    tabDrive.classList.remove('tab-active');
};

// --- Client Booking Logic ---
document.getElementById('calculateBtn').addEventListener('click', () => {
    const distance = parseFloat(document.getElementById('distanceInput').value);
    const weightClass = document.getElementById('weightSelect').value;
    const driverList = document.getElementById('driverList');

    if (!distance || distance <= 0) {
        alert("Please enter a valid distance.");
        return;
    }

    // 1. Calculate Price
    const rates = PRICING_LOGIC[weightClass];
    const totalPrice = rates.base + (distance * rates.perKm);

    // 2. Filter Drivers
    const available = initialDrivers.filter(d => d.class === weightClass && d.status === "Available");

    // 3. Render Results
    driverList.innerHTML = `
        <h3 class="text-lg font-bold text-purple-900 mb-4">Estimated Quote: KES ${Math.ceil(totalPrice)}</h3>
        ${available.map(driver => `
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-purple-100 flex justify-between items-center">
                <div>
                    <p class="text-xs font-bold text-purple-500 uppercase">${driver.vehicle}</p>
                    <h4 class="text-xl font-bold text-gray-800">${driver.name}</h4>
                    <p class="text-sm text-gray-500">Plate: ${driver.plate}</p>
                </div>
                <button onclick="window.location.href='https://wa.me/2547XXXXXXXX?text=I want to book ${driver.name} for a trip from ${document.getElementById('pickup').value} to ${document.getElementById('dropoff').value} for KES ${Math.ceil(totalPrice)}'" 
                        class="bg-purple-100 text-purple-700 font-bold px-6 py-2 rounded-xl hover:bg-purple-700 hover:text-white transition">
                    Book Now
                </button>
            </div>
        `).join('')}
    `;
});
