import {ReaComponent} from "m33/ReaComponent.js";
import {EventBus} from "m33/EventBus.js";
import {Ut} from "m33/Ut.js";
import {loadScene, loadTexture} from "m33/web3d/Ut3D.js";

import * as THREE from "three";
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {ImprovedNoise} from 'three/addons/math/ImprovedNoise.js';
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {FBXLoader} from "three/addons/loaders/FBXLoader.js";
import {HDRLoader} from "three/addons/loaders/HDRLoader.js";


const CSS = `
@layer page {

    @scope(#DefComponent) {
        
    }

}
`;

const HTML = `
div.absolute.top: ""
`;

export class DefComponent extends ReaComponent {

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


        const lightHem = new THREE.HemisphereLight('#f1e9fc', '#000000', 2)
        lightHem.position.set(0,5,0)
        scene.add(lightHem)

        const lightDir = new THREE.DirectionalLight('#b691e9', 4)
        lightDir.position.set(3, 5, 8)
        scene.add(lightDir)


        scene.add(new THREE.GridHelper(10))



		let controls = new OrbitControls(camera, renderer.domElement);
		controls.addEventListener('change', (e) => {
			renderer.render(scene, camera);
		})

		// renderer.setAnimationLoop( _ => {
		// 	renderer.render(scene, camera);
		// })

		function createObjs( count, color){
			let group = new THREE.Group()
		}
		function createPlane( step = 1, color = 0xff00ff){
			let geo = new THREE.PlaneGeometry(step, step, 25, 25)
			let mat = new THREE.MeshBasicMaterial({color: color});
			let mesh = new THREE.Mesh(geo, mat);
			return mesh;
		}
		function createBox( size = 1, color = 0xffffff){
			let geo = new THREE.BoxGeometry(size, size, size)
			let mat =  new THREE.MeshBasicMaterial({color: color});

			// mat.color.set(color); 
			// mat.color.setHex(color, THREE.SRGBColorSpace)
			// mat.needsUpdate = true;

			let mesh = new THREE.Mesh(geo, mat);
			
			// mesh.material.color.set(0xff0000);

			return mesh;
		}

		scene.add(createBox(2))

		renderer.render(scene, camera);
		return renderer;
    }


}



