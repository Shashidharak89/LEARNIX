# PDF Template Configuration Guide

## How to Adjust Text Positions

The template uses coordinates to place text on the PDF. Here's how to find and adjust them:

### Coordinate System
- **X axis**: Left to right (0 = left edge, 595 = right edge for A4)
- **Y axis**: Top to bottom (0 = top edge, 842 = bottom edge for A4)
- **Origin**: Top-left corner

### Current Placeholder Positions

Edit `/src/app/api/work/download-pdf/route.js` and modify the `textPositions` array:

```javascript
const textPositions = [
  { x: 180, y: 285, w: 300, h: 20, value: replacements['[name]'], size: 14, bold: true },
  { x: 180, y: 315, w: 300, h: 20, value: replacements['[usn]'], size: 12, bold: false },
  { x: 180, y: 385, w: 300, h: 20, value: replacements['[subjectname]'], size: 14, bold: true },
  { x: 180, y: 455, w: 300, h: 25, value: replacements['[topicname]'], size: 16, bold: true, color: rgb(0.1, 0.3, 0.6) },
  { x: 180, y: 515, w: 300, h: 20, value: replacements['[date]'], size: 12, bold: false },
  { x: 180, y: 675, w: 300, h: 20, value: replacements['[topicid]'], size: 10, bold: false },
];
```

### Fields Explanation

- **x**: Horizontal position from left edge (in points)
- **y**: Vertical position from top edge (in points)
- **w**: Width of the white rectangle to cover the placeholder
- **h**: Height of the white rectangle to cover the placeholder  
- **value**: The actual text to display (from replacements object)
- **size**: Font size in points
- **bold**: Whether to use bold font (true/false)
- **color** (optional): RGB color (e.g., rgb(0.1, 0.3, 0.6) for blue)

### How to Find Coordinates

1. **Using a PDF Editor** (Adobe Acrobat, PDF-XChange, etc.):
   - Open `download-resource-template.pdf`
   - Enable ruler/grid
   - Hover over each `[placeholder]` to see coordinates
   - Note the X,Y position

2. **Using Online Tools**:
   - Upload PDF to coordinate finder tool
   - Click on placeholders to get positions

3. **Trial and Error**:
   - Adjust values in the code
   - Download the PDF
   - Check if text aligns correctly
   - Repeat until perfect

### Common Adjustments

- **Text too far left/right**: Adjust `x` value
- **Text too high/low**: Adjust `y` value
- **Text size wrong**: Adjust `size` value
- **Placeholder showing through**: Increase `w` and `h` values
- **Wrong font**: Change `bold` value

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
