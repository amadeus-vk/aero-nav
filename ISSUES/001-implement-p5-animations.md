---
Status: Open
Type: Feature Request
---

# 001 - Implement p5.js plane and wind vector animations

**Description**
The `start.txt` file specifies that the results of the wind triangle calculations should be shown schematically and animated. This includes:
- A plane rotating to its True Heading (TH).
- Wind direction and strength being visualized via vectors.
- True Course (TC) plotted schematically.

**Acceptance Criteria**
- [ ] Connect the `p5.js` canvas in the frontend to the form submission.
- [ ] Draw the True Course vector.
- [ ] Draw the Wind vector.
- [ ] Draw a simple plane graphic/polygon that rotates to match the True Heading returned by the FastAPI backend.
