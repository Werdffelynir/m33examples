import {ReaComponent} from "m33/ReaComponent.js";
import {EventBus} from "m33/EventBus.js";
import {Ut} from "m33/Ut.js";
import {loadScene, loadTexture, canvasTexture} from "m33/web3d/Ut3D.js";

import * as THREE from "three";
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {ImprovedNoise} from 'three/addons/math/ImprovedNoise.js';
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {FBXLoader} from "three/addons/loaders/FBXLoader.js";
import {HDRLoader} from "three/addons/loaders/HDRLoader.js";


const CSS = `
@layer page {

    @scope(#SceneBackgroundCanvasTextureComponent) {
        
    }

}
`;

const HTML = `
div.absolute.top: ""
`;

export class SceneBackgroundCanvasTextureComponent extends ReaComponent {

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

		camera.position.set(0, 8, 13);

		let renderer = new THREE.WebGLRenderer({antialias: false});

		renderer.setSize(innerWidth, innerHeight);
		renderer.setClearColor(0x404040);


		let controls = new OrbitControls(camera, renderer.domElement);

		controls.addEventListener('change', (e) => {
			renderer.render(scene, camera);
		})


		// SKY

        const canvasBgTx = canvasTexture(( /**@type {CanvasRenderingContext2D|null} */ ctx) => {

            const gradient = ctx.createLinearGradient(ctx.canvas.width/2, 0, ctx.canvas.width/2, ctx.canvas.height);

            gradient.addColorStop(0, '#d3cce7');
            gradient.addColorStop(0.5, 'rgb(103, 107, 170)');
            gradient.addColorStop(0.55, '#45487b');
            gradient.addColorStop(0.6, '#21343f');
            gradient.addColorStop(1, '#0d1113');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);


            const sun = ctx.createRadialGradient(300, 300, 60, 300, 300, 25);

            sun.addColorStop(0, 'rgba(255, 255, 255, 0)');
            sun.addColorStop(1, 'rgba(255, 255, 255, 0.85)');

            ctx.fillStyle = sun;
            ctx.fillRect(200, 200, 400, 400);

        }, 2048, 1024)

        canvasBgTx.mapping = THREE.EquirectangularReflectionMapping;

        scene.background = canvasBgTx


        // Already alternative three js addon "Sky"
        // 
		// import { Sky } from 'three/addons/objects/Sky.js';
		//
        // const sky = new Sky();
        // sky.scale.setScalar(10000);
        // scene.add(sky);
        // 
        // sky.material.uniforms.sunPosition.value.set(1000, 100, 1000);
        // sky.material.uniforms.turbidity.mieCoefficient = 0.005
        // sky.material.uniforms.turbidity.mieDirectionalG = 0.8
        // sky.material.uniforms.turbidity.rayleigh = 5
        // sky.material.uniforms.turbidity.value = 2




		function createPlane( size = 10, segments = 1, color = 0xff00ff){
			let geo = new THREE.PlaneGeometry(size, size, segments, segments)
			let mat = new THREE.MeshBasicMaterial({color: color});
			let mesh = new THREE.Mesh(geo, mat);
			return mesh;
		}

		function createBox( sizeX = 1, sizeY = 1, sizeZ = 1, color = 0xffffff){
			let geo = new THREE.BoxGeometry(sizeX, sizeY, sizeZ)
			let mat =  new THREE.MeshBasicMaterial({color: color});

			let mesh = new THREE.Mesh(geo, mat);

			// dynamic changes:
			// 		mat.color.set(color); 
			// 		mat.color.setHex(color, THREE.SRGBColorSpace)

			return mesh;
		}


		const ground = createPlane()
		ground.scale.setScalar(10)
		ground.rotateX(-1.57079)

		scene.add(ground)



		;[
			createBox(2),
			createBox(1,2),
			createBox(1,1,2),

		].forEach((box, i) => {
			box.position.set(i * 5 - 5, box.geometry.parameters.height/2, -3);
	
			scene.add(box)
		})


		renderer.render(scene, camera);

		return renderer;
    }


}



