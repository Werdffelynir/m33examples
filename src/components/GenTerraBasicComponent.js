import {ReaComponent} from "m33/ReaComponent.js";
import {EventBus} from "m33/EventBus.js";
import {Ut} from "m33/Ut.js";
import {loadScene, loadTexture} from "m33/web3d/Ut3D.js";
import {perlin} from "m33/utils/perlin.js";

import * as THREE from "three";
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {SimplexNoise} from 'three/addons/math/SimplexNoise.js';
import {ImprovedNoise} from 'three/addons/math/ImprovedNoise.js';
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {FBXLoader} from "three/addons/loaders/FBXLoader.js";
import {HDRLoader} from "three/addons/loaders/HDRLoader.js";


const CSS = `
@layer page {

    @scope(#GenTerraBasicComponent) {
        
    }

}
`;

const HTML = `
div.absolute.top: ""
`;

export class GenTerraBasicComponent extends ReaComponent {

    create() {
        this.bus = new EventBus()
        this.children = new Map()

        super.create({
            template: HTML,
            css: CSS,
            state: {

            },
            parent: this.register.rootScreenElement,
        });

    }

    onMount () {
        if (!this.renderer) {
            this.renderer = this.createRender()

            this.root.appendChild(this.renderer.domElement);
        }

    }

    onUnmount () {
        if (this.renderer?.domElement)
            this.renderer?.domElement.remove()
    }

    createRender () {
		let scene = new THREE.Scene();
		let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 1000);

		camera.position.set(0, 10, 30);

		let renderer = new THREE.WebGLRenderer({antialias: false});

		renderer.setSize(innerWidth, innerHeight);
		renderer.setClearColor(0x404040);

        let controls = new OrbitControls(camera, renderer.domElement);
        controls.addEventListener('change', (e) => {
            renderer.render(scene, camera);
        })


        const lightHem = new THREE.HemisphereLight('#f1e9fc', '#000000', 2)
        lightHem.position.set(0,2,0)
        scene.add(lightHem)

        const lightDir = new THREE.DirectionalLight('#b691e9', 4)
        lightDir.position.set(5, 5, -8)
        scene.add(lightDir)


        // scene.add(new THREE.GridHelper(10))

        const terran = this.createTerran()

		scene.add(terran)

		renderer.render(scene, camera);
		return renderer;
    }





    createTerran (scale = 1) {
        const g = new THREE.PlaneGeometry(10, 10, 24, 24)
        const m = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#36732d'),
            side: THREE.DoubleSide,
            wireframe: true
        })
        const mesh = new THREE.Mesh(g, m)
        mesh.position.set(0, 0, 0)


        for (var i = 0; i < g.attributes.position.count; i++) {
            const x = g.attributes.position.getX(i)
            const y = g.attributes.position.getY(i)
            const z = g.attributes.position.getZ(i)

            const height = Math.sin(x *  1.20) * Math.cos(y * 1.25) * 0.1;
            g.attributes.position.setZ(i, height)
        }
        g.attributes.position.needsUpdate = true;
        g.computeVertexNormals();

        g.rotateX(-(Math.PI / 2));

        mesh.scale.set(scale, scale, scale)

        return mesh
    }





    createTerran2 (scale = 1) {
        const geometry = new THREE.PlaneGeometry(10, 10, 64, 64)
        // geometry.rotateX(-(Math.PI / 2));

        const material = new THREE.MeshStandardMaterial({
            wireframe : true,
            vertexColors : false,
            color : new THREE.Color('#2cca15'),
        })

        // const simplexNoise = new SimplexNoise()
        // const improvedNoise = new ImprovedNoise()
        // perlin.randomSeed();

        const positions = geometry.attributes.position
        const muHeight = 0.15
        const muX = 1
        const muY = 1

        //  VERSION 2. depricated USE positions.getX and positions.setXYZ
        for (var i = 0; i < positions.array.length; i += 3) {
            const x = positions.array[i];
            const y = positions.array[i + 1];
            const z = positions.array[i + 2];

            const noiseValue = Math.sin(x *  1.20) * Math.cos(y * 1.25) * 1.1;
            // const noiseValue = perlin.get(x, y);
            // const noiseValue = simplexNoise.noise( x, y ) 
            // const noiseValue = improvedNoise.noise( x, y, z ) 

            positions.array[i + 2] = noiseValue > 0 
                ? noiseValue * muHeight * 2 
                : noiseValue * muHeight; 
        }

        positions.needsUpdate = true;
        geometry.computeVertexNormals();

        const mesh = new THREE.Mesh(geometry, material)
        mesh.receiveShadow = true


        mesh.scale.set(scale,scale,scale)
        mesh.rotateX( -(Math.PI/2) )

        return mesh
    }





    createTerranCannion (scale = 1) {
        const geometry = new THREE.PlaneGeometry(10, 10, 64, 64);
        const threshold = 0.5;
        const positions = geometry.attributes.position.array;

        // perlin.setSeed('Ut.random(10, 9999)')
        // perlin.randomSeed();

        const simplexNoise = new SimplexNoise()
        const improvedNoise = new ImprovedNoise()

        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];

            const noiseValue = improvedNoise.noise(x * 0.7, y * 0.7, 0);

            positions[i + 2] = noiseValue > threshold ? noiseValue * 1.2 : noiseValue * 0.2;
        }

        geometry.computeVertexNormals();

        const material = new THREE.MeshBasicMaterial({ color: 0x008800, side: THREE.DoubleSide, wireframe: true });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.scale.set( scale, scale, scale )
        mesh.translateY( -1 )
        mesh.rotateX( -(Math.PI/2) )

        return mesh
    }





}

