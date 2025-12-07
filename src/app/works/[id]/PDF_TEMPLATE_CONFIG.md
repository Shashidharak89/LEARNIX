# PDF Template Configuration Guide

## How the System Works

The PDF generation system:
1. Loads your template PDF (`download-resource-template.pdf`)
2. Finds where each `[placeholder]` text is located
3. Draws a white rectangle over each placeholder
4. Writes the actual value in the same position

## Quick Start

### Step 1: Find Placeholder Positions

Run the helper script:
```bash
cd src/app/works/[id]
node extractPlaceholderPositions.js
```

### Step 2: Measure Positions in Your PDF

Open `download-resource-template.pdf` in a PDF viewer and for each `[placeholder]`:
- Note its X position (distance from left edge)
- Note its Y position (distance from top edge)
- Measure the text width (or estimate + add buffer)

**Tools you can use:**
- Adobe Acrobat Reader (with measurement tools)
- PDF-XChange Viewer (free, has rulers)
- Online PDF coordinate finder tools
- Any PDF editor with ruler/grid

### Step 3: Update the Code

Edit `/src/app/api/work/download-pdf/route.js` and update the `placeholderPositions` object:

Edit `/src/app/api/work/download-pdf/route.js` and update the `placeholderPositions` object:

```javascript
const placeholderPositions = {
  '[name]':        { x: 180, y: 285, width: 350 },  // Adjust x, y to match your template
  '[usn]':         { x: 180, y: 315, width: 350 },
  '[subjectname]': { x: 180, y: 385, width: 350 },
  '[topicname]':   { x: 180, y: 455, width: 350 },
  '[date]':        { x: 180, y: 515, width: 350 },
  '[topicid]':     { x: 180, y: 675, width: 350 },
};
```

### Field Explanation

- **x**: Horizontal position from left edge (in points, 1 point ≈ 0.35mm)
- **y**: Vertical position from **top** edge (in points)
- **width**: How wide the white cover rectangle should be (should fully cover the placeholder)

### Coordinate System
- **Origin**: Top-left corner of the page
- **X axis**: Increases left to right (0 = left edge, ~595 = right edge for A4)
- **Y axis**: Increases top to bottom (0 = top edge, ~842 = bottom edge for A4)

### Font Matching

The system uses these fonts (configured in the `replacements` object):

```javascript
const replacements = {
  '[name]':        { size: 14, bold: true,  color: rgb(0, 0, 0) },
  '[usn]':         { size: 12, bold: false, color: rgb(0, 0, 0) },
  '[subjectname]': { size: 14, bold: true,  color: rgb(0, 0, 0) },
  '[topicname]':   { size: 16, bold: true,  color: rgb(0.1, 0.3, 0.6) }, // Blue
  '[date]':        { size: 12, bold: false, color: rgb(0, 0, 0) },
  '[topicid]':     { size: 10, bold: false, color: rgb(0.4, 0.4, 0.4) }, // Gray
};
```

**To match your template's fonts:**
1. Observe the font size of each placeholder in your template
2. Note if it's bold or regular
3. Note the color
4. Update the `size`, `bold`, and `color` values accordingly

### Color Values (RGB)
- Black: `rgb(0, 0, 0)`
- White: `rgb(1, 1, 1)`
- Gray: `rgb(0.5, 0.5, 0.5)`
- Blue: `rgb(0, 0, 1)`
- Red: `rgb(1, 0, 0)`
- Custom: `rgb(r, g, b)` where r, g, b are 0-1

## Testing Your Changes

1. Make changes to the positions/fonts in `route.js`
2. Restart your Next.js dev server
3. Go to any topic page: `/works/[topicId]`
4. Click the "Download" button
5. Open the generated PDF
6. Check if placeholders are properly replaced
7. Adjust coordinates if needed and repeat

## Common Issues & Solutions

### ❌ Placeholder still visible
**Solution**: Increase the `width` value to fully cover it

### ❌ Text is too far left/right
**Solution**: Adjust the `x` value (increase to move right, decrease to move left)

### ❌ Text is too high/low  
**Solution**: Adjust the `y` value (increase to move down, decrease to move up)

### ❌ Font size doesn't match
**Solution**: Change the `size` value in the replacements object

### ❌ White rectangle visible around text
**Solution**: The white rectangle is covering the placeholder - this is normal. Make sure the width isn't too large.

## Advanced: Manual Position Finding

If you don't have tools to measure positions, you can use trial and error:

1. Start with estimated positions (current defaults)
2. Generate a PDF
3. See where the text appears
4. Adjust by small increments (10-20 points at a time)
5. Regenerate and check
6. Repeat until perfect

**Estimation guide for A4 (595 × 842):**
- Top quarter: y = 0-210
- Second quarter: y = 210-420  
- Third quarter: y = 420-630
- Bottom quarter: y = 630-842

- Left margin: x = 50-100
- Center: x = 200-400
- Right margin: x = 450-545

### Mapping Placeholders

| Placeholder      | Filled With           | Current Position |
|------------------|-----------------------|------------------|
| `[name]`         | Student name          | x:180, y:285     |
| `[usn]`          | Student USN           | x:180, y:315     |
| `[subjectname]`  | Subject name          | x:180, y:385     |
| `[topicname]`    | Topic name            | x:180, y:455     |
| `[date]`         | Topic creation date   | x:180, y:515     |
| `[topicid]`      | Topic ID              | x:180, y:675     |

### Image Pages (Page 2+)

Images are automatically:
- Centered on the page
- Maximized to fit page with 20pt margins
- Aspect ratio preserved
- One image per page

No configuration needed for images!
