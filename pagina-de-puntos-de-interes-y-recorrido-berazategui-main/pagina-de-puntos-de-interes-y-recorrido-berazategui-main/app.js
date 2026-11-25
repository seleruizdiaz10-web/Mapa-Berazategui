mapboxgl.accessToken = 'pk.eyJ1Ijoibmljb2tkZCIsImEiOiJjbXRnNmZ1Z3QwNDg4MnlvaTlucWc3ZmNxIn0.1LVjN5bS_jpUeiIzKUilAw';

// Inicialización del mapa de Mapbox
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-58.2128, -34.7635],
  zoom: 13
});

map.on('error', (e) => {
  console.error('Error de Mapbox:', e);
  document.getElementById('status-bar').style.color = 'red';
  document.getElementById('status-bar').innerText = 'Error al cargar mapa. Verificá tu Token o abrí con un servidor local.';
});

// Variables globales de navegación y marcadores
let destinoMarker = null;
const userMarker = new mapboxgl.Marker({ color: '#007bc7' });
let paradaMarkers = [];
let destinoCoords = null;
let watchId = null;

// Elementos del DOM
const selectElem = document.getElementById('poi-select');
const btnStart = document.getElementById('btn-start');
const btnCancel = document.getElementById('btn-cancel');
const statusBar = document.getElementById('status-bar');

// Elementos de la notificación en página
const routeToast = document.getElementById('route-toast');
const toastClose = document.getElementById('toast-close');
const toastTitle = document.getElementById('toast-title');
const toastTime = document.getElementById('toast-time');
const toastDistance = document.getElementById('toast-distance');
const toastDetail = document.getElementById('toast-detail');

// Elementos de la tarjeta de información del sitio
const poiCard = document.getElementById('poi-info');
const poiImage = document.getElementById('poi-image');
const poiBadge = document.getElementById('poi-badge');
const poiNombre = document.getElementById('poi-nombre');
const poiDireccion = document.getElementById('poi-direccion');
const poiDescripcion = document.getElementById('poi-descripcion');
const poiColectivosPills = document.getElementById('poi-colectivos-pills');
const poiParadasList = document.getElementById('poi-paradas-list');
const poiRamalesList = document.getElementById('poi-ramales-list');
const poiExtraInfo = document.getElementById('poi-extra-info');

// Base de datos de información, imágenes y colectivos de los sitios
const sitiosData = {
  "-58.2086,-34.7639": {
    nombre: "Estación Berazategui",
    categoria: "🚂 Centro de Transbordo Ferroviario",
    direccion: "Lisandro de la Torre y Calle 15 (Centro)",
    descripcion: "Nodo neurálgico del partido de Berazategui inaugurado en 1872. Conecta los ramales del Tren Roca (Plaza Constitución - La Plata y Bosques vía Quilmes) y concentra las principales dársenas de colectivos hacia todo el conurbano sur y CABA. Su acceso principal conecta de manera directa con el centro comercial a cielo abierto de la Calle 14.",
    imagen: "imagenes/estacion-berazategui.jpg",
    imagenFallback: "https://upload.wikimedia.org/wikipedia/commons/b/b6/Estaci%C3%B3n_Berazategui_01.jpg",
    imagenAlt: "Estación ferroviaria de Berazategui - Línea Roca",
    colectivos: [
      { linea: "98", clase: "bus-pill-98", ramales: "Ramales 1 y 5 (Hacia Once / Plaza de Mayo y Quilmes)" },
      { linea: "159", clase: "bus-pill-159", ramales: "Ramales 1, 2, L Azul y Semirápido (Hacia CABA por Autopista/Mitre y Quilmes)" },
      { linea: "219", clase: "bus-pill-219", ramales: "Ramales 3 Negro y 3 Rojo (Hacia Hudson, Cruce Varela y El Pato)" },
      { linea: "300", clase: "bus-pill-300", ramales: "Ramales A y B (Hacia Bosques, Florencio Varela y Quilmes)" },
      { linea: "324", clase: "bus-pill-324", ramales: "Ramales 2 y 3 (Hacia Don Bosco, Bernal, Quilmes y Varela)" },
      { linea: "418", clase: "bus-pill-418", ramales: "Hacia Ranelagh y La Plata" },
      { linea: "603", clase: "bus-pill-603", ramales: "Comunal (Hacia Barrio Marítimo, Cruce Varela y Cementerio)" },
      { linea: "619", clase: "bus-pill-619", ramales: "Comunal (Hacia El Pato, Barrio El Bueno y zona Oeste)" }
    ],
    paradas: [
      {
        nombre: "Dársenas Centrales Estación Berazategui",
        ubicacion: "Calle 15 y Lisandro de la Torre",
        lineas: "159, 219, 300, 603, 619",
        coords: [-58.2091, -34.7641]
      },
      {
        nombre: "Parada Peatonal Calle 14",
        ubicacion: "Calle 14 y Lisandro de la Torre",
        lineas: "98, 159, 324, 418",
        coords: [-58.2081, -34.7635]
      },
      {
        nombre: "Parada Avenida Mitre y Calle 14",
        ubicacion: "Av. Mitre entre 14 y 15 (a 120m)",
        lineas: "98, 159, 219",
        coords: [-58.2100, -34.7629]
      }
    ],
    extra: "🚆 Conexión con Ferrocarril Roca (Plaza Constitución - La Plata / Bosques)"
  },
  "-58.2128,-34.7635": {
    nombre: "Plaza San Martín",
    categoria: "🌳 Espacio Cívico e Histórico",
    direccion: "Av. Mitre y Calle 6 (Berazategui)",
    descripcion: "Conocida popularmente como 'Plaza del Duque', es la plaza fundacional y cívica más importante del centro de la ciudad. Espacio arbolado con fuentes de agua, monumentos cívicos, ferias artesanales y un entorno rodeado de confiterías, bancos y la Parroquia Sagrada Familia.",
    imagen: "imagenes/plaza-san-martin.jpg",
    imagenFallback: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Plaza_San_Mart%C3%ADn_%28Berazategui%29.jpg",
    imagenAlt: "Monumento y arboleda en Plaza San Martín Berazategui",
    colectivos: [
      { linea: "98", clase: "bus-pill-98", ramales: "Ramal 1 (por Av. Mitre hacia Quilmes, Avellaneda y Once)" },
      { linea: "159", clase: "bus-pill-159", ramales: "Ramales 1 y L Azul (por Av. Mitre hacia Correo Central / CABA)" },
      { linea: "219", clase: "bus-pill-219", ramales: "Ramales por Av. Mitre hacia Quilmes y Hudson" },
      { linea: "300", clase: "bus-pill-300", ramales: "Conexión directa Quilmes - Berazategui" },
      { linea: "603", clase: "bus-pill-603", ramales: "Hacia Hospital Evita Pueblo y Barrio Marítimo" },
      { linea: "619", clase: "bus-pill-619", ramales: "Conexión con barrios periféricos" }
    ],
    paradas: [
      {
        nombre: "Parada Av. Mitre y Calle 6",
        ubicacion: "Av. Mitre entre Calle 6 y 7 (Frente a la plaza)",
        lineas: "98, 159, 219, 300",
        coords: [-58.2125, -34.7631]
      },
      {
        nombre: "Parada Calle 6 y 148",
        ubicacion: "Calle 6 y Calle 148",
        lineas: "603, 619",
        coords: [-58.2135, -34.7639]
      }
    ],
    extra: "🏛️ Frente a la Parroquia Sagrada Familia y polo gastronómico céntrico"
  },
  "-58.1802142,-34.843959": {
    nombre: "Parque Pereyra Iraola",
    categoria: "🌿 Reserva Natural y Biósfera UNESCO",
    direccion: "Camino Centenario y Camino Gral. Belgrano",
    descripcion: "La reserva de biodiversidad más grande del Gran Buenos Aires y pulmón verde bonaerense con más de 10.000 hectáreas protegidas por la UNESCO. Destacado por sus senderos silvestres, el famoso 'Árbol de Cristal' único en Sudamérica, zonas de esparcimiento recreativo y la histórica Estancia San Juan.",
    imagen: "imagenes/parque-pereyra.jpg",
    imagenFallback: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Arco_Parque_Provincial_Pereyra_Iraola.jpg",
    imagenAlt: "Arco de acceso y arboleda del Parque Pereyra Iraola",
    colectivos: [
      { linea: "129", clase: "bus-pill-129", ramales: "Hacia Plaza Miserere / Retiro y La Plata (por Centenario)" },
      { linea: "195", clase: "bus-pill-195", ramales: "Costera Metropolitana (La Plata - Retiro directo)" },
      { linea: "273", clase: "bus-pill-273", ramales: "Ramales D y BGC (City Bell, Gonnet, La Plata)" },
      { linea: "324", clase: "bus-pill-324", ramales: "Ramal 3 y 16 (por Camino Gral. Belgrano)" },
      { linea: "338", clase: "bus-pill-338", ramales: "TALP Costera (San Isidro - Morón - Cruce Varela - La Plata)" },
      { linea: "418", clase: "bus-pill-418", ramales: "Berazategui - Ranelagh - La Plata" }
    ],
    paradas: [
      {
        nombre: "Parada Arco Pereyra / Camino Centenario",
        ubicacion: "Acceso Arco del Parque Pereyra Iraola",
        lineas: "129, 195, 273, 418",
        coords: [-58.1743, -34.8347]
      },
      {
        nombre: "Parada Rotonda Gutiérrez",
        ubicacion: "Camino Gral. Belgrano y Ruta 2",
        lineas: "324, 338 TALP",
        coords: [-58.1776, -34.8363]
      }
    ],
    extra: "🚆 A 900 metros de la Estación Pereyra (Ferrocarril Roca ramal La Plata)"
  },
  "-58.1750,-34.8350": {
    nombre: "Parque Pereyra Iraola",
    categoria: "🌿 Reserva Natural y Biósfera UNESCO",
    direccion: "Camino Centenario y Camino Gral. Belgrano",
    descripcion: "La reserva de biodiversidad más grande del Gran Buenos Aires y pulmón verde bonaerense con más de 10.000 hectáreas protegidas por la UNESCO. Destacado por sus senderos silvestres, el famoso 'Árbol de Cristal' único en Sudamérica, zonas de esparcimiento recreativo y la histórica Estancia San Juan.",
    imagen: "imagenes/parque-pereyra.jpg",
    imagenFallback: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Arco_Parque_Provincial_Pereyra_Iraola.jpg",
    imagenAlt: "Arco de acceso y arboleda del Parque Pereyra Iraola",
    colectivos: [
      { linea: "129", clase: "bus-pill-129", ramales: "Hacia Plaza Miserere / Retiro y La Plata (por Centenario)" },
      { linea: "195", clase: "bus-pill-195", ramales: "Costera Metropolitana (La Plata - Retiro directo)" },
      { linea: "273", clase: "bus-pill-273", ramales: "Ramales D y BGC (City Bell, Gonnet, La Plata)" },
      { linea: "324", clase: "bus-pill-324", ramales: "Ramal 3 y 16 (por Camino Gral. Belgrano)" },
      { linea: "338", clase: "bus-pill-338", ramales: "TALP Costera (San Isidro - Morón - Cruce Varela - La Plata)" },
      { linea: "418", clase: "bus-pill-418", ramales: "Berazategui - Ranelagh - La Plata" }
    ],
    paradas: [
      {
        nombre: "Parada Arco Pereyra / Camino Centenario",
        ubicacion: "Acceso Arco del Parque Pereyra Iraola",
        lineas: "129, 195, 273, 418",
        coords: [-58.1743, -34.8347]
      },
      {
        nombre: "Parada Rotonda Gutiérrez",
        ubicacion: "Camino Gral. Belgrano y Ruta 2",
        lineas: "324, 338 TALP",
        coords: [-58.1776, -34.8363]
      }
    ],
    extra: "🚆 A 900 metros de la Estación Pereyra (Ferrocarril Roca ramal La Plata)"
  },
  "-58.2145,-34.7539": {
    nombre: "Plaza Ducilo",
    categoria: "⚽ Espacio Público y Deportivo",
    direccion: "Calle 5 y Calle 151 (Barrio Ducilo)",
    descripcion: "Corazón social y recreativo del emblemático Barrio Ducilo, nacido con la histórica industria textil homónima instalada en la década de 1930. El predio se encuentra junto al Complejo Deportivo Municipal Ducilo, contando con canchas de hockey y tenis, juegos infantiles, pista aeróbica y frondosa arboleda.",
    imagen: "imagenes/plaza-san-martin.jpg",
    imagenFallback: "https://upload.wikimedia.org/wikipedia/commons/3/3c/En_Ducilo%2C_los_materiales_para_su_construcci%C3%B2n_eran_traidos_desde_la_estaci%C3%B2n_de_Ezpeleta.jpg",
    imagenAlt: "Zona histórica e industrial de Ducilo en Berazategui",
    colectivos: [
      { linea: "159", clase: "bus-pill-159", ramales: "Ramales 1 y L Azul (por Av. Mitre y bajada barrial)" },
      { linea: "219", clase: "bus-pill-219", ramales: "Ramal por Av. Mitre hacia Quilmes y Hudson" },
      { linea: "603", clase: "bus-pill-603", ramales: "Comunal hacia Estación Berazategui y Cruce Varela" },
      { linea: "619", clase: "bus-pill-619", ramales: "Comunal hacia el centro y oeste de Berazategui" }
    ],
    paradas: [
      {
        nombre: "Parada Calle 151 y Calle 5",
        ubicacion: "Calle 151 entre 5 y 6 (frente a la plaza)",
        lineas: "603, 619",
        coords: [-58.2142, -34.7537]
      },
      {
        nombre: "Parada Av. Mitre y Calle 5",
        ubicacion: "Av. Mitre y Calle 5 (a 250m)",
        lineas: "159, 219",
        coords: [-58.2158, -34.7544]
      }
    ],
    extra: "🏟️ Junto a las instalaciones del Complejo Deportivo Municipal Ducilo"
  }
};

// Función para obtener la información del sitio según valor o texto
function obtenerInfoSitio(coordsVal, selectOption) {
  if (sitiosData[coordsVal]) {
    return sitiosData[coordsVal];
  }

  // Búsqueda por coincidencia en texto
  const optionText = selectOption ? selectOption.text.toLowerCase() : '';
  for (const key in sitiosData) {
    if (optionText.includes(sitiosData[key].nombre.toLowerCase())) {
      return sitiosData[key];
    }
  }

  // Generador de fallback dinámico para puntos nuevos agregados
  const [lng, lat] = coordsVal.split(',').map(Number);
  return {
    nombre: selectOption ? selectOption.text : "Punto de interés",
    categoria: "📍 Punto Seleccionado",
    direccion: `Coordenadas: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    descripcion: `Ubicación seleccionada en Berazategui. Coordenadas geográficas: Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}.`,
    imagen: "imagenes/estacion-berazategui.jpg",
    imagenFallback: "",
    imagenAlt: "Punto de interés",
    colectivos: [
      { linea: "Locales", clase: "bus-pill-default", ramales: "Líneas de colectivos de la zona urbana de Berazategui" }
    ],
    paradas: [
      {
        nombre: "Parada cercana",
        ubicacion: "Zona próxima a la ubicación seleccionada",
        lineas: "Líneas comunales",
        coords: [lng, lat]
      }
    ],
    extra: ""
  };
}

// Limpiar marcadores de paradas previas del mapa
function limpiarParadasMapa() {
  paradaMarkers.forEach(marker => marker.remove());
  paradaMarkers = [];
}

// Mostrar marcadores de paradas de colectivo en el mapa
function mostrarParadasEnMapa(paradas) {
  limpiarParadasMapa();
  if (!paradas || !paradas.length) return;

  paradas.forEach(p => {
    const el = document.createElement('div');
    el.className = 'bus-stop-pin';
    el.innerHTML = '🚏';
    el.title = `${p.nombre} (${p.lineas})`;

    const stopPopup = new mapboxgl.Popup({ offset: 15 }).setHTML(`
      <div class="popup-title">🚏 ${p.nombre}</div>
      <div class="popup-address">${p.ubicacion}</div>
      <div class="popup-buses">Líneas: ${p.lineas}</div>
    `);

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat(p.coords)
      .setPopup(stopPopup)
      .addTo(map);

    paradaMarkers.push(marker);
  });
}

// Actualizar la tarjeta de información del sitio seleccionado
function actualizarTarjetaSitio(sitio) {
  poiNombre.innerText = sitio.nombre;
  poiBadge.innerText = sitio.categoria;
  poiDireccion.innerText = `📍 ${sitio.direccion}`;
  poiDescripcion.innerText = sitio.descripcion;

  // Carga de imagen con fallback seguro
  poiImage.src = sitio.imagen;
  poiImage.alt = sitio.imagenAlt || sitio.nombre;
  poiImage.onerror = () => {
    if (sitio.imagenFallback && poiImage.src !== sitio.imagenFallback) {
      poiImage.src = sitio.imagenFallback;
    }
  };

  // Pastillas de colectivos
  poiColectivosPills.innerHTML = sitio.colectivos.map(c => 
    `<span class="bus-pill ${c.clase || 'bus-pill-default'}">Línea ${c.linea}</span>`
  ).join('');

  // Lista de paradas de colectivos cercanas
  poiParadasList.innerHTML = sitio.paradas.map(p => 
    `<li><strong>${p.nombre}:</strong> ${p.ubicacion} <span style="color:#0284c7; font-weight:600;">(Líneas ${p.lineas})</span></li>`
  ).join('');

  // Lista de ramales y destinos
  poiRamalesList.innerHTML = sitio.colectivos.map(c => 
    `<li><strong>Línea ${c.linea}:</strong> ${c.ramales}</li>`
  ).join('');

  // Información extra (trenes, deportes, hitos)
  if (sitio.extra) {
    poiExtraInfo.innerHTML = sitio.extra;
    poiExtraInfo.style.display = 'block';
  } else {
    poiExtraInfo.style.display = 'none';
  }

  // Mostrar tarjeta
  poiCard.style.display = 'block';

  // En computadora, indicar que se seleccionó un sitio para activar la vista en 2 columnas
  const cardContainer = document.querySelector('.card-container');
  if (cardContainer) {
    cardContainer.classList.add('has-poi');
  }

  // Recalcular tamaño del mapa si la grilla se expande
  setTimeout(() => {
    map.resize();
  }, 100);
}

// Selección de destino
selectElem.addEventListener('change', (e) => {
  // Si había una navegación GPS previa activa, la detenemos
  if (watchId) detenerNavegacion();

  const [lng, lat] = e.target.value.split(',').map(Number);
  destinoCoords = [lng, lat];

  // Obtener datos del sitio seleccionado
  const sitio = obtenerInfoSitio(e.target.value, e.target.options[e.target.selectedIndex]);

  // Actualizar la interfaz con los datos, foto y colectivos
  actualizarTarjetaSitio(sitio);

  // Mover el mapa hacia el destino
  map.flyTo({ center: destinoCoords, zoom: 15, essential: true });

  // Crear o mover el marcador del destino con Popup informativo
  const popupHtml = `
    <div class="popup-title">${sitio.nombre}</div>
    <div class="popup-address">📍 ${sitio.direccion}</div>
    <div class="popup-buses">🚌 Líneas: ${sitio.colectivos.map(c => c.linea).join(', ')}</div>
  `;
  const mainPopup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupHtml);

  if (destinoMarker) {
    destinoMarker.setLngLat(destinoCoords).setPopup(mainPopup);
  } else {
    destinoMarker = new mapboxgl.Marker({ color: '#e74c3c' })
      .setLngLat(destinoCoords)
      .setPopup(mainPopup)
      .addTo(map);
  }
  destinoMarker.togglePopup();

  // Mostrar los marcadores de paradas cercanas en el mapa
  mostrarParadasEnMapa(sitio.paradas);

  btnStart.disabled = false;
  statusBar.style.color = '#666';
  statusBar.innerText = "Listo para iniciar recorrido";
});

// Trazado de ruta con Mapbox Directions API
async function obtenerRuta(origen, destino) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origen[0]},${origen[1]};${destino[0]},${destino[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!data.routes || !data.routes.length) return;

    const route = data.routes[0];
    const routeCoords = route.geometry.coordinates;
    const geojson = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: routeCoords } };

    if (map.getSource('route')) {
      map.getSource('route').setData(geojson);
    } else {
      map.addLayer({
        id: 'route',
        type: 'line',
        source: { type: 'geojson', data: geojson },
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#007bc7', 'line-width': 5 }
      });
    }

    // Cálculo y formato de distancia y tiempo estimado
    const distanciaKm = (route.distance / 1000).toFixed(1);
    const duracionMin = Math.round(route.duration / 60);

    // Actualizar la notificación en página
    if (toastDistance && toastTime) {
      toastDistance.innerText = `${distanciaKm} km`;
      toastTime.innerText = duracionMin < 60 ? `${duracionMin} min` : `${Math.floor(duracionMin / 60)}h ${duracionMin % 60}m`;
      if (toastDetail) {
        toastDetail.innerText = `🚗 Ruta óptima trazada • Tráfico moderado`;
      }
    }

    statusBar.innerText = `En viaje: ${distanciaKm} km (~${duracionMin} min)`;
  } catch (err) {
    console.error("Error al trazar ruta:", err);
  }
}

// Función central para cancelar/limpiar la navegación activa
function detenerNavegacion() {
  // 1. Detener rastreo GPS en tiempo real
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  // 2. Quitar trazado de la ruta si existe en el mapa
  if (map.getLayer('route')) {
    map.removeLayer('route');
  }
  if (map.getSource('route')) {
    map.removeSource('route');
  }

  // 3. Quitar el marcador del usuario
  userMarker.remove();

  // 4. Ocultar notificación de ruta en página
  if (routeToast) {
    routeToast.style.display = 'none';
  }

  // 5. Resetear visibilidad de botones e interfaz
  btnStart.style.display = 'block';
  btnStart.disabled = false;
  btnCancel.style.display = 'none';
  selectElem.disabled = false;
  statusBar.innerText = "Recorrido cancelado";
}

// Iniciar recorrido GPS
btnStart.addEventListener('click', () => {
  if (!destinoCoords) return;

  const selectedSitio = obtenerInfoSitio(selectElem.value, selectElem.options[selectElem.selectedIndex]);

  // Mostrar notificación en pantalla inmediatamente
  if (routeToast) {
    toastTitle.innerText = `Destino: ${selectedSitio.nombre}`;
    toastTime.innerText = "Calculando...";
    toastDistance.innerText = "Calculando...";
    toastDetail.innerText = "🛰️ Conectando GPS y calculando ruta...";
    routeToast.style.display = 'flex';
  }

  statusBar.innerText = "Obteniendo ubicación GPS...";

  // Ocultar botón "Ir", bloquear selector y mostrar botón "Cancelar"
  btnStart.style.display = 'none';
  btnCancel.style.display = 'block';
  selectElem.disabled = true;

  if (!navigator.geolocation) {
    // Si el navegador no soporta GPS, calcular con punto de referencia céntrico
    const centroBerazategui = [-58.2128, -34.7635];
    userMarker.setLngLat(centroBerazategui).addTo(map);
    map.flyTo({ center: centroBerazategui, zoom: 15 });
    obtenerRuta(centroBerazategui, destinoCoords);
    toastDetail.innerText = "📍 Ruta referencial desde el centro de Berazategui";
    statusBar.innerText = "Navegación referencial activa";
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const userPos = [pos.coords.longitude, pos.coords.latitude];
      userMarker.setLngLat(userPos).addTo(map);
      map.flyTo({ center: userPos, zoom: 15 });
      obtenerRuta(userPos, destinoCoords);
      statusBar.innerText = "Navegación en vivo activa";
    },
    (err) => {
      console.warn("GPS no disponible:", err);
      // Fallback amigable: trazar ruta referencial para que no se tranque en computadoras sin chip GPS
      const refPos = [-58.2128, -34.7635];
      userMarker.setLngLat(refPos).addTo(map);
      map.flyTo({ center: refPos, zoom: 14 });
      obtenerRuta(refPos, destinoCoords);
      if (toastDetail) {
        toastDetail.innerText = "📍 Sin señal GPS directa. Ruta estimada desde Berazategui.";
      }
      statusBar.innerText = "Ruta estimada (GPS no disponible)";
    },
    { enableHighAccuracy: true, timeout: 6000 }
  );
});

// Evento al presionar el botón de cancelar
btnCancel.addEventListener('click', detenerNavegacion);

// Cerrar notificación al presionar la 'x'
if (toastClose) {
  toastClose.addEventListener('click', () => {
    routeToast.style.display = 'none';
  });
}

// Redimensionar el mapa automáticamente ante cambios de pantalla (responsive)
window.addEventListener('resize', () => {
  map.resize();
});
