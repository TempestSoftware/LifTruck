document.getElementById('driverOnboardingForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // 1. Capture the data
    const name = document.getElementById('name').value;
    const plate = document.getElementById('plate').value;
    const vehicle = document.getElementById('vehicleType').value;
    const phone = document.getElementById('phone').value;

    // 2. Define the MK WhatsApp Number (Change this to MK's real number)
    const mkNumber = "254712345678"; 

    // 3. Create the pre-filled message with a checklist
    const message = `*NEW DRIVER APPLICATION*%0A` +
                    `----------------------------%0A` +
                    `*Name:* ${name}%0A` +
                    `*Phone:* ${phone}%0A` +
                    `*Plate:* ${plate}%0A` +
                    `*Vehicle:* ${vehicle}%0A%0A` +
                    `*ATTACHING DOCUMENTS NOW:*%0A` +
                    `[ ] National ID (Front/Back)%0A` +
                    `[ ] Driving License%0A` +
                    `[ ] NTSA Inspection Certificate%0A` +
                    `[ ] Vehicle Insurance%0A` +
                    `[ ] Vehicle Logbook%0A` +
                    `----------------------------%0A` +
                    `Please review my application for LifTruck.`;

    // 4. Open WhatsApp
    const whatsappUrl = `https://wa.me/${mkNumber}?text=${message}`;
    
    // Optional: Alert the user before redirecting
    alert("Application details saved! Redirecting you to WhatsApp to send your documents to MK.");
    
    window.location.href = whatsappUrl;
});
