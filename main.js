import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';

// AARRR Pyramid Levels
const LEVELS = [
    {
        name: 'Acquisition',
        description: 'User Discovery',
        metrics: { volume: '100,000', rate: '100%' },
        channels: ['SEO', 'SEM', 'Social', 'PR']
    },
    {
        name: 'Activation', 
        description: 'First Experience',
        metrics: { volume: '5,000', rate: '5%' },
        channels: ['Onboarding', 'Tutorial', 'Welcome']
    },
    {
        name: 'Retention',
        description: 'Continued Usage',
        metrics: { volume: '2,000', rate: '40%' },
        channels: ['Email', 'Push', 'In-App']
    },
    {
        name: 'Referral',
        description: 'User Advocacy',
        metrics: { volume: '400', rate: '20%' },
        channels: ['Program', 'Social', 'Reviews']
    },
    {
        name: 'Revenue',
        description: 'Monetization',
        metrics: { volume: '120', rate: '30%' },
        channels: ['Subscription', 'Purchase', 'Upsell']
    }
];

class GlassPyramid {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.pyramidGroup = new THREE.Group();
        this.levels = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectedLevel = null;
        this.autoRotate = true;
        this.currentView = 'pyramid';
        this.glassMaterial = null;

        this.init();
    }

    init() {
        this.setupRenderer();
        this.setupCamera();
        this.setupLights();
        this.createGlassMaterial();
        this.createPyramid();
        this.createFloor();
        this.setupControls();
        this.setupEventListeners();
        this.animate();
    }

    setupRenderer() {
        const container = document.getElementById('canvas-container');
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        container.appendChild(this.renderer.domElement);
    }

    setupCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
        this.camera.position.set(8, 6, 8);
        this.camera.lookAt(0, 2, 0);
    }

    setupLights() {
        // Subtle ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);

        // Key light
        const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
        keyLight.position.set(5, 10, 5);
        keyLight.castShadow = true;
        keyLight.shadow.camera.near = 0.1;
        keyLight.shadow.camera.far = 50;
        keyLight.shadow.camera.left = -10;
        keyLight.shadow.camera.right = 10;
        keyLight.shadow.camera.top = 10;
        keyLight.shadow.camera.bottom = -10;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        this.scene.add(keyLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);

        // Rim light for glass edges
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
        rimLight.position.set(0, 10, -10);
        this.scene.add(rimLight);
    }

    createGlassMaterial() {
        this.glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0,
            roughness: 0,
            transmission: 0.95,
            transparent: true,
            opacity: 0.2,
            reflectivity: 0.9,
            refractionRatio: 0.98,
            ior: 1.5,
            clearcoat: 1,
            clearcoatRoughness: 0,
            side: THREE.DoubleSide,
            envMapIntensity: 1
        });
    }

    createPyramid() {
        const totalHeight = 6;
        const baseSize = 4;
        const levelHeight = totalHeight / LEVELS.length;

        LEVELS.forEach((level, index) => {
            const topRatio = (LEVELS.length - index - 1) / LEVELS.length;
            const bottomRatio = (LEVELS.length - index) / LEVELS.length;
            
            const topSize = baseSize * topRatio;
            const bottomSize = baseSize * bottomRatio;
            
            // Create trapezoid geometry for each level
            const geometry = new THREE.CylinderGeometry(
                topSize, 
                bottomSize, 
                levelHeight, 
                4, 
                1, 
                false
            );
            geometry.rotateY(Math.PI / 4); // Rotate to align corners

            // Create glass mesh
            const mesh = new THREE.Mesh(geometry, this.glassMaterial.clone());
            mesh.position.y = (totalHeight / 2) - (index * levelHeight) - (levelHeight / 2);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData = { level, index };

            // Add wireframe overlay for definition
            const wireframeGeometry = new THREE.EdgesGeometry(geometry);
            const wireframeMaterial = new THREE.LineBasicMaterial({ 
                color: 0xffffff,
                transparent: true,
                opacity: 0.1,
                linewidth: 1
            });
            const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
            mesh.add(wireframe);

            // Add level indicator
            this.createLevelIndicator(level, index, mesh);

            this.levels.push(mesh);
            this.pyramidGroup.add(mesh);
        });

        this.scene.add(this.pyramidGroup);
    }

    createLevelIndicator(level, index, parent) {
        // Create a subtle text sprite for each level
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;

        context.fillStyle = 'rgba(255, 255, 255, 0.6)';
        context.font = '300 40px Helvetica Neue';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(`0${index + 1}`, 60, 64);
        context.font = '100 32px Helvetica Neue';
        context.fillText(level.name.toUpperCase(), 280, 64);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            opacity: 0.5
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(2, 0.5, 1);
        sprite.position.set(2.5, 0, 0);
        parent.add(sprite);
    }

    createFloor() {
        // Reflective floor
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floorMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x000000,
            metalness: 0.8,
            roughness: 0.2,
            transparent: true,
            opacity: 0.8,
            reflectivity: 1
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.5;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Grid
        const gridHelper = new THREE.GridHelper(20, 20, 0x222222, 0x111111);
        gridHelper.position.y = -0.49;
        this.scene.add(gridHelper);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.autoRotate = this.autoRotate;
        this.controls.autoRotateSpeed = 0.5;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 20;
        this.controls.maxPolarAngle = Math.PI * 0.48;
    }

    setupEventListeners() {
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('click', (e) => this.onMouseClick(e));
        window.addEventListener('resize', () => this.onWindowResize());

        document.getElementById('rotate-toggle').addEventListener('click', () => {
            this.autoRotate = !this.autoRotate;
            this.controls.autoRotate = this.autoRotate;
        });

        document.getElementById('reset-view').addEventListener('click', () => {
            this.resetView();
        });

        document.querySelectorAll('.view-options button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.changeView(e.target.dataset.view);
            });
        });
    }

    onMouseMove(event) {
        const container = document.getElementById('canvas-container');
        const rect = container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.checkIntersections();
    }

    onMouseClick(event) {
        if (this.selectedLevel) {
            this.focusOnLevel(this.selectedLevel);
        }
    }

    checkIntersections() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.levels);

        // Reset all levels
        this.levels.forEach(level => {
            gsap.to(level.material, { 
                opacity: 0.2,
                emissive: 0x000000,
                emissiveIntensity: 0,
                duration: 0.3 
            });
        });

        if (intersects.length > 0) {
            this.selectedLevel = intersects[0].object;
            
            // Highlight selected level
            gsap.to(this.selectedLevel.material, { 
                opacity: 0.4,
                emissive: 0xffffff,
                emissiveIntensity: 0.1,
                duration: 0.3 
            });

            this.updateInfoPanel(this.selectedLevel.userData.level, this.selectedLevel.userData.index);
            document.body.style.cursor = 'pointer';
        } else {
            this.selectedLevel = null;
            document.body.style.cursor = 'default';
            this.updateInfoPanel(null);
        }
    }

    updateInfoPanel(level, index) {
        const titleEl = document.getElementById('stage-title');
        const descEl = document.getElementById('stage-description');
        const metricsEl = document.getElementById('stage-metrics');
        const stageNumber = document.querySelector('.stage-number');

        if (level) {
            titleEl.textContent = level.name;
            descEl.textContent = level.description;
            
            if (stageNumber) {
                stageNumber.textContent = `0${index + 1}`;
            } else {
                const numberEl = document.createElement('div');
                numberEl.className = 'stage-number';
                numberEl.textContent = `0${index + 1}`;
                document.getElementById('controls').appendChild(numberEl);
            }
            
            metricsEl.innerHTML = `
                <div class="metric">
                    <div class="metric-label">Volume</div>
                    <div class="metric-value">${level.metrics.volume}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Conversion Rate</div>
                    <div class="metric-value">${level.metrics.rate}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Channels</div>
                    <div class="channels-list">
                        ${level.channels.map(channel => 
                            `<span class="channel-tag">${channel}</span>`
                        ).join('')}
                    </div>
                </div>
            `;
        } else {
            titleEl.textContent = 'Select Level';
            descEl.textContent = '';
            metricsEl.innerHTML = '';
            const stageNumber = document.querySelector('.stage-number');
            if (stageNumber) stageNumber.remove();
        }
    }

    focusOnLevel(level) {
        const index = level.userData.index;
        const yPos = level.position.y;
        
        const targetPosition = new THREE.Vector3(6, yPos + 3, 6);
        const targetLookAt = new THREE.Vector3(0, yPos, 0);

        gsap.to(this.camera.position, {
            x: targetPosition.x,
            y: targetPosition.y,
            z: targetPosition.z,
            duration: 1.5,
            ease: "power2.inOut"
        });

        gsap.to(this.controls.target, {
            x: targetLookAt.x,
            y: targetLookAt.y,
            z: targetLookAt.z,
            duration: 1.5,
            ease: "power2.inOut",
            onUpdate: () => {
                this.controls.update();
            }
        });
    }

    changeView(viewType) {
        this.currentView = viewType;
        
        switch(viewType) {
            case 'pyramid':
                this.showPyramidView();
                break;
            case 'exploded':
                this.showExplodedView();
                break;
            case 'flow':
                this.showFlowView();
                break;
        }
    }

    showPyramidView() {
        const totalHeight = 6;
        const levelHeight = totalHeight / LEVELS.length;

        this.levels.forEach((level, index) => {
            gsap.to(level.position, {
                y: (totalHeight / 2) - (index * levelHeight) - (levelHeight / 2),
                x: 0,
                z: 0,
                duration: 1.5,
                ease: "power2.inOut"
            });
            gsap.to(level.rotation, {
                x: 0,
                y: Math.PI / 4,
                z: 0,
                duration: 1.5,
                ease: "power2.inOut"
            });
        });
    }

    showExplodedView() {
        const spacing = 2;
        this.levels.forEach((level, index) => {
            gsap.to(level.position, {
                y: index * -spacing + 4,
                x: 0,
                z: 0,
                duration: 1.5,
                ease: "power2.inOut"
            });
        });
    }

    showFlowView() {
        this.levels.forEach((level, index) => {
            const angle = (index / this.levels.length) * Math.PI * 2;
            const radius = 5;
            gsap.to(level.position, {
                x: Math.cos(angle) * radius,
                y: 2,
                z: Math.sin(angle) * radius,
                duration: 1.5,
                ease: "power2.inOut"
            });
            gsap.to(level.rotation, {
                y: -angle + Math.PI / 2 + Math.PI / 4,
                duration: 1.5,
                ease: "power2.inOut"
            });
        });
    }

    resetView() {
        gsap.to(this.camera.position, {
            x: 8,
            y: 6,
            z: 8,
            duration: 1.5,
            ease: "power2.inOut"
        });
        gsap.to(this.controls.target, {
            x: 0,
            y: 2,
            z: 0,
            duration: 1.5,
            ease: "power2.inOut",
            onUpdate: () => {
                this.controls.update();
            }
        });
        this.showPyramidView();
    }

    onWindowResize() {
        const container = document.getElementById('canvas-container');
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize
const pyramid = new GlassPyramid();