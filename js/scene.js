/* ============================================================
   SCENE.JS — Syncron AI
   Fondo 3D: red de nodos conectados (evoca el circuito-edificio
   del logo). Niebla que funde el horizonte en #03080E y cámara
   que orbita suavemente con el scroll.

   Degradación elegante: si Three.js no cargó o WebGL falla, se
   sale en silencio y queda el fondo CSS de respaldo (.scene-layer).
   ============================================================ */

(function () {
  "use strict";

  var canvas = document.getElementById("scene-canvas");

  // Sin Three.js o sin canvas -> respaldo CSS. Nunca pantalla en blanco.
  if (!canvas || typeof THREE === "undefined") {
    return;
  }

  var COLOR_FONDO = 0x03080e;
  var COLOR_NARANJA = 0xf26722;
  var COLOR_AMARILLO = 0xfdb515;

  var isMobile = window.innerWidth < 900;
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var scene, camera, renderer, group, clock;
  var nodes = [];
  var scrollTarget = 0, scrollCurrent = 0;
  var pointerX = 0, pointerY = 0;
  var running = true;

  try {
    init();
    animate();
  } catch (err) {
    // WebGL no disponible: ocultamos el canvas y dejamos el respaldo CSS.
    canvas.style.display = "none";
    return;
  }

  /* --- Configuración inicial --- */
  function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(COLOR_FONDO, isMobile ? 0.058 : 0.046);

    camera = new THREE.PerspectiveCamera(
      58,
      window.innerWidth / window.innerHeight,
      0.1,
      120
    );
    camera.position.set(0, 0, 20);

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: !isMobile,
      alpha: false,
      powerPreference: "high-performance"
    });
    renderer.setClearColor(COLOR_FONDO, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    group = new THREE.Group();
    scene.add(group);

    buildNetwork();

    clock = new THREE.Clock();

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    if (!isMobile) {
      window.addEventListener("mousemove", onPointer, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisibility);
    onScroll();
  }

  /* --- Construye los nodos y las conexiones --- */
  function buildNetwork() {
    var count = isMobile ? 46 : 92;
    var spreadX = 26, spreadY = 18, spreadZ = 20;
    var positions = [];

    var nodeGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);

    for (var i = 0; i < count; i++) {
      var v = new THREE.Vector3(
        (Math.random() - 0.5) * spreadX,
        (Math.random() - 0.5) * spreadY,
        (Math.random() - 0.5) * spreadZ
      );
      positions.push(v);

      // ~1 de cada 4 nodos es amarillo (acento secundario, con moderación).
      var esAmarillo = Math.random() < 0.26;
      var mat = new THREE.MeshBasicMaterial({
        color: esAmarillo ? COLOR_AMARILLO : COLOR_NARANJA,
        transparent: true,
        opacity: esAmarillo ? 0.95 : 0.8,
        fog: true
      });
      var mesh = new THREE.Mesh(nodeGeo, mat);
      mesh.position.copy(v);
      var escala = 0.6 + Math.random() * 1.1;
      mesh.scale.setScalar(escala);

      nodes.push({
        mesh: mesh,
        baseScale: escala,
        fase: Math.random() * Math.PI * 2,
        pulsa: esAmarillo || Math.random() < 0.4
      });
      group.add(mesh);
    }

    // Conexiones: unimos cada nodo con sus vecinos más cercanos.
    var linePos = [];
    var maxDist = isMobile ? 6.5 : 5.8;
    var maxLinks = 3;

    for (var a = 0; a < positions.length; a++) {
      var enlaces = 0;
      for (var b = a + 1; b < positions.length && enlaces < maxLinks; b++) {
        if (positions[a].distanceTo(positions[b]) < maxDist) {
          linePos.push(
            positions[a].x, positions[a].y, positions[a].z,
            positions[b].x, positions[b].y, positions[b].z
          );
          enlaces++;
        }
      }
    }

    var lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(linePos, 3)
    );
    var lineMat = new THREE.LineBasicMaterial({
      color: COLOR_NARANJA,
      transparent: true,
      opacity: 0.16,
      fog: true
    });
    group.add(new THREE.LineSegments(lineGeo, lineMat));
  }

  /* --- Bucle de animación --- */
  function animate() {
    requestAnimationFrame(animate);
    if (!running) return;

    var t = clock.getElapsedTime();

    // Lerp del scroll para suavizar el movimiento de cámara.
    scrollCurrent += (scrollTarget - scrollCurrent) * 0.05;
    var p = scrollCurrent;

    if (!prefersReduced) {
      // Rotación orgánica continua + deriva por scroll.
      group.rotation.y = t * 0.02 + p * 0.6;
      group.rotation.x = Math.sin(t * 0.15) * 0.04 + p * 0.15;

      // Pulso suave de algunos nodos.
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (!n.pulsa) continue;
        var s = n.baseScale * (1 + Math.sin(t * 1.6 + n.fase) * 0.22);
        n.mesh.scale.setScalar(s);
      }
    }

    // Cámara: orbita en altura con el scroll + parallax de puntero.
    camera.position.x += (pointerX * 2.2 - camera.position.x) * 0.05;
    camera.position.y += (-p * 7 + pointerY * 1.4 - camera.position.y) * 0.05;
    camera.position.z = 20 - p * 6;
    camera.lookAt(0, -p * 1.6, 0);

    renderer.render(scene, camera);
  }

  /* --- Eventos --- */
  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    scrollTarget = max > 0 ? window.scrollY / max : 0;
  }

  function onPointer(e) {
    pointerX = e.clientX / window.innerWidth - 0.5;
    pointerY = -(e.clientY / window.innerHeight - 0.5);
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onVisibility() {
    running = !document.hidden;
    if (running && clock) clock.getDelta();
  }
})();
