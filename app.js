import { WEIGHT_CLASSES, initialDrivers } from './config.js';

// 1. Distance Math (Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// 2. Driver Filtering Logic
const findDriversBtn = document.getElementById('findDriversBtn');
const resultsDiv = document.getElementById('driverResults');

findDriversBtn.addEventListener('click', () => {
    const selectedClass = document.getElementById('weightSelect').value;
    
    // Filter drivers that match the selected class
    const available = initialDrivers.filter(d => d.class === selectedClass);

    resultsDiv.innerHTML = available.map(driver => `
        <div class="bg-white p-4 border-l-4 border-green-500 shadow-sm flex justify-between items-center">
            <div>
                <h4 class="font-bold text-lg">${driver.name}</h4>
                <p class="text-sm text-gray-600">Rating: ⭐ ${driver.rating}</p>
            </div>
            <button class="bg-green-100 text-green-700 px-4 py-2 rounded font-bold">Select</button>
        </div>
    `).join('');
});

// 3. Driver Application Handling
document.getElementById('driverAppForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert("Application sent to MK! We will review your details shortly.");
    e.target.reset();
});
