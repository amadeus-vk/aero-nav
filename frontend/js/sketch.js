// sketch.js - p5.js animation sketch

export const simData = {
    tc: 90,
    tas: 120,
    wd: 45,
    ws: 20,
    th: 90,
    gs: 120,
    wca: 0,
    active: false
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
        
        // Translate to center
        p.translate(p.width / 2, p.height / 2);
        
        // Draw Compass Rose
        drawCompass(p);

        if (simData.active) {
            // Scale vectors so they fit on screen (max radius ~150)
            let maxVal = Math.max(simData.gs, simData.tas, 100);
            let scaleFactor = 120 / maxVal; 
            
            // Draw True Course (TC) vector in Green
            p.stroke(0, 150, 0);
            p.strokeWeight(2);
            let tcLength = simData.gs * scaleFactor; 
            p.push();
            // In aviation, 0 is North (Up), 90 is East (Right)
            // p5 math: 0 is Right, 90 is Down
            // We rotate by tc - 90 to match aviation heading
            p.rotate(simData.tc - 90);
            drawArrow(p, 0, 0, tcLength);
            p.pop();

            // Draw Wind Vector in Blue
            // Wind is WHERE IT BLOWS FROM. So if wd=45, wind comes from 45.
            // The wind pushes the plane, pointing to wd + 180.
            p.stroke(0, 0, 255);
            p.strokeWeight(2);
            let windLength = simData.ws * scaleFactor * 2; // Exaggerate wind for visibility
            p.push();
            // Move to the end of the TH/TAS vector to form the wind triangle correctly
            // But let's just draw it from the center for simplicity, or at the end of TH vector?
            // "The results of the wind triangle calculations should be shown schematically and animated"
            // Let's draw Wind vector from center
            p.rotate(simData.wd - 90 + 180); // direction wind is blowing TOWARDS
            drawArrow(p, 0, 0, windLength);
            p.pop();

            // Draw Plane pointing to True Heading (TH)
            p.push();
            p.rotate(simData.th - 90);
            drawPlane(p);
            // Draw TAS vector from plane nose
            p.stroke(200, 0, 0);
            p.strokeWeight(1);
            p.line(20, 0, 20 + (simData.tas * scaleFactor), 0);
            p.pop();
        }
    };
    
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
