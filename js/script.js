// Inicializa el mapa centrado en Peñalolén con un zoom adecuado
var map = L.map('map').setView([-33.477489, -70.5428551], 14);

// Capa base de Mapbox "Light"
var capaClaro = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoieG9yb2R1aSIsImEiOiJjbTV6cjVvc3AwNXU0Mm1wcnE2aXY2ajluIn0.rtWpA-bxHz277RrdK6qc0w', {
    attribution: '© <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 19,
    tileSize: 512,
    zoomOffset: -1
});
capaClaro.addTo(map);

// Capas adicionales
var capaOscuro = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoieG9yb2R1aSIsImEiOiJjbTV6cjVvc3AwNXU0Mm1wcnE2aXY2ajluIn0.rtWpA-bxHz277RrdK6qc0w', {
    attribution: '© <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 19,
    tileSize: 512,
    zoomOffset: -1
});

var capaSatelite = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoieG9yb2R1aSIsImEiOiJjbTV6cjVvc3AwNXU0Mm1wcnE2aXY2ajluIn0.rtWpA-bxHz277RrdK6qc0w', {
    attribution: '© <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 19,
    tileSize: 512,
    zoomOffset: -1
});

// Control de capas base
var capasBase = {
    "Mapa Claro": capaClaro,
    "Mapa Oscuro": capaOscuro,
    "Mapa Satélite": capaSatelite
};
L.control.layers(capasBase, null, { position: 'topleft' }).addTo(map);

// Define colores para marcadores según estado
function getMarkerColor(estado) {
    switch (estado) {
        case "Finalizado":
            return "green";
        case "En construcción":
            return "yellow";    
        case "En licitación":
            return "blue";
        default:
            return "gray";
    }
}

// Variables globales
var markers = []; // Array de marcadores para manejar filtros
var estadisticas = { "Finalizado": 0, "En licitación": 0, "En construcción": 0, "Sin estado definido": 0 };

// Carga los datos desde el archivo JSON
fetch('data/puntos.json')
    .then(response => response.json())
    .then(data => {
        data.forEach(punto => {
            const markerColor = getMarkerColor(punto.estado);
            estadisticas[punto.estado] = (estadisticas[punto.estado] || 0) + 1;

            const customIcon = L.divIcon({
                className: "custom-icon",
                html: `<div style="background-color:${markerColor}; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white;"></div>`,
                iconSize: [18, 18],
                iconAnchor: [9, 9]
            });

            const marker = L.marker([punto.lat, punto.lng], { icon: customIcon })
                .bindPopup(`
                    <b>${punto.nombre}</b><br>
                    ${punto.descripcion}<br>
                    <b>Estado:</b> ${punto.estado}<br>
                    <b>Presupuesto:</b> ${punto.presupuesto}<br>
                    <b>Inicio:</b> ${punto.fecha_inicio}<br>
                    <b>Término:</b> ${punto.fecha_termino}<br>
                    <b>Empresa Responsable:</b> ${punto.empresa_responsable}<br>
                    <b>Avance:</b> ${punto.avance}<br>
                    <a href="${punto.link}" target="_blank" style="color:blue; text-decoration:underline;">Más información</a><br>
                    <a href="${punto.documentos}" target="_blank" style="color:blue; text-decoration:underline;">ID Licitación / Documentos</a>
                `);

            marker.addTo(map);
            markers.push({ marker, estado: punto.estado });

            if (punto.area) {
                L.polygon(punto.area, {
                    color: markerColor,
                    fillColor: markerColor,
                    fillOpacity: 0.4
                }).addTo(map).bindPopup(`Área de intervención de: <b>${punto.nombre}</b>`);
            }
        });

        // Renderiza el gráfico de estadísticas después de cargar los datos
        renderizarGrafico(estadisticas);
    })
    .catch(error => console.error('Error al cargar los datos:', error));

// Renderizar gráfico de estadísticas
function renderizarGrafico(estadisticas) {
    var ctx = document.getElementById('estadisticas').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(estadisticas),
            datasets: [{
                data: Object.values(estadisticas),
                backgroundColor: ['green', 'blue', 'yellow', 'gray']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

// Filtrar por estado
function filtrarPorEstado(estado) {
    markers.forEach(({ marker, estado: estadoMarcador }) => {
        if (estado === "todos" || estadoMarcador === estado) {
            map.addLayer(marker);
        } else {
            map.removeLayer(marker);
        }
    });
}

document.getElementById('filtroEstado').addEventListener('change', function () {
    const estadoSeleccionado = this.value;
    filtrarPorEstado(estadoSeleccionado);
});

// Cargar límites de Peñalolén
fetch('data/limites_penalolen.geojson')
    .then(response => response.json())
    .then(geojsonData => {
        L.geoJSON(geojsonData, {
            style: {
                color: '#FF5733',
                weight: 2,
                fillColor: '#FFC300',
                fillOpacity: 0.1
            }
        }).addTo(map);
    })
    .catch(error => console.error('Error al cargar los límites:', error));

// Leyenda
var legend = L.control({ position: 'bottomright' });

legend.onAdd = function (map) {
    var div = L.DomUtil.create("div", "legend");
    div.innerHTML += "<h4>Estado de la Obra</h4>";
    div.innerHTML += '<i style="background: green; width: 18px; height: 18px; display: inline-block; margin-right: 8px;"></i> Finalizado<br>';
    div.innerHTML += '<i style="background: blue; width: 18px; height: 18px; display: inline-block; margin-right: 8px;"></i> En licitación<br>';
    div.innerHTML += '<i style="background: yellow; width: 18px; height: 18px; display: inline-block; margin-right: 8px;"></i> En construcción<br>';
    div.innerHTML += '<i style="background: gray; width: 18px; height: 18px; display: inline-block; margin-right: 8px;"></i> Sin estado definido<br>';
    return div;
};
legend.addTo(map);

// Botón de geolocalización
var geolocateBtn = L.control({ position: 'topleft' });
geolocateBtn.onAdd = function () {
    var div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
    div.innerHTML = '<button style="background:white; border:1px solid #ccc; padding:5px; border-radius:4px;">📍 Mi ubicación</button>';
    div.onclick = function () {
        navigator.geolocation.getCurrentPosition(function (location) {
            var latlng = [location.coords.latitude, location.coords.longitude];
            L.marker(latlng).addTo(map)
                .bindPopup('Tu ubicación actual')
                .openPopup();
            map.setView(latlng, 16);
        }, function () {
            alert('No se pudo obtener tu ubicación. Verifica los permisos.');
        });
    };
    return div;
};
geolocateBtn.addTo(map);
