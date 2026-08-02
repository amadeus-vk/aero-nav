// main.js - Entry point for the frontend logic

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('wind-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const tc = parseFloat(document.getElementById('tc').value);
        const tas = parseFloat(document.getElementById('tas').value);
        const wd = parseFloat(document.getElementById('wd').value);
        const ws = parseFloat(document.getElementById('ws').value);
        
        try {
            const response = await fetch('/api/calculate/wind-triangle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    true_course: tc,
                    true_airspeed: tas,
                    wind_direction: wd,
                    wind_speed: ws
                })
            });
            
            const data = await response.json();
            
            document.getElementById('results').innerHTML = `
                <p><strong>True Heading:</strong> ${data.true_heading.toFixed(2)}°</p>
                <p><strong>Ground Speed:</strong> ${data.ground_speed.toFixed(2)} kts</p>
                <p><strong>WCA:</strong> ${data.wind_correction_angle.toFixed(2)}°</p>
            `;
            
            // TODO: Dispatch custom event or call animation update function
            // updateAnimation(data);
            
        } catch (error) {
            console.error("Error calculating:", error);
        }
    });
});
