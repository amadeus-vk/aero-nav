// sketch.js - p5.js animation sketch

export const simData = {
    mode: 'wind',
    // wind
    tc: 90, tas: 120, wd: 45, ws: 20, th: 90, gs: 120, wca: 0,
    // compass
    mh: 90, ch: 90,
    // distance / radar
    dist: 0, track: 0, time_us: 0,
    // tsd
    time: 0,
    // altitude
    alt: 0, true_alt: 0, isa_dev: 0,
    
    active: false,
    frame: 0
};

const sketch = (p) => {
    p.setup = () => {
        let canvas = p.createCanvas(400, 400);
        
        // p5 sets display: block on canvas, but let's make sure it's sized correctly
        let container = document.getElementById('animation-container');
        // Clear anything else in container (if any)
        container.innerHTML = '';
        canvas.parent('animation-container');
        
        p.angleMode(p.DEGREES);
    };

    p.draw = () => {
        p.background(238, 238, 255); // Match #eef
        
        simData.frame++;
        
        p.translate(p.width / 2, p.height / 2);

        if (simData.mode === 'wind') {
            drawCompass(p);
            if (simData.active) drawWindTriangle(p);
        } else if (simData.mode === 'compass') {
            if (simData.active) drawCompassConversions(p);
            else drawCompass(p);
        } else if (simData.mode === 'distance') {
            if (simData.active) drawDistanceTrack(p);
            else drawCompass(p);
        } else if (simData.mode === 'tsd') {
            if (simData.active) drawTSD(p);
        } else if (simData.mode === 'altitude') {
            if (simData.active) drawAltitude(p);
        } else if (simData.mode === 'radar') {
            if (simData.active) drawRadar(p);
            else drawRadarBase(p);
        }
    };
    
    function drawRadarBase(p) {
        p.stroke(0, 150, 0);
        p.strokeWeight(1);
        p.noFill();
        p.circle(0, 0, 300);
        p.circle(0, 0, 200);
        p.circle(0, 0, 100);
        p.line(-150, 0, 150, 0);
        p.line(0, -150, 0, 150);
    }
    
    function drawRadar(p) {
        drawRadarBase(p);
        p.push();
        p.stroke(0, 255, 0);
        p.strokeWeight(2);
        let angle = simData.frame * 2;
        p.rotate(angle);
        p.line(0, 0, 0, -150);
        p.pop();
        
        // draw blip
        p.push();
        p.noStroke();
        let blipAlpha = 255 - ((simData.frame * 2) % 360);
        p.fill(0, 255, 0, Math.max(blipAlpha, 50));
        let maxDist = 50; 
        let rDist = Math.min(simData.dist / maxDist * 150, 140);
        p.rotate(45); // arbitrary target angle
        p.circle(0, -rDist, 10);
        p.pop();
    }
    
    function drawAltitude(p) {
        p.push();
        p.translate(-p.width/2, -p.height/2);
        
        // draw ground
        p.fill(100, 200, 100);
        p.noStroke();
        p.rect(0, p.height - 50, p.width, 50);
        
        // Indicated
        p.fill(150);
        p.rect(50, p.height - 50 - 150, 50, 150);
        p.fill(0);
        p.text("Ind Alt", 75, p.height - 50 - 160);
        
        // True
        let trueH = 150 * (simData.true_alt / simData.alt);
        p.fill(200, 100, 100);
        p.rect(150, p.height - 50 - trueH, 50, trueH);
        p.fill(0);
        p.text("True Alt", 175, p.height - 50 - trueH - 10);
        
        // Plane
        p.translate(250, p.height - 50 - trueH);
        drawPlane(p);
        
        p.pop();
    }
    
    function drawTSD(p) {
        p.push();
        p.translate(-p.width/2, 0);
        p.stroke(100);
        p.line(20, 0, p.width - 20, 0);
        
        // plane moves back and forth
        let cycle = simData.frame % 200;
        let x = p.map(cycle, 0, 200, 20, p.width - 20);
        
        p.translate(x, 0);
        drawPlane(p);
        p.pop();
    }
    
    function drawDistanceTrack(p) {
        drawCompass(p);
        p.stroke(255, 100, 0);
        p.strokeWeight(2);
        
        // point A center, point B at track direction
        p.push();
        p.rotate(simData.track - 90);
        drawArrow(p, 0, 0, 120);
        p.pop();
        
        p.fill(0);
        p.noStroke();
        p.text(`Track: ${simData.track.toFixed(1)}°`, 0, -120);
        p.text(`Dist: ${simData.dist.toFixed(1)} NM`, 0, 120);
    }
    
    function drawCompassConversions(p) {
        // Draw 3 rings
        p.strokeWeight(1);
        p.noFill();
        
        // True (Outer)
        p.stroke(0);
        p.circle(0, 0, 300);
        
        // Magnetic (Middle)
        p.stroke(0, 0, 255);
        p.circle(0, 0, 250);
        
        // Compass (Inner)
        p.stroke(200, 0, 0);
        p.circle(0, 0, 200);
        
        // Draw plane at Compass heading (what the pilot sees to fly True)
        // Wait, usually the plane flies the compass heading to maintain the true course
        p.push();
        p.rotate(simData.th - 90);
        p.stroke(0);
        p.line(0, 0, 150, 0);
        p.fill(0); p.noStroke(); p.text("TH", 160, 0);
        p.pop();
        
        p.push();
        p.rotate(simData.mh - 90);
        p.stroke(0, 0, 255);
        p.line(0, 0, 125, 0);
        p.fill(0,0,255); p.noStroke(); p.text("MH", 135, 0);
        p.pop();
        
        p.push();
        p.rotate(simData.ch - 90);
        p.stroke(200, 0, 0);
        p.line(0, 0, 100, 0);
        p.fill(200,0,0); p.noStroke(); p.text("CH", 110, 0);
        p.pop();
        
        p.push();
        p.rotate(simData.ch - 90);
        drawPlane(p);
        p.pop();
    }
    
    function drawWindTriangle(p) {
        // Scale vectors so they fit on screen (max radius ~150)
        let maxVal = Math.max(simData.gs, simData.tas, 100);
        let scaleFactor = 120 / maxVal; 
        
        // Draw True Course (TC) vector in Green
        p.stroke(0, 150, 0);
        p.strokeWeight(2);
        let tcLength = simData.gs * scaleFactor; 
        p.push();
        p.rotate(simData.tc - 90);
        drawArrow(p, 0, 0, tcLength);
        p.pop();

        // Draw Wind Vector in Blue
        p.stroke(0, 0, 255);
        p.strokeWeight(2);
        let windLength = simData.ws * scaleFactor * 2; 
        p.push();
        p.rotate(simData.wd - 90 + 180); 
        drawArrow(p, 0, 0, windLength);
        p.pop();

        // Draw Plane pointing to True Heading (TH)
        p.push();
        p.rotate(simData.th - 90);
        drawPlane(p);
        p.stroke(200, 0, 0);
        p.strokeWeight(1);
        p.line(20, 0, 20 + (simData.tas * scaleFactor), 0);
        p.pop();
    }
    
    function drawCompass(p) {
        p.stroke(200);
        p.strokeWeight(1);
        p.noFill();
        p.circle(0, 0, 300);
        p.fill(150);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.text("N", 0, -165);
        p.text("S", 0, 165);
        p.text("E", 165, 0);
        p.text("W", -165, 0);
    }

    function drawArrow(p, x1, y1, length) {
        p.line(x1, y1, x1 + length, y1);
        p.push();
        p.translate(x1 + length, y1);
        p.fill(p.stroke());
        p.triangle(0, 0, -10, -5, -10, 5);
        p.pop();
    }

    function drawPlane(p) {
        p.fill(255, 100, 100);
        p.stroke(0);
        p.strokeWeight(1);
        // A simple polygon for a plane pointing right (0 degrees in current transform)
        p.beginShape();
        p.vertex(20, 0); // nose
        p.vertex(-10, 15); // right wing tip
        p.vertex(-10, 5); // right wing root
        p.vertex(-25, 5); // tail right
        p.vertex(-30, 10); // horizontal stabilizer right
        p.vertex(-30, -10); // horizontal stabilizer left
        p.vertex(-25, -5); // tail left
        p.vertex(-10, -5); // left wing root
        p.vertex(-10, -15); // left wing tip
        p.endShape(p.CLOSE);
    }
};

export function initSketch() {
    new p5(sketch);
}
