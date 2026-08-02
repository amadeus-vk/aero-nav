import { simData, initSketch } from './sketch.js';

document.addEventListener('DOMContentLoaded', () => {
    initSketch();
    
    // Tab Switching Logic
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.scenario-section');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.style.display = 'none');
            
            btn.classList.add('active');
            const target = btn.getAttribute('data-target');
            document.getElementById(`${target}-section`).style.display = 'block';
            document.getElementById('results').innerHTML = ''; // clear results
            
            simData.mode = target;
            simData.active = false;
        });
    });

    // Wind Form
    document.getElementById('wind-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const tc = parseFloat(document.getElementById('tc').value);
        const tas = parseFloat(document.getElementById('tas').value);
        const wd = parseFloat(document.getElementById('wd').value);
        const ws = parseFloat(document.getElementById('ws').value);
        
        try {
            const response = await fetch('/api/calculate/wind-triangle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ true_course: tc, true_airspeed: tas, wind_direction: wd, wind_speed: ws })
            });
            const data = await response.json();
            
            document.getElementById('results').innerHTML = `
                <p><strong>True Heading:</strong> ${data.true_heading.toFixed(2)}°</p>
                <p><strong>Ground Speed:</strong> ${data.ground_speed.toFixed(2)} kts</p>
                <p><strong>WCA:</strong> ${data.wind_correction_angle.toFixed(2)}°</p>
            `;
            
            simData.tc = tc; simData.tas = tas; simData.wd = wd; simData.ws = ws;
            simData.th = data.true_heading; simData.gs = data.ground_speed;
            simData.wca = data.wind_correction_angle;
            simData.mode = 'wind';
            simData.active = true;
        } catch (error) { console.error("Error calculating:", error); }
    });

    // Compass Form
    document.getElementById('compass-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const th = parseFloat(document.getElementById('comp_th').value);
        const var_deg = parseFloat(document.getElementById('comp_var').value);
        const dev_deg = parseFloat(document.getElementById('comp_dev').value);
        
        try {
            const response = await fetch('/api/calculate/compass', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ true_heading: th, variation: var_deg, deviation: dev_deg })
            });
            const data = await response.json();
            
            document.getElementById('results').innerHTML = `
                <p><strong>True Heading:</strong> ${data.true_heading.toFixed(2)}°</p>
                <p><strong>Magnetic Heading:</strong> ${data.magnetic_heading.toFixed(2)}°</p>
                <p><strong>Compass Heading:</strong> ${data.compass_heading.toFixed(2)}°</p>
            `;
            
            simData.th = th;
            simData.mh = data.magnetic_heading;
            simData.ch = data.compass_heading;
            simData.mode = 'compass';
            simData.active = true;
        } catch (error) { console.error("Error calculating:", error); }
    });

    // Distance Form
    document.getElementById('distance-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const lat1 = parseFloat(document.getElementById('lat1').value);
        const lon1 = parseFloat(document.getElementById('lon1').value);
        const lat2 = parseFloat(document.getElementById('lat2').value);
        const lon2 = parseFloat(document.getElementById('lon2').value);
        
        try {
            const response = await fetch('/api/calculate/distance', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat1, lon1, lat2, lon2 })
            });
            const data = await response.json();
            
            document.getElementById('results').innerHTML = `
                <p><strong>Distance:</strong> ${data.distance_nm.toFixed(2)} NM</p>
                <p><strong>Initial True Track:</strong> ${data.true_track.toFixed(2)}°</p>
            `;
            
            simData.dist = data.distance_nm;
            simData.track = data.true_track;
            simData.mode = 'distance';
            simData.active = true;
        } catch (error) { console.error("Error calculating:", error); }
    });

    // TSD Form
    document.getElementById('tsd-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const dist = document.getElementById('tsd_dist').value;
        const spd = document.getElementById('tsd_spd').value;
        const time = document.getElementById('tsd_time').value;
        
        try {
            const response = await fetch('/api/calculate/tsd', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    distance: dist ? parseFloat(dist) : null, 
                    speed: spd ? parseFloat(spd) : null, 
                    time_min: time ? parseFloat(time) : null 
                })
            });
            const data = await response.json();
            
            document.getElementById('results').innerHTML = `
                <p><strong>Distance:</strong> ${data.distance.toFixed(2)} NM</p>
                <p><strong>Speed:</strong> ${data.speed.toFixed(2)} kts</p>
                <p><strong>Time:</strong> ${data.time_min.toFixed(2)} mins</p>
            `;
            
            simData.dist = data.distance;
            simData.gs = data.speed;
            simData.time = data.time_min;
            simData.mode = 'tsd';
            simData.active = true;
        } catch (error) { console.error("Error calculating:", error); }
    });

    // Altitude Form
    document.getElementById('altitude-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const alt = parseFloat(document.getElementById('alt_ind').value);
        const oat = parseFloat(document.getElementById('alt_oat').value);
        
        try {
            const response = await fetch('/api/calculate/altitude', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ indicated_altitude: alt, oat: oat })
            });
            const data = await response.json();
            
            document.getElementById('results').innerHTML = `
                <p><strong>ISA Temp at Alt:</strong> ${data.isa_temp.toFixed(2)} °C</p>
                <p><strong>ISA Deviation:</strong> ${data.isa_deviation.toFixed(2)} °C</p>
                <p><strong>True Altitude:</strong> ${data.true_altitude.toFixed(0)} ft</p>
            `;
            
            simData.alt = alt;
            simData.true_alt = data.true_altitude;
            simData.isa_dev = data.isa_deviation;
            simData.mode = 'altitude';
            simData.active = true;
        } catch (error) { console.error("Error calculating:", error); }
    });

    // Radar Form
    document.getElementById('radar-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const dist = parseFloat(document.getElementById('radar_dist').value);
        
        try {
            const response = await fetch('/api/calculate/radar', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ distance_nm: dist })
            });
            const data = await response.json();
            
            document.getElementById('results').innerHTML = `
                <p><strong>Round Trip Time:</strong> ${data.round_trip_time_us.toFixed(2)} μs</p>
            `;
            
            simData.dist = dist;
            simData.time_us = data.round_trip_time_us;
            simData.mode = 'radar';
            simData.active = true;
        } catch (error) { console.error("Error calculating:", error); }
    });
});
