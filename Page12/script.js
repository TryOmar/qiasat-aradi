// Page 12 - Interactive Map Drawing and Land Division

let map;
let drawnPolygon = null;
let edgeLabelsGroup;
let divisionLayersGroup;
let caratArea = 175.035; // Default carat area

document.addEventListener("DOMContentLoaded", function () {
  initMap();
  toggleDivisionInputs();
});

function initMap() {
  // Initialize map centered on Egypt
  map = L.map("map", {
    center: [27.0, 30.0],
    zoom: 6,
    zoomControl: true
  });

  // Base Layers
  const googleHybrid = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    maxZoom: 22,
    attribution: 'Google'
  });

  const openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: 'OpenStreetMap'
  });

  // Set Google Hybrid as default (perfect for agricultural fields)
  googleHybrid.addTo(map);

  // Layer Control
  const baseLayers = {
    "قمر صناعي (جوجل)": googleHybrid,
    "خريطة الشوارع (OSM)": openStreetMap
  };
  L.control.layers(baseLayers, {}, { position: 'topright' }).addTo(map);

  // Layer groups for labels and division slices
  edgeLabelsGroup = L.layerGroup().addTo(map);
  divisionLayersGroup = L.layerGroup().addTo(map);

  // Configure Leaflet Geoman
  map.pm.addControls({
    position: 'topleft',
    drawMarker: false,
    drawCircleMarker: false,
    drawPolyline: false,
    drawRectangle: false,
    drawCircle: false,
    drawPolygon: true,
    editMode: true,
    dragMode: true,
    cutPolygon: false,
    removalMode: true
  });

  // Set language to Arabic
  map.pm.setLang('ar');

  // Handle Drawing Events
  map.on('pm:create', function (e) {
    if (e.shape === 'Polygon') {
      // If a polygon already exists, remove it
      if (drawnPolygon) {
        map.removeLayer(drawnPolygon);
      }
      
      drawnPolygon = e.layer;
      
      // Clear any previous divisions
      clearDivisions();
      
      // Enable editing mode immediately
      drawnPolygon.pm.enable({
        allowSelfIntersection: false
      });
      
      // Calculate and update
      updateCalculations();
      
      // Listen to changes on the polygon
      drawnPolygon.on('pm:edit', function () {
        clearDivisions();
        updateCalculations();
      });
      
      drawnPolygon.on('pm:dragend', function () {
        clearDivisions();
        updateCalculations();
      });
      
      drawnPolygon.on('pm:remove', function () {
        drawnPolygon = null;
        clearDivisions();
        resetAreaDisplay();
      });
    }
  });
}

function updateCalculations() {
  if (!drawnPolygon) return;

  // 1. Get carat area
  caratArea = parseFloat(document.getElementById("input-carat-area").value);

  // 2. Calculate Area using Turf.js
  const geojson = drawnPolygon.toGeoJSON();
  const areaM2 = turf.area(geojson);
  
  // Convert to Feddan, Qirat, Sahm
  const totalCarats = areaM2 / caratArea;
  const acres = Math.floor(totalCarats / 24);
  const carats = Math.floor(totalCarats % 24);
  const shares = ((totalCarats % 1) * 24).toFixed(1);

  // Update UI
  document.getElementById("area-m2").innerText = areaM2.toFixed(1);
  document.getElementById("area-acre").innerText = acres;
  document.getElementById("area-carat").innerText = carats;
  document.getElementById("area-shares").innerText = shares;

  // 3. Update Edge Labels (Dimensions)
  updateEdgeLabels();
}

function updateEdgeLabels() {
  edgeLabelsGroup.clearLayers();
  if (!drawnPolygon) return;

  const latlngs = drawnPolygon.getLatLngs()[0];
  for (let i = 0; i < latlngs.length; i++) {
    const nextIndex = (i + 1) % latlngs.length;
    const p1 = latlngs[i];
    const p2 = latlngs[nextIndex];

    // Distance in meters
    const distance = p1.distanceTo(p2);
    const midpoint = L.latLng((p1.lat + p2.lat) / 2, (p1.lng + p2.lng) / 2);

    // Create a custom label marker
    L.marker(midpoint, {
      icon: L.divIcon({
        className: 'edge-label-icon',
        html: `<div style="background: rgba(255, 255, 255, 0.9); padding: 2px 6px; border: 1.5px solid #1b5e20; border-radius: 4px; font-size: 11px; font-weight: bold; white-space: nowrap; color: #1b5e20; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">${distance.toFixed(1)} م</div>`,
        iconSize: [40, 20],
        iconAnchor: [20, 10]
      })
    }).addTo(edgeLabelsGroup);
  }
}

function toggleDivisionInputs() {
  const type = document.getElementById("division-type").value;
  if (type === "equal") {
    document.getElementById("equal-div-group").style.display = "block";
    document.getElementById("custom-div-group").style.display = "none";
  } else {
    document.getElementById("equal-div-group").style.display = "none";
    document.getElementById("custom-div-group").style.display = "block";
  }
  validateInputs();
}

function validateInputs() {
  // Can add validation logic here if needed
}

function resetAreaDisplay() {
  document.getElementById("area-m2").innerText = "0.0";
  document.getElementById("area-acre").innerText = "0";
  document.getElementById("area-carat").innerText = "0";
  document.getElementById("area-shares").innerText = "0.0";
}

function clearDivisions() {
  divisionLayersGroup.clearLayers();
  document.getElementById("slices-card").style.display = "none";
  document.getElementById("slices-table-body").innerHTML = "";
}

function resetMap() {
  if (drawnPolygon) {
    map.removeLayer(drawnPolygon);
    drawnPolygon = null;
  }
  clearDivisions();
  resetAreaDisplay();
  edgeLabelsGroup.clearLayers();
}

// Color Palette for Division Slices
const sliceColors = [
  "#2e7d32", // Green
  "#1565c0", // Blue
  "#ef6c00", // Orange
  "#6a1b9a", // Purple
  "#00838f", // Teal
  "#c62828", // Red
  "#4e342e", // Brown
  "#37474f"  // Slate
];

function divideLand() {
  if (!drawnPolygon) {
    alert("الرجاء رسم قطعة الأرض على الخريطة أولاً باستخدام أداة المضلع ⬡.");
    return;
  }

  clearDivisions();

  const geojson = drawnPolygon.toGeoJSON();
  const totalAreaM2 = turf.area(geojson);
  
  caratArea = parseFloat(document.getElementById("input-carat-area").value);
  const totalCarats = totalAreaM2 / caratArea;

  const type = document.getElementById("division-type").value;
  const direction = document.getElementById("division-direction").value;

  let targetAreasM2 = [];
  let shareNames = [];

  if (type === "equal") {
    const numPartners = parseInt(document.getElementById("num-partners").value) || 2;
    const shareAreaM2 = totalAreaM2 / numPartners;
    for (let i = 0; i < numPartners; i++) {
      targetAreasM2.push(shareAreaM2);
      shareNames.push(`شريك ${i + 1} (نصيب متساوي)`);
    }
  } else {
    // Custom Shares
    const sharesStr = document.getElementById("custom-shares").value;
    if (!sharesStr) {
      alert("الرجاء إدخال الحصص بالقراريط مفصولة بفاصلة.");
      return;
    }
    const shares = sharesStr.split(",").map(s => parseFloat(s.trim())).filter(s => !isNaN(s) && s > 0);
    if (shares.length === 0) {
      alert("الرجاء إدخال حصص صحيحة.");
      return;
    }

    const sumShares = shares.reduce((a, b) => a + b, 0);
    if (sumShares > totalCarats + 0.01) {
      alert(`مجموع الحصص المدخلة (${sumShares.toFixed(2)} قيراط) أكبر من مساحة الأرض الكلية (${totalCarats.toFixed(2)} قيراط)!`);
      return;
    }

    shares.forEach((share, i) => {
      targetAreasM2.push(share * caratArea);
      shareNames.push(`شريك ${i + 1} (${share} قيراط)`);
    });

    // If there is a remainder, add it as a leftover slice
    const remainderCarats = totalCarats - sumShares;
    if (remainderCarats > 0.001) {
      targetAreasM2.push(remainderCarats * caratArea);
      shareNames.push(`المتبقي من الأرض (${remainderCarats.toFixed(2)} قيراط)`);
    }
  }

  // Slice the polygon
  const slices = slicePolygon(geojson, targetAreasM2, direction);

  if (!slices || slices.length === 0) {
    alert("حدث خطأ أثناء تقسيم الأرض. يرجى التأكد من أن شكل الأرض بسيط وغير متقاطع.");
    return;
  }

  // Display Slices on Map
  displaySlices(slices, shareNames, totalAreaM2);
}

// Slice a polygon into strips with exact target areas
function slicePolygon(polygonFeature, targetAreasM2, direction) {
  const bbox = turf.bbox(polygonFeature);
  const minX = bbox[0];
  const minY = bbox[1];
  const maxX = bbox[2];
  const maxY = bbox[3];

  const slices = [];
  const n = targetAreasM2.length;
  
  let cumulativeTargetArea = 0;
  let lastCoord = (direction === "vertical") ? minX : minY;

  for (let i = 0; i < n - 1; i++) {
    cumulativeTargetArea += targetAreasM2[i];

    // Binary search for the dividing coordinate (X or Y)
    let low = (direction === "vertical") ? minX : minY;
    let high = (direction === "vertical") ? maxX : maxY;
    let mid = (low + high) / 2;

    for (let iter = 0; iter < 25; iter++) {
      let clipBox;
      if (direction === "vertical") {
        clipBox = turf.bboxPolygon([minX, minY, mid, maxY]);
      } else {
        clipBox = turf.bboxPolygon([minX, minY, maxX, mid]);
      }

      let intersection = null;
      try {
        intersection = turf.intersect(polygonFeature, clipBox);
      } catch (e) {}

      const area = intersection ? turf.area(intersection) : 0;

      if (area < cumulativeTargetArea) {
        low = mid;
      } else {
        high = mid;
      }
      mid = (low + high) / 2;
    }

    // Create the slice by intersecting with a box between lastCoord and mid
    let sliceBox;
    if (direction === "vertical") {
      sliceBox = turf.bboxPolygon([lastCoord, minY, mid, maxY]);
    } else {
      sliceBox = turf.bboxPolygon([minX, lastCoord, maxX, mid]);
    }

    let slicePoly = null;
    try {
      slicePoly = turf.intersect(polygonFeature, sliceBox);
    } catch (e) {}

    if (slicePoly) {
      slices.push(slicePoly);
    }
    lastCoord = mid;
  }

  // Add the last slice (from lastCoord to max)
  let lastSliceBox;
  if (direction === "vertical") {
    lastSliceBox = turf.bboxPolygon([lastCoord, minY, maxX, maxY]);
  } else {
    lastSliceBox = turf.bboxPolygon([minX, lastCoord, maxX, maxY]);
  }

  let lastSlicePoly = null;
  try {
    lastSlicePoly = turf.intersect(polygonFeature, lastSliceBox);
  } catch (e) {}

  if (lastSlicePoly) {
    slices.push(lastSlicePoly);
  }

  return slices;
}

function displaySlices(slices, shareNames, totalAreaM2) {
  const tbody = document.getElementById("slices-table-body");
  let tableHtml = "";

  slices.forEach((slice, i) => {
    const color = sliceColors[i % sliceColors.length];
    
    // Add slice to map
    const leafletSlice = L.geoJSON(slice, {
      style: {
        color: color,
        fillColor: color,
        fillOpacity: 0.4,
        weight: 2
      }
    }).addTo(divisionLayersGroup);

    // Calculate slice area
    const sliceAreaM2 = turf.area(slice);
    const sliceCaratsTotal = sliceAreaM2 / caratArea;
    const ac = Math.floor(sliceCaratsTotal / 24);
    const ca = Math.floor(sliceCaratsTotal % 24);
    const sh = ((sliceCaratsTotal % 1) * 24).toFixed(1);
    const percentage = ((sliceAreaM2 / totalAreaM2) * 100).toFixed(1);

    // Bind popup with details
    leafletSlice.bindPopup(`
      <div style="text-align: right; font-family: 'Cairo', sans-serif;">
        <strong style="color: ${color};">${shareNames[i]}</strong><br>
        📍 المساحة: ${ac} فدان، ${ca} قيراط، ${sh} سهم<br>
        📐 تعادل: ${sliceAreaM2.toFixed(1)} م² (${percentage}%)
      </div>
    `);

    // Add row to table
    tableHtml += `
      <tr>
        <td>${i + 1}</td>
        <td style="text-align: right; font-weight: bold; color: ${color};">${shareNames[i]}</td>
        <td>${ac}</td>
        <td>${ca}</td>
        <td>${sh}</td>
        <td>${sliceAreaM2.toFixed(1)} م²</td>
        <td style="font-weight: bold; color: #2e7d32;">${percentage}%</td>
      </tr>
    `;

    // Optionally add dimension labels on the slice boundaries
    addSliceEdgeLabels(slice, color);
  });

  tbody.innerHTML = tableHtml;
  document.getElementById("slices-card").style.display = "block";
}

function addSliceEdgeLabels(sliceGeoJSON, color) {
  // Extract coordinates
  const coordinates = sliceGeoJSON.geometry.coordinates[0];
  
  for (let i = 0; i < coordinates.length - 1; i++) {
    const c1 = coordinates[i];
    const c2 = coordinates[i + 1];
    
    const p1 = L.latLng(c1[1], c1[0]);
    const p2 = L.latLng(c2[1], c2[0]);
    
    const distance = p1.distanceTo(p2);
    
    // Only display labels for lines longer than 3 meters to avoid clutter
    if (distance > 3) {
      const midpoint = L.latLng((p1.lat + p2.lat) / 2, (p1.lng + p2.lng) / 2);
      
      L.marker(midpoint, {
        icon: L.divIcon({
          className: 'edge-label-icon',
          html: `<div style="background: rgba(255, 255, 255, 0.85); padding: 1px 4px; border: 1px dashed ${color}; border-radius: 3px; font-size: 9px; font-weight: bold; white-space: nowrap; color: ${color};">${distance.toFixed(1)} م</div>`,
          iconSize: [30, 15],
          iconAnchor: [15, 7]
        })
      }).addTo(divisionLayersGroup);
    }
  }
}
