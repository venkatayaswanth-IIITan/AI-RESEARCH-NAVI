/**
 * AI RESEARCH NAVIGATOR - 3D LITERATURE CONSTELLATION
 * Hardware-accelerated WebGL 3D Visualization of Research Papers using Three.js
 */

(function () {
  'use strict';

  // Cluster Color Palette
  const CLUSTER_COLORS = {
    'Architecture & Attention': 0xf59e0b,       // Warm Gold / Amber
    'Retrieval & Grounding': 0x10b981,          // Emerald Sage
    'Language Models & Scaling': 0x8b5cf6,      // Deep Violet
    'Alignment & Safety': 0xec4899,             // Rose Fuchsia
    'Reasoning & Agents': 0x38bdf8,             // Sky Cyan
    'Mixture of Experts & Efficiency': 0xf97316, // Solar Orange
    'General AI & NLP': 0xc9c3b5               // Aged Parchment
  };

  class GalaxyUniverse3D {
    constructor() {
      this.container = document.getElementById('canvas-container');
      this.canvas = document.getElementById('galaxy-canvas');
      this.hoverCard = document.getElementById('node-hover-card');

      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.controls = null;

      this.paperNodes = [];
      this.nodeMeshes = [];
      this.edgeLines = [];
      this.starField = null;
      this.centralArmillary = null;
      this.activeBeams = [];

      this.currentLayout = 'galaxy';
      this.activeFilter = 'all';
      this.searchQuery = '';
      this.isAutoOrbiting = true;
      this.hoveredNode = null;
      this.selectedNode = null;

      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2(-999, -999);

      this.cameraTargetPos = null;
      this.controlsTargetPos = null;

      this.init();
    }

    init() {
      if (typeof THREE === 'undefined') {
        console.warn('Three.js not loaded. Using 2D fallback.');
        this.initFallback2D();
        return;
      }

      this.setupScene();
      this.setupLights();
      this.setupCentralCore();
      this.setupStarfield();
      this.loadPapers();
      this.setupEventListeners();
      this.animate();
    }

    setupScene() {
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || (window.innerHeight - 68);

      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.FogExp2(0x07080c, 0.0018);

      this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 2000);
      this.camera.position.set(0, 180, 420);

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // OrbitControls
      if (typeof THREE.OrbitControls !== 'undefined') {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxDistance = 800;
        this.controls.minDistance = 60;
        this.controls.autoRotate = this.isAutoOrbiting;
        this.controls.autoRotateSpeed = 0.45;
      }
    }

    setupLights() {
      const ambientLight = new THREE.AmbientLight(0xfff5e6, 0.65);
      this.scene.add(ambientLight);

      const centerLight = new THREE.PointLight(0xe2a153, 2.2, 700);
      centerLight.position.set(0, 0, 0);
      this.scene.add(centerLight);

      const blueRimLight = new THREE.PointLight(0x38bdf8, 1.2, 900);
      blueRimLight.position.set(-300, 200, 300);
      this.scene.add(blueRimLight);
    }

    setupCentralCore() {
      const coreGroup = new THREE.Group();

      // Pulsing Central Geodesic Sphere
      const geom = new THREE.IcosahedronGeometry(12, 2);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xe2a153,
        emissive: 0x946428,
        wireframe: true,
        transparent: true,
        opacity: 0.8
      });
      const coreMesh = new THREE.Mesh(geom, mat);
      coreGroup.add(coreMesh);

      // Armillary Rings
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xf5b96b,
        transparent: true,
        opacity: 0.35
      });

      const ring1 = new THREE.Mesh(new THREE.TorusGeometry(24, 0.4, 16, 64), ringMat);
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(32, 0.4, 16, 64), ringMat);
      ring2.rotation.x = Math.PI / 3;
      const ring3 = new THREE.Mesh(new THREE.TorusGeometry(40, 0.4, 16, 64), ringMat);
      ring3.rotation.y = Math.PI / 4;

      coreGroup.add(ring1);
      coreGroup.add(ring2);
      coreGroup.add(ring3);

      this.centralArmillary = coreGroup;
      this.scene.add(coreGroup);
    }

    setupStarfield() {
      const starCount = 1800;
      const geom = new THREE.BufferGeometry();
      const positions = new Float32Array(starCount * 3);
      const colors = new Float32Array(starCount * 3);

      const colorAmber = new THREE.Color(0xf5b96b);
      const colorEmerald = new THREE.Color(0x2fb986);
      const colorWhite = new THREE.Color(0xf6f3eb);

      for (let i = 0; i < starCount; i++) {
        const radius = 500 + Math.random() * 900;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);

        const tint = Math.random();
        const chosen = tint > 0.6 ? colorAmber : (tint > 0.3 ? colorWhite : colorEmerald);
        colors[i * 3] = chosen.r;
        colors[i * 3 + 1] = chosen.g;
        colors[i * 3 + 2] = chosen.b;
      }

      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const mat = new THREE.PointsMaterial({
        size: 2.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.75
      });

      this.starField = new THREE.Points(geom, mat);
      this.scene.add(this.starField);
    }

    loadPapers() {
      const papers = window.RESEARCH_PAPERS || [];
      if (!papers.length) return;

      this.paperNodes = papers.map((doc, idx) => {
        const cluster = doc.cluster || 'General AI & NLP';
        const colorHex = CLUSTER_COLORS[cluster] || 0xc9c3b5;
        const isFoundational = !!doc.is_foundational;

        // Base 3D Sphere geometry
        const radius = isFoundational ? 5.5 : 3.8;
        const geom = new THREE.SphereGeometry(radius, 24, 24);

        const mat = new THREE.MeshStandardMaterial({
          color: colorHex,
          emissive: colorHex,
          emissiveIntensity: isFoundational ? 0.65 : 0.4,
          roughness: 0.3,
          metalness: 0.7
        });

        const mesh = new THREE.Mesh(geom, mat);
        mesh.userData = {
          doc: doc,
          originalRadius: radius,
          originalColor: colorHex,
          isFoundational: isFoundational,
          currentPos: new THREE.Vector3(),
          targetPos: new THREE.Vector3()
        };

        // Foundational paper orbit halo
        if (isFoundational) {
          const haloGeom = new THREE.RingGeometry(radius * 1.5, radius * 1.7, 32);
          const haloMat = new THREE.MeshBasicMaterial({
            color: colorHex,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.45
          });
          const haloMesh = new THREE.Mesh(haloGeom, haloMat);
          haloMesh.rotation.x = Math.PI / 2;
          mesh.add(haloMesh);
        }

        this.scene.add(mesh);
        this.nodeMeshes.push(mesh);

        return mesh.userData;
      });

      this.calculatePositions();
      this.buildConstellationEdges();
    }

    calculatePositions() {
      const total = this.paperNodes.length;

      // Group papers by cluster
      const clusters = {};
      this.paperNodes.forEach((node, i) => {
        const c = node.doc.cluster;
        if (!clusters[c]) clusters[c] = [];
        clusters[c].push(i);
      });

      const clusterKeys = Object.keys(clusters);
      const clusterCenters = {};
      const numClusters = clusterKeys.length;

      clusterKeys.forEach((key, idx) => {
        const angle = (idx / numClusters) * Math.PI * 2;
        const dist = 140 + (idx % 2) * 40;
        clusterCenters[key] = new THREE.Vector3(
          Math.cos(angle) * dist,
          (idx % 2 === 0 ? 30 : -30) + (Math.random() - 0.5) * 20,
          Math.sin(angle) * dist
        );
      });

      this.paperNodes.forEach((node, idx) => {
        const doc = node.doc;
        const mesh = this.nodeMeshes[idx];

        // 1. GALAXY LAYOUT (Organic Clusters)
        const center = clusterCenters[doc.cluster] || new THREE.Vector3(0, 0, 0);
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI * 0.8;
        const spread = 25 + Math.random() * 45;

        const galaxyPos = new THREE.Vector3(
          center.x + Math.cos(theta) * Math.cos(phi) * spread,
          center.y + Math.sin(phi) * spread,
          center.z + Math.sin(theta) * Math.cos(phi) * spread
        );

        // 2. TEMPORAL SPIRAL LAYOUT (Ascending by publication year 2017 -> 2025)
        const year = doc.year || 2020;
        const yearOffset = (year - 2017) / (2025 - 2017); // 0 to 1
        const spiralHeight = (yearOffset - 0.5) * 280;
        const spiralAngle = yearOffset * Math.PI * 8 + (idx * 0.4);
        const spiralRadius = 80 + Math.sin(yearOffset * Math.PI) * 70;

        const spiralPos = new THREE.Vector3(
          Math.cos(spiralAngle) * spiralRadius,
          spiralHeight,
          Math.sin(spiralAngle) * spiralRadius
        );

        // 3. SEMANTIC SPHERE LAYOUT (Fibonacci Sphere Distribution)
        const phiSphere = Math.acos(1 - 2 * (idx + 0.5) / total);
        const thetaSphere = Math.PI * (1 + 5 ** 0.5) * idx;
        const sphereRadius = 180;

        const spherePos = new THREE.Vector3(
          sphereRadius * Math.sin(phiSphere) * Math.cos(thetaSphere),
          sphereRadius * Math.cos(phiSphere),
          sphereRadius * Math.sin(phiSphere) * Math.sin(thetaSphere)
        );

        node.positions = {
          galaxy: galaxyPos,
          spiral: spiralPos,
          sphere: spherePos
        };

        const target = node.positions[this.currentLayout];
        mesh.position.copy(target);
        node.currentPos.copy(target);
        node.targetPos.copy(target);
      });
    }

    buildConstellationEdges() {
      // Remove existing lines
      this.edgeLines.forEach(line => this.scene.remove(line));
      this.edgeLines = [];

      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xe2a153,
        transparent: true,
        opacity: 0.14,
        blending: THREE.AdditiveBlending
      });

      // Connect papers within the same cluster or with shared tags
      const total = this.paperNodes.length;
      for (let i = 0; i < total; i++) {
        for (let j = i + 1; j < total; j++) {
          const docA = this.paperNodes[i].doc;
          const docB = this.paperNodes[j].doc;

          const sameCluster = docA.cluster === docB.cluster;
          const sharedTags = (docA.tags || []).filter(t => (docB.tags || []).includes(t));

          if ((sameCluster && Math.random() < 0.28) || sharedTags.length >= 2) {
            const geom = new THREE.BufferGeometry().setFromPoints([
              this.nodeMeshes[i].position,
              this.nodeMeshes[j].position
            ]);
            const line = new THREE.Line(geom, lineMaterial);
            line.userData = { nodeA: i, nodeB: j };
            this.scene.add(line);
            this.edgeLines.push(line);
          }
        }
      }
    }

    switchLayout(layoutName) {
      if (!['galaxy', 'spiral', 'sphere'].includes(layoutName)) return;
      this.currentLayout = layoutName;

      this.paperNodes.forEach((node, idx) => {
        const target = node.positions[layoutName];
        node.targetPos.copy(target);
      });

      // Update button states
      document.querySelectorAll('.btn-layout-mode').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-layout') === layoutName);
      });
    }

    filterCluster(clusterName) {
      this.activeFilter = clusterName;

      this.nodeMeshes.forEach(mesh => {
        const doc = mesh.userData.doc;
        const matches = clusterName === 'all' || doc.cluster === clusterName;

        mesh.visible = matches;
        if (matches) {
          mesh.material.opacity = 1.0;
        }
      });

      // Update lines visibility
      this.edgeLines.forEach(line => {
        const meshA = this.nodeMeshes[line.userData.nodeA];
        const meshB = this.nodeMeshes[line.userData.nodeB];
        line.visible = meshA.visible && meshB.visible;
      });

      // Update pills
      document.querySelectorAll('.cluster-pill').forEach(pill => {
        pill.classList.toggle('active', pill.getAttribute('data-cluster') === clusterName);
      });
    }

    setSearchFilter(query) {
      this.searchQuery = (query || '').toLowerCase().trim();

      this.nodeMeshes.forEach(mesh => {
        const doc = mesh.userData.doc;
        if (!this.searchQuery) {
          mesh.visible = this.activeFilter === 'all' || doc.cluster === this.activeFilter;
          mesh.material.emissiveIntensity = mesh.userData.isFoundational ? 0.65 : 0.4;
          mesh.scale.set(1, 1, 1);
          return;
        }

        const title = (doc.title || '').toLowerCase();
        const authors = (doc.authors || []).join(' ').toLowerCase();
        const tags = (doc.tags || []).join(' ').toLowerCase();
        const matches = title.includes(this.searchQuery) || authors.includes(this.searchQuery) || tags.includes(this.searchQuery);

        mesh.visible = matches;
        if (matches) {
          mesh.material.emissiveIntensity = 1.0;
          mesh.scale.set(1.4, 1.4, 1.4);
        }
      });
    }

    flyToNode(nodeMesh) {
      if (!nodeMesh) return;
      const targetPos = nodeMesh.position.clone();

      // Camera offset
      const offset = new THREE.Vector3(0, 20, 60);
      this.cameraTargetPos = targetPos.clone().add(offset);
      this.controlsTargetPos = targetPos.clone();

      if (this.controls) {
        this.controls.autoRotate = false;
      }
    }

    resetCamera() {
      this.cameraTargetPos = new THREE.Vector3(0, 180, 420);
      this.controlsTargetPos = new THREE.Vector3(0, 0, 0);
      if (this.controls) {
        this.controls.autoRotate = this.isAutoOrbiting;
      }
    }

    /**
     * Shoots 3D glowing particle beams from central query point to cited paper nodes
     */
    triggerQueryBeam(paperIds) {
      if (!paperIds || !paperIds.length) return;

      const origin = new THREE.Vector3(0, 0, 0);

      paperIds.forEach(id => {
        const targetMesh = this.nodeMeshes.find(m => m.userData.doc.doc_id === id);
        if (!targetMesh) return;

        // Create beam line
        const points = [origin, targetMesh.position];
        const geom = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({
          color: 0x2fb986,
          linewidth: 3,
          transparent: true,
          opacity: 1.0,
          blending: THREE.AdditiveBlending
        });

        const beamLine = new THREE.Line(geom, mat);
        this.scene.add(beamLine);

        // Flash target node
        const origIntensity = targetMesh.material.emissiveIntensity;
        targetMesh.material.emissiveIntensity = 1.8;
        targetMesh.scale.set(1.8, 1.8, 1.8);

        this.activeBeams.push({
          mesh: beamLine,
          targetMesh: targetMesh,
          origIntensity: origIntensity,
          startTime: performance.now(),
          duration: 2200
        });
      });
    }

    setupEventListeners() {
      window.addEventListener('resize', () => this.onWindowResize());

      this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
      this.canvas.addEventListener('click', (e) => this.onClick(e));

      // Layout Switch Buttons
      document.querySelectorAll('.btn-layout-mode').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const layout = e.currentTarget.getAttribute('data-layout');
          this.switchLayout(layout);
        });
      });

      // Cluster Filter Pills
      document.querySelectorAll('.cluster-pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
          const cluster = e.currentTarget.getAttribute('data-cluster');
          this.filterCluster(cluster);
        });
      });

      // Quick Search
      const searchInput = document.getElementById('galaxy-quick-search');
      const clearSearchBtn = document.getElementById('btn-clear-galaxy-search');

      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const val = e.target.value;
          this.setSearchFilter(val);
          if (clearSearchBtn) clearSearchBtn.style.display = val ? 'block' : 'none';
        });
      }

      if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
          if (searchInput) {
            searchInput.value = '';
            this.setSearchFilter('');
            clearSearchBtn.style.display = 'none';
          }
        });
      }

      // Camera Controls
      const resetBtn = document.getElementById('btn-reset-camera');
      if (resetBtn) resetBtn.addEventListener('click', () => this.resetCamera());

      const orbitBtn = document.getElementById('btn-toggle-orbit');
      if (orbitBtn) {
        orbitBtn.addEventListener('click', () => {
          this.isAutoOrbiting = !this.isAutoOrbiting;
          if (this.controls) this.controls.autoRotate = this.isAutoOrbiting;
          orbitBtn.textContent = this.isAutoOrbiting ? '⏸ Orbit' : '▶ Orbit';
        });
      }

      const focusQueryBtn = document.getElementById('btn-focus-query');
      if (focusQueryBtn) {
        focusQueryBtn.addEventListener('click', () => {
          const studioNav = document.querySelector('.nav-pill[data-view="studio-view"]');
          if (studioNav) studioNav.click();
        });
      }

      // Node Hover Card Actions
      const inspectBtn = document.getElementById('btn-inspect-hover-node');
      if (inspectBtn) {
        inspectBtn.addEventListener('click', () => {
          if (this.selectedNode && window.App) {
            window.App.inspectDocument(this.selectedNode.doc);
          }
        });
      }

      const bookmarkBtn = document.getElementById('btn-bookmark-hover-node');
      if (bookmarkBtn) {
        bookmarkBtn.addEventListener('click', () => {
          if (this.selectedNode && window.App) {
            window.App.toggleBookmark(this.selectedNode.doc);
          }
        });
      }
    }

    onMouseMove(e) {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Raycast to find hovered node
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const visibleMeshes = this.nodeMeshes.filter(m => m.visible);
      const intersects = this.raycaster.intersectObjects(visibleMeshes);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        if (this.hoveredNode !== hitMesh) {
          this.unhighlightNode(this.hoveredNode);
          this.highlightNode(hitMesh, e.clientX, e.clientY);
        }
      } else {
        if (this.hoveredNode) {
          this.unhighlightNode(this.hoveredNode);
        }
      }
    }

    onClick(e) {
      if (this.hoveredNode) {
        this.selectedNode = this.hoveredNode.userData;
        this.flyToNode(this.hoveredNode);

        // Sound chime if enabled
        if (window.App && window.App.playChime) {
          window.App.playChime(640);
        }
      }
    }

    highlightNode(mesh, screenX, screenY) {
      this.hoveredNode = mesh;
      const data = mesh.userData;

      // Scale up mesh
      mesh.scale.set(1.5, 1.5, 1.5);
      mesh.material.emissiveIntensity = 1.2;

      // Show HUD Hover Card
      if (this.hoverCard) {
        document.getElementById('hover-card-cluster').textContent = data.doc.cluster || 'General AI';
        document.getElementById('hover-card-year').textContent = data.doc.year || '2020';
        document.getElementById('hover-card-title').textContent = data.doc.title || 'Untitled';
        document.getElementById('hover-card-authors').textContent = (data.doc.authors || []).slice(0, 3).join(', ') + (data.doc.authors?.length > 3 ? ' et al.' : '');

        const tagsContainer = document.getElementById('hover-card-tags');
        if (tagsContainer) {
          tagsContainer.innerHTML = (data.doc.tags || []).slice(0, 4)
            .map(t => `<span class="mini-tag">${t}</span>`).join('');
        }

        this.hoverCard.style.display = 'block';
        this.hoverCard.style.left = `${screenX}px`;
        this.hoverCard.style.top = `${screenY}px`;
      }

      this.canvas.style.cursor = 'pointer';
    }

    unhighlightNode(mesh) {
      if (!mesh) return;
      mesh.scale.set(1, 1, 1);
      mesh.material.emissiveIntensity = mesh.userData.isFoundational ? 0.65 : 0.4;
      this.hoveredNode = null;

      if (this.hoverCard) {
        this.hoverCard.style.display = 'none';
      }
      this.canvas.style.cursor = 'default';
    }

    onWindowResize() {
      if (!this.camera || !this.renderer) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight || (window.innerHeight - 68);

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }

    animate() {
      requestAnimationFrame(() => this.animate());

      const now = performance.now();

      // Smooth Camera Fly-to Lerp
      if (this.cameraTargetPos) {
        this.camera.position.lerp(this.cameraTargetPos, 0.05);
        if (this.camera.position.distanceTo(this.cameraTargetPos) < 1.0) {
          this.cameraTargetPos = null;
        }
      }

      if (this.controlsTargetPos && this.controls) {
        this.controls.target.lerp(this.controlsTargetPos, 0.05);
        if (this.controls.target.distanceTo(this.controlsTargetPos) < 0.5) {
          this.controlsTargetPos = null;
        }
      }

      if (this.controls) {
        this.controls.update();
      }

      // Rotate Central Core & Stars
      if (this.centralArmillary) {
        this.centralArmillary.rotation.y += 0.003;
        this.centralArmillary.rotation.x += 0.001;
      }

      if (this.starField) {
        this.starField.rotation.y += 0.0003;
      }

      // Smooth Layout Transition of Paper Nodes
      let needsEdgeUpdate = false;
      this.paperNodes.forEach((node, idx) => {
        const mesh = this.nodeMeshes[idx];
        if (mesh.position.distanceTo(node.targetPos) > 0.1) {
          mesh.position.lerp(node.targetPos, 0.06);
          needsEdgeUpdate = true;
        }
      });

      // Update Constellation Lines dynamically during layout transition
      if (needsEdgeUpdate && this.edgeLines.length) {
        this.edgeLines.forEach(line => {
          const pA = this.nodeMeshes[line.userData.nodeA].position;
          const pB = this.nodeMeshes[line.userData.nodeB].position;
          const posAttr = line.geometry.attributes.position;
          posAttr.setXYZ(0, pA.x, pA.y, pA.z);
          posAttr.setXYZ(1, pB.x, pB.y, pB.z);
          posAttr.needsUpdate = true;
        });
      }

      // Process 3D Active Query Beams
      if (this.activeBeams.length) {
        for (let i = this.activeBeams.length - 1; i >= 0; i--) {
          const beam = this.activeBeams[i];
          const elapsed = now - beam.startTime;
          const progress = elapsed / beam.duration;

          if (progress >= 1.0) {
            this.scene.remove(beam.mesh);
            beam.targetMesh.material.emissiveIntensity = beam.origIntensity;
            beam.targetMesh.scale.set(1, 1, 1);
            this.activeBeams.splice(i, 1);
          } else {
            // Pulse opacity
            beam.mesh.material.opacity = Math.sin(progress * Math.PI) * 1.0;
          }
        }
      }

      this.renderer.render(this.scene, this.camera);
    }

    /**
     * Fallback 2D Canvas if WebGL or Three.js is unavailable
     */
    initFallback2D() {
      const ctx = this.canvas.getContext('2d');
      const papers = window.RESEARCH_PAPERS || [];
      const render = () => {
        ctx.fillStyle = '#090a0d';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = '#e2a153';
        ctx.font = '16px serif';
        ctx.fillText('Interactive 3D Constellation (Rendering mode)', 40, 60);

        papers.forEach((p, i) => {
          const angle = (i / papers.length) * Math.PI * 2 + performance.now() * 0.0002;
          const r = 160 + (i % 3) * 40;
          const x = this.canvas.width / 2 + Math.cos(angle) * r;
          const y = this.canvas.height / 2 + Math.sin(angle) * r;

          ctx.beginPath();
          ctx.arc(x, y, p.is_foundational ? 6 : 4, 0, Math.PI * 2);
          ctx.fillStyle = '#f5b96b';
          ctx.fill();
        });
        requestAnimationFrame(render);
      };
      render();
    }
  }

  // Export globally
  window.GalaxyUniverse3D = GalaxyUniverse3D;
})();
