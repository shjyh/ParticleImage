
import * as THREE from 'three';
import gsap from 'gsap';
import PoissonDiskSampling from 'poisson-disk-sampling';

// Import shaders
import noiseSource from './shaders/noise.glsl?raw';
import simFragSource from './shaders/sim.frag.glsl?raw';
import renderVertSource from './shaders/render.vert.glsl?raw';
import renderFragSource from './shaders/render.frag.glsl?raw';

// Import worker
import ParticleWorker from './worker.js?worker&inline';

class LRUCache {
    constructor(limit = 10, onDispose = null) {
        this.limit = limit;
        this.onDispose = onDispose;
        this.cache = new Map();
    }

    get(key) {
        if (!this.cache.has(key)) return null;
        const val = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, val);
        return val;
    }

    set(key, val) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.limit) {
            const firstKey = this.cache.keys().next().value;
            const obsolete = this.cache.get(firstKey);
            if (this.onDispose) this.onDispose(obsolete);
            this.cache.delete(firstKey);
        }
        this.cache.set(key, val);
    }

    clear() {
        if (this.onDispose) {
            for (let val of this.cache.values()) {
                this.onDispose(val);
            }
        }
        this.cache.clear();
    }
}

class ParticleManager {
    constructor(parent) {
        this.parent = parent;
        this.renderer = parent.renderer;
        this.camera = parent.camera;
        this.lastTime = 0;
        this.everRendered = false;

        this.size = 256;
        this.length = this.size * this.size;

        this.colorScheme = parent.theme === "dark" ? 0 : 1;
        this.particleScale = this.renderer.domElement.width / parent.pixelRatio / 2000 * parent.particlesScale;

        this.initBase();
    }

    initBase() {
        const linearMap = (x, a, b, c, d) => (x - a) * (d - c) / (b - a) + c;
        let pds = new PoissonDiskSampling({
            shape: [500, 500],
            minDistance: linearMap(this.parent.density, 0, 300, 10, 2),
            maxDistance: linearMap(this.parent.density, 0, 300, 11, 3),
            tries: 20
        });
        this.pointsBaseData = pds.fill();
        this.pointsData = [];
        for (let i = 0; i < this.pointsBaseData.length; i++) {
            this.pointsData.push(this.pointsBaseData[i][0] - 250, this.pointsBaseData[i][1] - 250);
        }
        this.count = this.pointsData.length / 2;

        // Initial textures
        this.posTex = this.createDataTexturePosition(this.pointsData);
        // Default nearest points (scattered)
        this.posNearestTex = this.createDataTexturePosition(this.pointsData);
        // Default color (transparent/black)
        this.colorNearestTex = this.createDataTextureColor(new Float32Array(this.length * 4));

        this.rt1 = this.createRenderTarget();
        this.rt2 = this.createRenderTarget();

        this.simScene = new THREE.Scene();
        this.simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        this.simMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uPosition: { value: this.posTex },
                uPosRefs: { value: this.posTex },
                uPosNearest: { value: this.posNearestTex },
                uMousePos: { value: new THREE.Vector2(0, 0) },
                uTime: { value: 0 },
                uDeltaTime: { value: 0 },
                uProgress: { value: 0 },
                uSize: { value: this.size }
            },
            vertexShader: `
                void main() {
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: simFragSource
        });

        const simMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.simMaterial);
        this.simScene.add(simMesh);

        // Render Geometry
        const geo = new THREE.BufferGeometry();
        const posArray = new Float32Array(this.count * 3);
        const uvArray = new Float32Array(this.count * 2);
        const seedArray = new Float32Array(this.count * 4);

        for (let s = 0; s < this.count; s++) {
            let a = s % this.size, l = Math.floor(s / this.size);
            uvArray[s * 2] = a / this.size;
            uvArray[s * 2 + 1] = l / this.size;

            seedArray[s * 4] = Math.random();
            seedArray[s * 4 + 1] = Math.random();
            seedArray[s * 4 + 2] = Math.random();
            seedArray[s * 4 + 3] = Math.random();
        }

        geo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
        geo.setAttribute("uv", new THREE.BufferAttribute(uvArray, 2));
        geo.setAttribute("seeds", new THREE.BufferAttribute(seedArray, 4));

        this.renderMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uPosition: { value: this.posTex },
                uColorTex: { value: this.colorNearestTex },
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(this.parent.color) },
                uAlpha: { value: 1 },
                uProgress: { value: 0 },
                uPulseProgress: { value: 0 },
                uMousePos: { value: new THREE.Vector2(0, 0) },
                uRez: { value: new THREE.Vector2(this.renderer.domElement.width, this.renderer.domElement.height) },
                uParticleScale: { value: this.particleScale },
                uPixelRatio: { value: this.parent.pixelRatio },
                uColorScheme: { value: this.colorScheme }
            },
            vertexShader: noiseSource + "\n" + renderVertSource,
            fragmentShader: noiseSource + "\n" + renderFragSource,
            transparent: true,
            depthTest: false,
            depthWrite: false
        });

        this.mesh = new THREE.Points(geo, this.renderMaterial);
        this.parent.threeScene.add(this.mesh);

        this.resize();
    }

    createDataTextureColor(data) {
        const array = (data instanceof Float32Array) ? data : new Float32Array(this.length * 4);
        if (!(data instanceof Float32Array)) {
            const count = data.length / 4;
            for (let i = 0; i < count; i++) {
                let idx = i * 4;
                array[idx + 0] = data[idx + 0];
                array[idx + 1] = data[idx + 1];
                array[idx + 2] = data[idx + 2];
                array[idx + 3] = data[idx + 3];
            }
        }
        const tex = new THREE.DataTexture(array, this.size, this.size, THREE.RGBAFormat, THREE.FloatType);
        tex.needsUpdate = true;
        return tex;
    }

    createDataTexturePosition(data) {
        const array = new Float32Array(this.length * 4);
        const count = data.length / 2;
        for (let i = 0; i < count; i++) {
            let idx = i * 4;
            array[idx + 0] = data[i * 2 + 0] * (1 / 250);
            array[idx + 1] = data[i * 2 + 1] * (1 / 250);
            array[idx + 2] = 0;
            array[idx + 3] = 0;
        }
        const tex = new THREE.DataTexture(array, this.size, this.size, THREE.RGBAFormat, THREE.FloatType);
        tex.needsUpdate = true;
        return tex;
    }

    createRenderTarget() {
        return new THREE.WebGLRenderTarget(this.size, this.size, {
            wrapS: THREE.RepeatWrapping,
            wrapT: THREE.RepeatWrapping,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            type: THREE.HalfFloatType,
            depthBuffer: false,
            stencilBuffer: false
        });
    }

    async processImage(imageData) {
        return new Promise((resolve) => {
            const worker = new ParticleWorker();
            worker.onmessage = (e) => {
                worker.terminate();
                const posTex = this.createDataTexturePosition(e.data.nearestPoints);
                const colorTex = this.createDataTextureColor(e.data.nearestColors);
                resolve({ posTex, colorTex });
            };
            worker.postMessage({
                imageData: {
                    data: imageData.data,
                    width: imageData.width,
                    height: imageData.height
                },
                pointsBase: this.pointsBaseData,
                density: this.parent.density
            }, [imageData.data.buffer]);
        });
    }

    update() {
        const time = this.parent.clock.getElapsedTime();
        const deltaTime = time - this.lastTime;
        this.lastTime = time;

        this.simMaterial.uniforms.uPosition.value = this.everRendered ? this.rt1.texture : this.posTex;
        this.simMaterial.uniforms.uTime.value = time;
        this.simMaterial.uniforms.uDeltaTime.value = deltaTime;
        this.simMaterial.uniforms.uProgress.value = this.parent.progress;

        this.renderer.setRenderTarget(this.rt2);
        this.renderer.render(this.simScene, this.simCamera);
        this.renderer.setRenderTarget(null);

        this.renderMaterial.uniforms.uPosition.value = this.rt2.texture;
        this.renderMaterial.uniforms.uTime.value = time;
        this.renderMaterial.uniforms.uProgress.value = this.parent.progress;

        // Swap buffers
        let temp = this.rt1;
        this.rt1 = this.rt2;
        this.rt2 = temp;
        this.everRendered = true;
    }

    resize() {
        this.renderMaterial.uniforms.uRez.value.set(this.renderer.domElement.width, this.renderer.domElement.height);
        this.renderMaterial.uniforms.uPixelRatio.value = this.parent.pixelRatio;

        const fov = this.camera.fov;
        const dist = this.camera.position.z;
        const visibleHeight = 2 * Math.tan((fov * Math.PI / 180) / 2) * dist;
        const visibleWidth = visibleHeight * (this.renderer.domElement.width / this.renderer.domElement.height);
        this.mesh.scale.set(visibleWidth / 2, -visibleHeight / 2, 1);
    }

    destroy() {
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        this.rt1.dispose();
        this.rt2.dispose();
        this.posTex.dispose();
        this.posNearestTex.dispose();
        this.colorNearestTex.dispose();
        this.simMaterial.dispose();
        this.renderMaterial.dispose();
    }
}

export class ParticleImage {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.container = canvas.parentElement;
        this.options = options;

        this.theme = options.theme || "dark";
        this.particlesScale = options.particlesScale || 0.5;
        this.density = options.density || 150;
        this.cameraZoom = options.cameraZoom || 3.5;
        this.color = options.color || (this.theme === "dark" ? "#aecbfa" : "#121212");

        this.pixelRatio = window.devicePixelRatio;
        this.duration = options.duration || 0.6;
        this.progress = 0;
        this.clock = new THREE.Clock();

        // Initialize LRU Cache for processed image textures
        this.lru = new LRUCache(10, (data) => {
            if (data.posTex) data.posTex.dispose();
            if (data.colorTex) data.colorTex.dispose();
        });

        this.initThree();
        this.manager = new ParticleManager(this);

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);

        window.addEventListener('resize', this.onResize.bind(this));
    }

    initThree() {
        this.threeScene = new THREE.Scene();
        this.threeScene.background = new THREE.Color(this.theme === "dark" ? 0x121212 : 0xffffff);

        this.camera = new THREE.PerspectiveCamera(40, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 1000);
        this.camera.position.z = this.cameraZoom;

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setPixelRatio(this.pixelRatio);
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    }

    async getImageData(src) {
        return new Promise((resolve, reject) => {
            let img = new Image();
            img.crossOrigin = "anonymous";

            let url = src;
            let isBlob = false;

            if (src.startsWith('<svg')) {
                const svgBlob = new Blob([src], { type: 'image/svg+xml;charset=utf-8' });
                url = URL.createObjectURL(svgBlob);
                isBlob = true;
            }

            const cleanup = () => {
                if (isBlob) URL.revokeObjectURL(url);
                img.onload = null;
                img.onerror = null;
                img = null;
            };

            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = 500;
                canvas.height = 500;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, 500, 500);

                const data = ctx.getImageData(0, 0, 500, 500);

                // Cleanup canvas internal state and reference
                canvas.width = 0;
                canvas.height = 0;

                resolve(data);
                cleanup();
            };

            img.onerror = (err) => {
                reject(err);
                cleanup();
            };

            img.src = url;
        });
    }

    async render(image) {
        if (!image) return;

        // Check LRU cache first
        const cached = this.lru.get(image);
        let posTex, colorTex;

        if (cached) {
            posTex = cached.posTex;
            colorTex = cached.colorTex;
        } else {
            const imageData = await this.getImageData(image);
            const processed = await this.manager.processImage(imageData);
            posTex = processed.posTex;
            colorTex = processed.colorTex;

            // Save to cache
            this.lru.set(image, { posTex, colorTex });
        }

        this.manager.posNearestTex = posTex;
        this.manager.colorNearestTex = colorTex;
        this.manager.simMaterial.uniforms.uPosNearest.value = posTex;
        this.manager.renderMaterial.uniforms.uColorTex.value = colorTex;

        gsap.to(this, { progress: 1, duration: this.duration, ease: "power3.inOut" });
    }

    scatter() {
        gsap.to(this, { progress: 0, duration: this.duration, ease: "power3.inOut" });
    }

    animate() {
        if (!this.renderer) return;
        this.manager.update();
        this.renderer.render(this.threeScene, this.camera);
        requestAnimationFrame(this.animate);
    }

    onResize() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.manager.resize();
    }

    destroy() {
        window.removeEventListener('resize', this.onResize);
        this.lru.clear();
        this.manager.destroy();
        this.renderer.dispose();
        this.renderer = null;
    }
}
