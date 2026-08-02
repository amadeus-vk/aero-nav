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
    frame: 0,
    layers: { bg: true, grid: true, nav: true, terrain: true }
};

const sketch = (p) => {
    let mapImg;

    p.preload = () => {
        mapImg = p.loadImage('/static/assets/map_bg.png');
    };

    p.setup = () => {
        let canvas = p.createCanvas(600, 400); // make wider for better map view
        let container = document.getElementById('animation-container');
        container.innerHTML = '';
        canvas.parent('animation-container');
        
        p.angleMode(p.DEGREES);
        p.textFont('JetBrains Mono');
    };

    p.draw = () => {
        p.clear();
        
        simData.frame++;
        
        p.push();
        // Base Map Layers
        if (simData.layers.bg && mapImg) {
            p.push();
            p.tint(16, 185, 129, 60); // tactical green/emerald tint
            p.imageMode(p.CENTER);
            p.translate(p.width/2, p.height/2);
            // Slowly pan the map to simulate flight if active
            let panX = simData.active ? (simData.frame * 0.2) % p.width : 0;
            p.image(mapImg, -panX, 0, p.width * 1.5, p.height * 1.5);
            p.pop();
        }
        
        if (simData.layers.grid) drawLatLonGrid(p);
        if (simData.layers.terrain) drawTerrain(p);
        if (simData.layers.nav) drawNavAids(p);
        p.pop();
        
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
        p.stroke(16, 185, 129, 100); // emerald-500 with opacity
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
        p.stroke(16, 185, 129); // emerald-500
        p.strokeWeight(2);
        let angle = simData.frame * 2;
        p.rotate(angle);
        p.line(0, 0, 0, -150);
        p.pop();
        
        // draw blip
        p.push();
        p.noStroke();
        let blipAlpha = 255 - ((simData.frame * 2) % 360);
        p.fill(16, 185, 129, Math.max(blipAlpha, 50));
        let maxDist = 50; 
        let rDist = Math.min(simData.dist / maxDist * 150, 140);
        p.rotate(45); // arbitrary target angle
        p.circle(0, -rDist, 8);
        
        // Target text
        p.fill(6, 182, 212, blipAlpha); // cyan
        p.textSize(10);
        p.text(`TGT ${simData.dist.toFixed(1)}NM`, 10, -rDist);
        p.pop();
    }
    
    function drawAltitude(p) {
        p.push();
        p.translate(-p.width/2, -p.height/2);
        
        // draw ground
        p.fill(15, 23, 42); // slate-900
        p.stroke(30, 41, 59); // slate-800
        p.strokeWeight(2);
        p.rect(0, p.height - 50, p.width, 50);
        
        p.fill(6, 182, 212); // cyan-500
        p.noStroke();
        p.textSize(12);
        p.text("GND LEVEL (0 ft)", 10, p.height - 30);
        
        // Indicated
        p.fill(148, 163, 184, 50); // slate-400 transparent
        p.stroke(148, 163, 184);
        p.rect(60, p.height - 50 - 150, 60, 150);
        p.fill(255); p.noStroke();
        p.text("IND", 75, p.height - 50 - 160);
        
        // True
        let trueH = 150 * (simData.true_alt / simData.alt);
        p.fill(236, 72, 153, 50); // pink transparent
        p.stroke(236, 72, 153);
        p.rect(180, p.height - 50 - trueH, 60, trueH);
        p.fill(236, 72, 153); p.noStroke();
        p.text("TRUE", 190, p.height - 50 - trueH - 10);
        
        // Plane
        p.translate(290, p.height - 50 - trueH);
        drawPlane(p);
        
        p.pop();
    }
    
    function drawTSD(p) {
        p.push();
        p.translate(-p.width/2, 0);
        p.stroke(30, 41, 59); // slate-800
        p.strokeWeight(2);
        p.line(20, 0, p.width - 20, 0);
        
        // plane moves back and forth
        let cycle = simData.frame % 200;
        let x = p.map(cycle, 0, 200, 20, p.width - 20);
        
        p.fill(16, 185, 129); // emerald
        p.noStroke();
        p.textSize(10);
        p.text("A", 20, 15);
        p.text("B", p.width - 30, 15);
        
        p.translate(x, 0);
        drawPlane(p);
        p.pop();
    }
    
    function drawDistanceTrack(p) {
        drawCompass(p);
        p.stroke(16, 185, 129); // emerald
        p.strokeWeight(2);
        
        // point A center, point B at track direction
        p.push();
        p.rotate(simData.track - 90);
        drawArrow(p, 0, 0, 120);
        p.pop();
        
        p.fill(6, 182, 212); // cyan
        p.noStroke();
        p.textSize(12);
        p.text(`TRK: ${simData.track.toFixed(1)}°`, 0, -135);
        p.text(`DST: ${simData.dist.toFixed(1)} NM`, 0, 135);
    }
    
    function drawCompassConversions(p) {
        // Draw 3 rings
        p.strokeWeight(1);
        p.noFill();
        
        // True (Outer)
        p.stroke(6, 182, 212); // cyan
        p.circle(0, 0, 300);
        
        // Magnetic (Middle)
        p.stroke(245, 158, 11); // amber
        p.circle(0, 0, 250);
        
        // Compass (Inner)
        p.stroke(236, 72, 153); // pink
        p.circle(0, 0, 200);
        
        p.push();
        p.rotate(simData.th - 90);
        p.stroke(6, 182, 212);
        p.line(0, 0, 150, 0);
        p.fill(6, 182, 212); p.noStroke(); p.textSize(12); p.text("TH", 165, 0);
        p.pop();
        
        p.push();
        p.rotate(simData.mh - 90);
        p.stroke(245, 158, 11);
        p.line(0, 0, 125, 0);
        p.fill(245, 158, 11); p.noStroke(); p.text("MH", 140, 0);
        p.pop();
        
        p.push();
        p.rotate(simData.ch - 90);
        p.stroke(236, 72, 153);
        p.line(0, 0, 100, 0);
        p.fill(236, 72, 153); p.noStroke(); p.text("CH", 115, 0);
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
        
        // Draw True Course (TC) vector in Cyan
        p.stroke(6, 182, 212);
        p.strokeWeight(2);
        let tcLength = simData.gs * scaleFactor; 
        p.push();
        p.rotate(simData.tc - 90);
        drawArrow(p, 0, 0, tcLength);
        p.fill(6, 182, 212); p.noStroke(); p.textSize(10); p.text("TC/GS", tcLength/2, -10);
        p.pop();

        // Draw Wind Vector in Magenta
        p.stroke(236, 72, 153);
        p.strokeWeight(2);
        let windLength = simData.ws * scaleFactor * 2; 
        p.push();
        p.rotate(simData.wd - 90 + 180); 
        drawArrow(p, 0, 0, windLength);
        p.fill(236, 72, 153); p.noStroke(); p.textSize(10); p.text("WIND", windLength/2, -10);
        p.pop();

        // Draw Plane pointing to True Heading (TH)
        p.push();
        p.rotate(simData.th - 90);
        drawPlane(p);
        // TAS Vector in Amber
        p.stroke(245, 158, 11);
        p.strokeWeight(1.5);
        p.line(20, 0, 20 + (simData.tas * scaleFactor), 0);
        p.fill(245, 158, 11); p.noStroke(); p.textSize(10); p.text("TH/TAS", 20 + (simData.tas * scaleFactor)/2, -10);
        p.pop();
    }
    
    function drawCompass(p) {
        p.stroke(30, 41, 59); // slate-800
        p.strokeWeight(1);
        p.noFill();
        p.circle(0, 0, 300);
        p.fill(100, 116, 139); // slate-500
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(14);
        p.text("N", 0, -165);
        p.text("S", 0, 165);
        p.text("E", 165, 0);
        p.text("W", -165, 0);
    }
    
    function drawLatLonGrid(p) {
        p.stroke(6, 182, 212, 30); // very faint cyan
        p.strokeWeight(1);
        for(let x = 0; x < p.width; x += 50) {
            p.line(x, 0, x, p.height);
            p.fill(6, 182, 212, 50); p.noStroke(); p.textSize(8); p.textAlign(p.LEFT, p.TOP);
            p.text(`115°${(x/50)+10}'W`, x + 2, 5);
            p.stroke(6, 182, 212, 30);
        }
        for(let y = 0; y < p.height; y += 50) {
            p.line(0, y, p.width, y);
            p.fill(6, 182, 212, 50); p.noStroke(); p.textSize(8); p.textAlign(p.LEFT, p.BOTTOM);
            p.text(`36°${(y/50)+20}'N`, 5, y - 2);
            p.stroke(6, 182, 212, 30);
        }
    }

    function drawTerrain(p) {
        // Procedural terrain: mountains and rivers
        p.push();
        p.noFill();
        // River
        p.stroke(59, 130, 246, 100); // blue
        p.strokeWeight(3);
        p.beginShape();
        for(let x=0; x<p.width; x+=20) {
            p.vertex(x, p.height/2 + p.sin(x*2 + simData.frame*0.5)*50 + p.noise(x*0.05)*100);
        }
        p.endShape();
        
        // Mountain peaks
        p.stroke(245, 158, 11, 80); // amber
        p.strokeWeight(1);
        p.fill(245, 158, 11, 20);
        let peaks = [[100, 100], [450, 80], [150, 320], [500, 300]];
        peaks.forEach(pt => {
            p.triangle(pt[0], pt[1]-20, pt[0]-15, pt[1]+10, pt[0]+15, pt[1]+10);
            p.fill(245, 158, 11, 60); p.noStroke(); p.textSize(8);
            p.text("PEAK 12,400", pt[0]+10, pt[1]-10);
            p.stroke(245, 158, 11, 80); p.fill(245, 158, 11, 20);
        });
        p.pop();
    }

    function drawNavAids(p) {
        p.push();
        // VORs
        let vors = [
            {x: 120, y: 200, name: "LAS"},
            {x: 480, y: 150, name: "BTY"}
        ];
        p.stroke(236, 72, 153, 150); // magenta
        p.strokeWeight(2);
        vors.forEach(v => {
            p.noFill();
            p.hexagon(v.x, v.y, 12);
            p.circle(v.x, v.y, 2);
            p.fill(236, 72, 153); p.noStroke(); p.textSize(10);
            p.text(v.name, v.x + 15, v.y + 4);
            p.stroke(236, 72, 153, 150);
        });
        
        // Airfields
        let apts = [
            {x: 250, y: 280, name: "KTNX", rwy: "14/32"},
            {x: 400, y: 90,  name: "KLSV", rwy: "03/21"}
        ];
        p.stroke(6, 182, 212, 150); // cyan
        apts.forEach(a => {
            p.fill(6, 182, 212, 40);
            p.circle(a.x, a.y, 14);
            p.line(a.x-4, a.y-4, a.x+4, a.y+4); // fake rwy
            p.fill(6, 182, 212); p.noStroke(); p.textSize(10);
            p.text(a.name, a.x - 12, a.y - 10);
            p.stroke(6, 182, 212, 150);
        });
        p.pop();
    }
    
    // helper for VOR
    p.hexagon = function(x, y, radius) {
        p.beginShape();
        for (let a = 0; a < 360; a += 60) {
            p.vertex(x + p.cos(a) * radius, y + p.sin(a) * radius);
        }
        p.endShape(p.CLOSE);
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
        p.fill(226, 232, 240); // slate-200
        p.stroke(148, 163, 184); // slate-400
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
