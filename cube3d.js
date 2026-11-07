/**
 * 3D-конструктор кубиков.
 *
 * Надстройка над логической моделью CubeBuilder (слоты, цвета, проверка).
 * Здесь — только визуализация Three.js + «клик и перетаскивание по полке»:
 *  - слоты отрисованы как полупрозрачные рамки на «полке»;
 *  - кубик из палитры ложится в первый подходящий слот;
 *  - размещённый кубик можно перетаскивать по полке мышью (raycasting):
 *    на сбросе он встаёт в ближайший слот, если тот принимает его цвет,
 *    иначе возвращается на место; короткий клик показывает подсказку.
 *
 * Если Three.js недоступен — приложение рисует обычный 2D-конструктор.
 */

const Cube3DEngine = {
  canvas: null,
  renderer: null,
  scene: null,
  camera: null,
  group: null,
  raycaster: null,
  pointer: null,
  slotMeshes: [],      // {slotId, x, accept, line, label}
  cubeMeshes: {},      // slotId -> mesh
  drag: null,          // состояние перетаскивания
  rafId: 0,
  observer: null,

  CUBE_H: 1.35,
  CUBE_D: 1.35,
  SLOT_SPACING: 2.15,

  /** Создаёт/возвращает движок и вешает его на переданный контейнер. */
  ensure: function (stage) {
    if (this.renderer && this.canvas && this.canvas.parentElement !== stage) {
      // перевешиваем существующую сцену в новый контейнер
      stage.appendChild(this.canvas);
      this.resize();
      if (this.renderer) this.renderer.render(this.scene, this.camera);
      return;
    }
    if (this.renderer) { this.resize(); return; }

    this.canvas = document.createElement("canvas");
    stage.appendChild(this.canvas);
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.display = "block";
    this.pointer = this.pointer || new THREE.Vector2();

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.setRenderSize();

    this.scene = new THREE.Scene();
    this.scene.background = null; // прозрачный — работает стеклянный фон панели

    var aspect = this.aspect();
    this.camera = new THREE.PerspectiveCamera(46, aspect, 0.1, 100);
    this.camera.position.set(0, 3.05, 9.4);
    this.camera.lookAt(0, 0.75, 0);

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.78));
    var key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(4, 7, 6);
    this.scene.add(key);
    var fill = new THREE.DirectionalLight(0xffffff, 0.35);
    fill.position.set(-5, 2, -4);
    this.scene.add(fill);

    // мягкая «поверхность полки»
    var floor = new THREE.Mesh(
      new THREE.CircleGeometry(8.4, 48),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.55;
    this.scene.add(floor);

    this.raycaster = new THREE.Raycaster();
    this.buildSlots();
    this.bindEvents();

    var self = this;
    var loop = function () { self.rafId = requestAnimationFrame(loop); if (self.renderer && self.scene) self.renderer.render(self.scene, self.camera); };
    loop();

    if (window.ResizeObserver) {
      this.observer = new ResizeObserver(function () { self.setRenderSize(); self.fitCamera(); });
      this.observer.observe(this.canvas);
    }
  },

  aspect: function () {
    var w = this.canvas && this.canvas.clientWidth || 600;
    var h = this.canvas && this.canvas.clientHeight || 340;
    return w / h;
  },

  setRenderSize: function () {
    if (!this.renderer || !this.canvas) return;
    var w = Math.max(1, this.canvas.clientWidth || 600);
    var h = Math.max(1, this.canvas.clientHeight || 340);
    this.renderer.setSize(w, h, false);
  },

  fitCamera: function () {
    if (!this.camera) return;
    this.camera.aspect = this.aspect();
    this.camera.updateProjectionMatrix();
    if (this.renderer) this.renderer.render(this.scene, this.camera);
  },

  resize: function () {
    this.setRenderSize();
    this.fitCamera();
  },

  /* ------------------------- Слоты ------------------------------- */

  buildSlots: function () {
    var self = this;
    this.slotMeshes = [];
    BUILDER_SLOTS.forEach(function (s, i) {
      var x = self.slotX(i);
      var accent = COLORS[s.accept[0]].hex;

      var geo = new THREE.BoxGeometry(1.8, 1.5, 1.5);
      var edges = new THREE.EdgesGeometry(geo);
      var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.6 }));
      line.position.set(x, 0.72, 0);
      self.group.add(line);

      var label = Cube3DEngine.makeSprite(s.label, accent);
      label.position.set(x, -0.42, 0);
      self.group.add(label);

      self.slotMeshes.push({ slotId: s.id, x: x, accept: s.accept, line: line, label: label });
    });
  },

  slotX: function (i) {
    var n = BUILDER_SLOTS.length;
    return (i - (n - 1) / 2) * this.SLOT_SPACING;
  },

  slotIndex: function (id) {
    for (var i = 0; i < BUILDER_SLOTS.length; i++) if (BUILDER_SLOTS[i].id === id) return i;
    return -1;
  },

  /* ------------------------- Кубики ------------------------------ */

  syncCubes: function () {
    var self = this;
    // убрать старые
    Object.keys(this.cubeMeshes).forEach(function (k) {
      var m = self.cubeMeshes[k];
      self.group.remove(m);
      self.disposeMesh(m);
      delete self.cubeMeshes[k];
    });
    // пересоздать из модели
    BUILDER_SLOTS.forEach(function (s) {
      var id = CubeBuilder.slots[s.id];
      if (!id) return;
      var cube = getCube(id);
      if (!cube) return;
      var idx = self.slotIndex(s.id);
      var mesh = Cube3DEngine.makeCubeMesh(cube);
      mesh.position.set(self.slotX(idx), 0.72 + 0.001, 0);
      mesh.name = s.id;
      mesh.userData = { slotId: s.id, cubeId: id, color: cube.color };
      self.group.add(mesh);
      self.cubeMeshes[s.id] = mesh;
    });
  },

  makeCubeMesh: function (cube) {
    var text = cube.en || "";
    var w = Math.min(2.35, 1.05 + Math.min(text.length, 26) * 0.052);
    var geometry = new THREE.BoxGeometry(w, Cube3DEngine.CUBE_H, Cube3DEngine.CUBE_D);
    var hex = COLORS[cube.color].hex;
    var fg = cube.color === "yellow" ? "#3D2C00" : "#FFFFFF";
    var tex = Cube3DEngine.makeLabelTexture(text, hex, fg);
    var mat = new THREE.MeshLambertMaterial({ map: tex });
    var mesh = new THREE.Mesh(geometry, [mat, mat, mat, mat, mat, mat]);
    mesh.name = cube.id;
    return mesh;
  },

  /** Текст кубика на текстуре (одна «грань» с надписью, остальные однотонные). */
  makeLabelTexture: function (text, bg, fg) {
    var c = document.createElement("canvas");
    c.width = 256; c.height = 128;
    var ctx = c.getContext("2d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 128);
    // лёгкая рамка
    ctx.strokeStyle = "rgba(255,255,255,.25)";
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, 248, 120);
    ctx.fillStyle = fg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    var fs = Math.max(22, Math.min(54, Math.floor(230 / (text.length || 4) * 4.2)));
    ctx.font = "700 " + fs + "px -apple-system, 'Segoe UI', sans-serif";
    // перенос по словам
    var lines = Cube3DEngine.wrapText(ctx, text, 230);
    var lh = fs * 1.15;
    var startY = 64 - ((lines.length - 1) * lh) / 2;
    lines.forEach(function (ln, i) { ctx.fillText(ln, 128, startY + i * lh); });
    var tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 1;
    return tex;
  },

  wrapText: function (ctx, text, maxWidth) {
    var words = String(text).split(" ");
    var lines = [], cur = "";
    words.forEach(function (w) {
      var test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = w; }
      else cur = test;
    });
    if (cur) lines.push(cur);
    return lines.length ? lines : [""];
  },

  makeSprite: function (text, color) {
    var c = document.createElement("canvas");
    c.width = 512; c.height = 128;
    var ctx = c.getContext("2d");
    ctx.clearRect(0, 0, 512, 128);
    ctx.fillStyle = color;
    ctx.font = "700 54px -apple-system, 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 64);
    var tex = new THREE.CanvasTexture(c);
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sp.scale.set(1.9, 0.5, 1);
    return sp;
  },

  disposeMesh: function (mesh) {
    if (!mesh) return;
    if (mesh.geometry) mesh.geometry.dispose();
    var mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach(function (m) {
      if (!m) return;
      if (m.map) { m.map.dispose(); }
      m.dispose();
    });
  },

  /* ------------------------- Взаимодействие ---------------------- */

  bindEvents: function () {
    var self = this;
    var c = this.renderer.domElement;
    c.addEventListener("pointerdown", function (e) { self.onDown(e); });
    window.addEventListener("pointermove", function (e) { self.onMove(e); });
    window.addEventListener("pointerup", function (e) { self.onUp(e); });
  },

  ndc: function (e) {
    var r = this.canvas.getBoundingClientRect();
    this.pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  },

  onDown: function (e) {
    if (!this.renderer || !this.drag) {
      // попытка взять кубик
      this.ndc(e);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      var meshes = Object.keys(this.cubeMeshes).map(function (k) { return Cube3DEngine.cubeMeshes[k]; });
      var hits = this.raycaster.intersectObjects(meshes, false);
      if (!hits.length) return;
      var mesh = hits[0].object;
      var startX = mesh.position.x;
      this.drag = { slotId: mesh.name, cubeId: mesh.userData.cubeId, mesh: mesh, startX: startX, moved: 0, lifted: mesh.position.y };
      mesh.position.y = mesh.position.y + 0.35;
      mesh.scale.set(1.06, 1.06, 1.06);
      if (this.renderer.domElement.setPointerCapture) this.renderer.domElement.setPointerCapture(e.pointerId);
    }
  },

  onMove: function (e) {
    if (!this.drag || !this.camera) return;
    this.ndc(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    var hit = new THREE.Vector3();
    var ok = this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit);
    if (!ok) return;
    var n = BUILDER_SLOTS.length;
    var half = ((n - 1) / 2) * this.SLOT_SPACING + 1.2;
    var x = Math.max(-half, Math.min(half, hit.x));
    this.drag.mesh.position.x = x;
    this.drag.moved = Math.max(this.drag.moved, Math.abs(x - this.drag.startX));
  },

  onUp: function () {
    if (!this.drag) return;
    var d = this.drag;
    this.drag = null;
    // вернуть высоту/масштаб
    d.mesh.position.y = d.lifted;
    d.mesh.scale.set(1, 1, 1);

    var cube = getCube(d.cubeId);
    if (!cube) { CubeBuilder.render(); return; }

    // короткий клик — подсказка
    if (d.moved < 0.12) {
      CubeBuilder.message = "«" + cube.en + "» — " + cube.ru + (cube.hint ? ". " + cube.hint : "");
      CubeBuilder.tone = "warn";
      CubeBuilder.render();
      return;
    }

    // ближайший слот
    var target = null, bestD = 1.25;
    this.slotMeshes.forEach(function (sm) {
      var dd = Math.abs(sm.x - d.mesh.position.x);
      if (dd < bestD) { bestD = dd; target = sm; }
    });

    if (target && target.accept.indexOf(cube.color) !== -1) {
      CubeBuilder.place(target.slotId, d.cubeId);
    } else if (target) {
      CubeBuilder.place(d.slotId, d.cubeId);
      var slotInfo = null;
      BUILDER_SLOTS.forEach(function (s) { if (s.id === target.slotId) slotInfo = s; });
      CubeBuilder.message = "Кубик «" + cube.en + "» — " + COLORS[cube.color].label +
        ". В слот «" + (slotInfo ? slotInfo.label : target.slotId) + "» нужен " +
        target.accept.map(function (c) { return COLORS[c].label; }).join(" / ") + ".";
      CubeBuilder.tone = "bad";
      CubeBuilder.render();
    } else {
      CubeBuilder.place(d.slotId, d.cubeId);
    }
  }
};

/* --- 3D-режим конструктора (надстройка над CubeBuilder) ------------ */

CubeBuilder.render3D = function () {
  var self = this;
  clear(this.root);

  this.root.appendChild(el("div", { class: "section-head" }, [
    el("h2", { text: "Конструктор кубиков" }),
    el("p", { class: "muted", text: "Соберите предложение из цветных кубиков: красный — кто/что, синий — глагол, зелёный — остальное, чёрный — отрицание, жёлтый — служебные слова. Перетащите кубик по полке, чтобы поменять место." })
  ]));

  this.root.appendChild(this.renderTarget());

  if (this.message) {
    this.root.appendChild(el("div", { class: "builder-message" + (this.tone ? " " + this.tone : ""), text: this.message }));
  }

  var wrap = el("div", { class: "cube3d-wrap" });
  var stage = el("div", { class: "cube3d-stage" });
  wrap.appendChild(stage);
  wrap.appendChild(el("div", { class: "cube3d-hint", text: "🖐 Клик по кубику — подсказка. Зажмите и тяните по полке — кубик встанет в ближайший «свой» слот." }));
  this.root.appendChild(wrap);

  this.root.appendChild(this.renderSentenceLine());
  this.root.appendChild(this.renderPalette());

  if (typeof THREE !== "undefined") {
    Cube3DEngine.ensure(stage);
    Cube3DEngine.syncCubes();
  }
};