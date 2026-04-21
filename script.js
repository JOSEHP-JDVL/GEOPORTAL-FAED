const supabaseUrl = 'https://kisejsikybadcaopnatj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpc2Vqc2lreWJhZGNhb3BuYXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzEyMTUsImV4cCI6MjA4ODY0NzIxNX0.0YKZu1fCJBqP9hrTTdzLuvyz8oqhn_hPANEdN8XCBf8';

const tablas = [
  "bouloye_1", "coges_kougari", "fetombaga", "grande_mare_de_dori", 
  "jamweli", "kampiti", "kel_eguief", "kougari_1", "kougari_2", "wendou"
  "todori2", "kougari_3", "jardin_torodi"
];

const map = L.map('map', { zoomControl: false }).setView([0, 0], 2);
L.control.zoom({ position: 'bottomright' }).addTo(map);

const googleSat = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
  maxZoom: 20, attribution: '© Google'
});
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19, attribution: '© OpenStreetMap'
});

googleSat.addTo(map);

document.querySelectorAll('input[name="basemap"]').forEach(radio => {
  radio.addEventListener('change', function() {
    if (this.value === 'satellite') {
      map.removeLayer(osm);
      googleSat.addTo(map);
    } else {
      map.removeLayer(googleSat);
      osm.addTo(map);
    }
  });
});

const todasLasCapas = L.featureGroup().addTo(map);
let sumaTotalArea = 0;

const svgPolygon = `
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 4h16v16H4z"/>
    <circle cx="4" cy="4" r="2" fill="currentColor"/>
    <circle cx="20" cy="4" r="2" fill="currentColor"/>
    <circle cx="20" cy="20" r="2" fill="currentColor"/>
    <circle cx="4" cy="20" r="2" fill="currentColor"/>
  </svg>
`;

async function cargarTodasLasCapas() {
  const contenedorBotones = document.getElementById('botones-capas');
  const statsBody = document.getElementById('stats-body');

  for (const tabla of tablas) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/${tabla}?select=*`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Accept': 'application/geo+json'
        }
      });

      if (!res.ok) throw new Error(`Error en ${tabla}: ${res.statusText}`);
      const geojsonData = await res.json();

      if (geojsonData.features && geojsonData.features.length > 0) {
        
        const capaLayer = L.geoJSON(geojsonData, {
          style: { 
            color: "#0d6b38",       /* Verde corporativo para el borde */
            weight: 2, 
            fillColor: "#22c55e",   /* Verde brillante para el relleno */
            fillOpacity: 0.45 
          },
          onEachFeature: function (feature, layer) {
            
            let popupContent = `<div class="custom-popup">`;
            if (feature.properties.name) popupContent += `<b class="popup-title">${feature.properties.name}</b>`;
            if (feature.properties.commune) popupContent += `<b>COMMUNE:</b> ${feature.properties.commune}<br>`;
            if (feature.properties.uso) popupContent += `<b>UTILISATION DES TERRES:</b> ${feature.properties.uso}<br>`;
            if (feature.properties.especes) popupContent += `<b>ESPÈCES PLANTÉES:</b> ${feature.properties.especes}<br>`;
            if (feature.properties.type) popupContent += `<b>TYPE DE TRAITEMENT:</b> ${feature.properties.type}<br>`;
            if (feature.properties.sup_ha) popupContent += `<b>SUPERFICIE:</b> ${feature.properties.sup_ha} ha<br>`;
            if (feature.properties.date) popupContent += `<b>DATE:</b> ${feature.properties.date}`;
            popupContent += `</div>`;
            
            layer.bindPopup(popupContent);

            const nombreParcela = feature.properties.name || tabla;
            const area = parseFloat(feature.properties.sup_ha) || 0;
            sumaTotalArea += area;

            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${nombreParcela}</td><td class="text-right">${area.toFixed(2)}</td>`;
            statsBody.appendChild(tr);
          }
        });

        todasLasCapas.addLayer(capaLayer);

        const btn = document.createElement('button');
        btn.className = 'layer-btn';
        const nombreMostrar = geojsonData.features[0].properties.name || tabla; 
        
        btn.innerHTML = `${svgPolygon} <span>${nombreMostrar}</span>`;
        btn.onclick = () => {
          map.fitBounds(capaLayer.getBounds(), { padding: [50, 50], maxZoom: 16 });
          const layers = capaLayer.getLayers();
          if(layers.length > 0) {
             layers[0].openPopup();
          }
        };
        contenedorBotones.appendChild(btn);
      }

    } catch (err) {
      console.error(`Error cargando ${tabla}:`, err);
    }
  }

  document.getElementById('total-area').textContent = sumaTotalArea.toFixed(2);

  if (todasLasCapas.getLayers().length > 0) {
    map.fitBounds(todasLasCapas.getBounds(), { padding: [30, 30] });
  }
}

cargarTodasLasCapas();
