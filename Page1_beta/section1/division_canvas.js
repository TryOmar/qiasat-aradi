// division_canvas.js
// Professional Interactive sketch for land division (Trapezoidal/Quadrilateral Division)

let divCanvas, divCtx;
let piecesData = []; 
let landDims = { top: 0, bottom: 0, left: 0, right: 0, H: 0 };
let isDraggingDivider = false;
let draggedDividerIdx = -1;
let dragStartY = 0;
let originalDepths = []; // Cumulative y positions of dividers

// Configuration
const padding = 60;

function initDivisionCanvas() {
  divCanvas = document.getElementById('divisionCanvas');
  if (!divCanvas) return;
  divCtx = divCanvas.getContext('2d');
  
  // Setup events
  divCanvas.addEventListener('mousedown', handlePointerDown);
  divCanvas.addEventListener('mousemove', handlePointerMove);
  divCanvas.addEventListener('mouseup', handlePointerUp);
  divCanvas.addEventListener('mouseleave', handlePointerUp);

  divCanvas.addEventListener('touchstart', handlePointerDown, {passive: false});
  divCanvas.addEventListener('touchmove', handlePointerMove, {passive: false});
  divCanvas.addEventListener('touchend', handlePointerUp);
  divCanvas.addEventListener('touchcancel', handlePointerUp);
}

function getLandDimensions() {
  let top = 0, bottom = 0, left = 0, right = 0;
  let shape = typeof activeShape !== 'undefined' ? activeShape : (sessionStorage.getItem("activeShape") || "quadrilateral");
  
  if (shape === 'rectangle') {
    left = parseFloat(document.getElementById('rect-length')?.value) || 0;
    top = parseFloat(document.getElementById('rect-width')?.value) || 0;
    bottom = top; right = left;
  } else if (shape === 'square') {
    let s = parseFloat(document.getElementById('square-side')?.value) || 0;
    top = s; bottom = s; left = s; right = s;
  } else if (shape === 'trapezoid') {
    bottom = parseFloat(document.getElementById('trap-base-major')?.value) || 0;
    top = parseFloat(document.getElementById('trap-base-minor')?.value) || 0;
    let h = parseFloat(document.getElementById('trap-height').value) || 0;
    // For visual purposes, we use the height to approximate slant sides if needed, 
    // but the area logic depends on height. Dalaals use (L+R)/2. If it's a real trapezoid, 
    // we set L = R = h for simplicity in this visualizer unless specified.
    left = h; right = h; 
  } else if (shape === 'quadrilateral') {
    bottom = parseFloat(document.getElementById('quad-side-a')?.value) || 0;
    left = parseFloat(document.getElementById('quad-side-b')?.value) || 0;
    top = parseFloat(document.getElementById('quad-side-c')?.value) || 0;
    right = parseFloat(document.getElementById('quad-side-d')?.value) || 0;
  }
  
  // Fallback to legacy base-length if all 0
  if (top === 0 && bottom === 0 && left === 0 && right === 0) {
     let bl = parseFloat(document.getElementById('base-length')?.value) || 0;
      if (bl > 0) {
       top = bl; bottom = bl; 
       let totalArea = typeof landAreaSqM !== 'undefined' ? landAreaSqM : 0;
       left = (totalArea > 0) ? (totalArea / bl) : bl;
       right = left;
     }
  }
  
  let H = (left + right) / 2;
  return { top, bottom, left, right, H };
}

function solveDepthForArea(S, Top, Bottom, H) {
  if (H <= 0) return 0;
  let b = Top;
  let c = (Bottom - Top) / (2 * H);
  
  if (Math.abs(c) < 0.0001) { // Rectangle case
    return S / b;
  } else { // Trapezoid case
    // quadratic: c * y^2 + b * y - S = 0
    let discriminant = b * b + 4 * c * S;
    if (discriminant < 0) return 0; // should not happen if S is valid
    let y1 = (-b + Math.sqrt(discriminant)) / (2 * c);
    let y2 = (-b - Math.sqrt(discriminant)) / (2 * c);
    // Return the positive depth
    return (y1 >= 0 && y1 <= H + 0.1) ? y1 : y2;
  }
}

function updateDivisionSketch() {
  if (!divCanvas) initDivisionCanvas();
  if (!divCanvas) return;
  
  landDims = getLandDimensions();
  
  let currentHeirs = typeof heirsData !== 'undefined' ? heirsData : [];
  
  if (landDims.H <= 0 || !currentHeirs || currentHeirs.length === 0) {
    divCtx.clearRect(0, 0, divCanvas.width, divCanvas.height);
    return;
  }
  piecesData = [];
  let cumulativeArea = 0;
  let currentY = 0;
  let currentTop = landDims.top;

  let currentHeirs = typeof heirsData !== 'undefined' ? heirsData : [];

  currentHeirs.forEach((heir, idx) => {
    let area = heir.shareSqm || heir.share || 0; cumulativeArea += area;
    
    // Calculate the depth 'y' from the very top of the land where this piece ends
    let nextY = solveDepthForArea(cumulativeArea, landDims.top, landDims.bottom, landDims.H);
    if (nextY > landDims.H) nextY = landDims.H; // clamp
    
    let depthThickness = nextY - currentY;
    
    // Width at the bottom of this piece
    let nextBottom = landDims.top + (nextY / landDims.H) * (landDims.bottom - landDims.top);
    if (idx === window.heirsData.length - 1) nextBottom = landDims.bottom; // exact match for last
    
    // Calculate side lengths for this piece
    let leftLen = (depthThickness / landDims.H) * landDims.left;
    let rightLen = (depthThickness / landDims.H) * landDims.right;
    
    // Save to global heirsData so script.js can read it for the table
    if (typeof heirsData !== 'undefined' && heirsData[idx]) {
      heirsData[idx].topW = currentTop;
      heirsData[idx].botW = nextBottom;
      heirsData[idx].leftL = leftLen;
      heirsData[idx].rightL = rightLen;
    }

    piecesData.push({
      idx: idx,
      name: heir.name || `القطعة ${idx + 1}`,
      area: area,
      topW: currentTop,
      botW: nextBottom,
      leftL: leftLen,
      rightL: rightLen,
      depthY1: currentY,
      depthY2: nextY
    });

    currentY = nextY;
    currentTop = nextBottom;
  });

  drawSketch();
}

function drawSketch() {
  divCtx.clearRect(0, 0, divCanvas.width, divCanvas.height);
  if (piecesData.length === 0 || landDims.H <= 0) return;

  // We draw the shape vertically (top to bottom).
  // Calculate max width for scaling
  let maxW = Math.max(landDims.top, landDims.bottom);
  let totalH = landDims.H;

  const availWidth = divCanvas.width - padding * 2;
  const availHeight = divCanvas.height - padding * 2;
  
  const scaleX = availWidth / maxW;
  const scaleY = availHeight / totalH;
  const scale = Math.min(scaleX, scaleY); 

  const drawMaxW = maxW * scale;
  const drawH = totalH * scale;
  
  const startX = (divCanvas.width) / 2; // center X
  const startY = (divCanvas.height - drawH) / 2;

  divCtx.lineWidth = 2;
  divCtx.font = '14px Tajawal, Arial';
  divCtx.textAlign = 'center';
  divCtx.textBaseline = 'middle';

  piecesData.forEach((p, i) => {
    let y1 = startY + p.depthY1 * scale;
    let y2 = startY + p.depthY2 * scale;
    let w1 = p.topW * scale;
    let w2 = p.botW * scale;

    // We center each horizontal line
    let x1_left = startX - w1 / 2;
    let x1_right = startX + w1 / 2;
    let x2_left = startX - w2 / 2;
    let x2_right = startX + w2 / 2;

    // Save for interaction (dividers are the horizontal lines between pieces)
    if (i < piecesData.length - 1) {
      p.dividerLine = { y: y2, xLeft: x2_left, xRight: x2_right };
    }

    // Draw Polygon
    divCtx.beginPath();
    divCtx.moveTo(x1_left, y1);
    divCtx.lineTo(x1_right, y1);
    divCtx.lineTo(x2_right, y2);
    divCtx.lineTo(x2_left, y2);
    divCtx.closePath();
    
    divCtx.fillStyle = (i % 2 === 0) ? '#f9f9f9' : '#eef2f5';
    divCtx.fill();
    divCtx.strokeStyle = '#333';
    divCtx.stroke();

    // Draw Texts
    divCtx.fillStyle = '#000';
    let textY = (y1 + y2) / 2;
    
    divCtx.font = 'bold 16px Arial';
    divCtx.fillText(p.name, startX, textY - 10);
    divCtx.font = '14px Arial';
    divCtx.fillText(`${p.area.toFixed(2)} م²`, startX, textY + 15);

    // Draw Top Width (only for first piece)
    divCtx.fillStyle = '#d32f2f'; // Red for horizontal widths
    if (i === 0) {
      divCtx.fillText(`${p.topW.toFixed(2)}`, startX, y1 - 10);
    }
    // Draw Bottom Width (for all pieces)
    divCtx.fillText(`${p.botW.toFixed(2)}`, startX, y2 + (i === piecesData.length - 1 ? 15 : 12));

    // Draw Side Lengths
    divCtx.fillStyle = '#1976d2'; // Blue for side lengths
    // Left side
    let midLeftX = (x1_left + x2_left) / 2;
    divCtx.fillText(`${p.leftL.toFixed(2)}`, midLeftX - 25, textY);
    // Right side
    let midRightX = (x1_right + x2_right) / 2;
    divCtx.fillText(`${p.rightL.toFixed(2)}`, midRightX + 25, textY);

    // Draw Handle for dragging
    if (i < piecesData.length - 1) {
      divCtx.beginPath();
      divCtx.arc(x2_right + 10, y2, 6, 0, Math.PI * 2);
      divCtx.fillStyle = '#388e3c';
      divCtx.fill();
      divCtx.stroke();
      p.dividerDrawHandleY = y2;
    }
  });
}

// Interaction Logic (Dragging vertical dividers)
function getEventPos(e) {
  let rect = divCanvas.getBoundingClientRect();
  let clientX = e.clientX;
  let clientY = e.clientY;
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  }
  return {
    x: (clientX - rect.left) * (divCanvas.width / rect.width),
    y: (clientY - rect.top) * (divCanvas.height / rect.height)
  };
}

function handlePointerDown(e) {
  const pos = getEventPos(e);
  
  // Check if clicked on a divider handle
  for (let i = 0; i < piecesData.length - 1; i++) {
    let p = piecesData[i];
    if (p.dividerDrawHandleY) {
      // Hitbox around the horizontal line and handle
      if (Math.abs(pos.y - p.dividerDrawHandleY) < 15) {
        isDraggingDivider = true;
        draggedDividerIdx = i;
        dragStartY = pos.y;
        originalDepths = piecesData.map(pd => pd.depthY2);
        e.preventDefault();
        return;
      }
    }
  }
}

function handlePointerMove(e) {
  if (!isDraggingDivider) return;
  e.preventDefault();
  
  const pos = getEventPos(e);
  const dy = pos.y - dragStartY;
  
  // Calculate scale
  let maxW = Math.max(landDims.top, landDims.bottom);
  const scale = (divCanvas.height - padding * 2) / landDims.H;
  
  const dyMeters = dy / scale;

  let newDepth = originalDepths[draggedDividerIdx] + dyMeters;
  
  // Constraints (cannot cross adjacent dividers)
  let prevDepth = draggedDividerIdx > 0 ? originalDepths[draggedDividerIdx - 1] : 0;
  let nextDepth = originalDepths[draggedDividerIdx + 1]; // which is piece's bottom
  
  if (newDepth <= prevDepth + 0.1) newDepth = prevDepth + 0.1;
  if (newDepth >= nextDepth - 0.1) newDepth = nextDepth - 0.1;

  // Re-calculate areas for piece i and i+1
  let p1 = piecesData[draggedDividerIdx];
  let p2 = piecesData[draggedDividerIdx + 1];
  
  p1.depthY2 = newDepth;
  p2.depthY1 = newDepth;
  
  // Calculate new Top/Bottom widths for the boundary
  let newBoundaryW = landDims.top + (newDepth / landDims.H) * (landDims.bottom - landDims.top);
  p1.botW = newBoundaryW;
  p2.topW = newBoundaryW;

  // New areas using trapezoid formula
  let newArea1 = ((p1.topW + p1.botW) / 2) * (p1.depthY2 - p1.depthY1);
  let newArea2 = ((p2.topW + p2.botW) / 2) * (p2.depthY2 - p2.depthY1);
  
  p1.area = newArea1;
  p2.area = newArea2;

  // New side lengths
  p1.leftL = ((p1.depthY2 - p1.depthY1) / landDims.H) * landDims.left;
  p1.rightL = ((p1.depthY2 - p1.depthY1) / landDims.H) * landDims.right;
  p2.leftL = ((p2.depthY2 - p2.depthY1) / landDims.H) * landDims.left;
  p2.rightL = ((p2.depthY2 - p2.depthY1) / landDims.H) * landDims.right;

  drawSketch();
}

function handlePointerUp(e) {
  if (isDraggingDivider) {
    isDraggingDivider = false;
    commitAreaChanges(draggedDividerIdx);
    commitAreaChanges(draggedDividerIdx + 1);
    
    if (typeof updateHeirsUI === 'function') {
      updateHeirsUI();
    }
  }
}

function commitAreaChanges(idx) {
  let p = piecesData[idx];
  
  // Update heirs data
  if (typeof heirsData !== 'undefined' && heirsData[idx]) {
    heirsData[idx].share = p.area;
    heirsData[idx].shareSqm = p.area;
    const prices = typeof getPrices === 'function' ? getPrices() : { feddan: 4200.83, carat: 175.03, sahm: 7.29 };
    let sqmM = p.area;
    let f = Math.floor(sqmM / prices.feddan);
    let rem = sqmM % prices.feddan;
    let c = Math.floor(rem / prices.carat);
    let s = (rem % prices.carat) / prices.sahm;

    heirsData[idx].feddan = f;
    heirsData[idx].carat = c;
    heirsData[idx].sahm = s;
  }
}

window.addEventListener('load', () => {
  setTimeout(initDivisionCanvas, 500);
});
