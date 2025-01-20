// Inicializa el mapa centrado en Peñalolén con un zoom adecuado
var map = L.map('map').setView([-33.477489, -70.5428551], 13);

// Capas de Mapbox
var capaClaro = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoieG9yb2R1aSIsImEiOiJjbTV6cjVvc3AwNXU0Mm1wcnE2aXY2ajluIn0.rtWpA-bxHz277RrdK6qc0w', {
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

// Agrega la capa inicial
capaClaro.addTo(map);

// Control de capas
var capasBase = {
    "Mapa Claro": capaClaro,
    "Mapa Satélite": capaSatelite
};
L.control.layers(capasBase, null, { position: 'topleft' }).addTo(map);

// Carga los datos desde el archivo JSON
fetch('data/puntos.json')
    .then(response => response.json())
    .then(data => {
        data.forEach(punto => {
            // Agregar marcador
            L.marker([punto.lat, punto.lng])
                .addTo(map)
                .bindPopup(`
                    <b>${punto.nombre}</b><br>
                    ${punto.descripcion}<br>
                    <b>Estado:</b> ${punto.estado}<br>
                    <b>Presupuesto:</b> ${punto.presupuesto}<br>
                    <b>Inicio:</b> ${punto.fecha_inicio}<br>
                    <b>Término:</b> ${punto.fecha_termino}<br>
                    <b>Empresa:</b> ${punto.empresa_responsable}<br>
                    <div style="width:100%; background-color:#ddd; margin-top:5px;">
                        <div style="width:${punto.avance}; background-color:green; height:10px;"></div>
                    </div>
                    <b>Avance:</b> ${punto.avance}<br>
                    <a href="${punto.link}" target="_blank" style="color:blue; text-decoration:underline;">Más información</a><br>
                    <a href="${punto.documentos}" target="_blank" style="color:blue; text-decoration:underline;">Documentos</a>
                `);

            // Agregar área de intervención si existe
            if (punto.area) {
                L.polygon(punto.area, {
                    color: 'blue',
                    fillColor: '#3388ff',
                    fillOpacity: 0.5
                }).addTo(map).bindPopup(`Área de intervención de: <b>${punto.nombre}</b>`);
            }
        });
        fetch('data/puntos.json')
    .then(response => response.json())
    .then(data => {
        data.forEach(punto => {
            // Color del área basado en el estado
            let areaColor;
            if (punto.estado === "Finalizado") {
                areaColor = "green"; // Verde para proyectos finalizados
            } else if (punto.estado === "En licitación") {
                areaColor = "blue"; // Azul para proyectos en licitación
            } else {
                areaColor = "gray"; // Gris para otros estados
            }

            // Agregar marcador
            L.marker([punto.lat, punto.lng])
                .addTo(map)
                .bindPopup(`
                    <b>${punto.nombre}</b><br>
                    ${punto.descripcion}<br>
                    <b>Estado:</b> ${punto.estado}<br>
                    <b>Presupuesto:</b> ${punto.presupuesto}<br>
                    <b>Inicio:</b> ${punto.fecha_inicio}<br>
                    <b>Término:</b> ${punto.fecha_termino}<br>
                    <div style="width:100%; background-color:#ddd; margin-top:5px;">
                        <div style="width:${punto.avance}; background-color:green; height:10px;"></div>
                    </div>
                    <b>Avance:</b> ${punto.avance}<br>
                    <a href="${punto.link}" target="_blank" style="color:blue; text-decoration:underline;">Más información</a><br>
                    <a href="${punto.documentos}" target="_blank" style="color:blue; text-decoration:underline;">Documentos</a>
                `);

            // Agregar área de intervención si existe
            if (punto.area) {
                L.polygon(punto.area, {
                    color: areaColor, // Color del borde
                    fillColor: areaColor, // Color del área
                    fillOpacity: 0.5
                }).addTo(map).bindPopup(`Área de intervención de: <b>${punto.nombre}</b>`);
            }
        });
    })
    .catch(error => console.error('Error al cargar los datos:', error));

    })
    .catch(error => console.error('Error al cargar los datos:', error));

// Agrega el control de búsqueda
L.Control.geocoder({
    defaultMarkGeocode: false
})
.on('markgeocode', function(e) {
    var latlng = e.geocode.center;
    L.marker(latlng)
        .addTo(map)
        .bindPopup(`Ubicación buscada: <b>${e.geocode.name}</b>`)
        .openPopup();
    map.setView(latlng, 16);
})
.addTo(map);

// Crear la leyenda
var legend = L.control({ position: 'bottomright' });

legend.onAdd = function(map) {
    var div = L.DomUtil.create('div', 'legend');
    div.innerHTML += '<h4>Leyenda</h4>';
    div.innerHTML += '<i style="background: blue; width: 18px; height: 18px; display: inline-block; margin-right: 8px;"></i> Área de intervención<br>';
    div.innerHTML += '<i style="background: green; width: 18px; height: 18px; display: inline-block; margin-right: 8px;"></i> Proyecto finalizado<br>';
    div.innerHTML += '<i style="background: gray; width: 18px; height: 18px; display: inline-block; margin-right: 8px;"></i> Sin estado definido<br>';
    return div;
};

// Agregar la leyenda al mapa
legend.addTo(map);

// Botón de geolocalización
var geolocateBtn = L.control({ position: 'topleft' });
geolocateBtn.onAdd = function(map) {
    var div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
    div.innerHTML = '<button style="background:white; padding:5px; border:1px solid #ccc; border-radius:4px;">📍 Mi ubicación</button>';
    div.onclick = function() {
        navigator.geolocation.getCurrentPosition(function(location) {
            var latlng = [location.coords.latitude, location.coords.longitude];
            L.marker(latlng).addTo(map)
                .bindPopup('Tu ubicación actual')
                .openPopup();
            map.setView(latlng, 16);
        }, function() {
            alert('No se pudo obtener tu ubicación. Verifica los permisos.');
        });
    };
    return div;
};
geolocateBtn.addTo(map);

// Botón de exportación
L.easyPrint({
    title: 'Exportar a Imagen o PDF',
    position: 'topright',
    filename: 'Mapa_Peñalolén',
    exportOnly: true, // Exporta directamente sin imprimir
    sizeModes: ['A4Portrait', 'A4Landscape'] // Soporte de orientación
}).addTo(map);


