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

    @scope(#TerranQuadsComponent) {
        
    }

}
`;

const HTML = `
div.absolute.top: ""
`;

export class GenTerranQuadsComponent extends ReaComponent {

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
            this.createRender()
        }

    }

    onUnmount () {
        if (this.renderer?.domElement)
            this.renderer?.domElement.remove()
    }

    createRender () {

		THREE.BufferGeometry.prototype.toQuads = ToQuads;

		let scene = new THREE.Scene();
		let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 1000);

		camera.position.set(0, 8, 13);

		let renderer = new THREE.WebGLRenderer({antialias: true});
		renderer.setSize(innerWidth, innerHeight);
		renderer.setClearColor(0x404040);

		this.root.appendChild(renderer.domElement);

		const perlin = new ImprovedNoise();

		let controls = new OrbitControls(camera, renderer.domElement);

		controls.addEventListener('change', (e) => {
			renderer.render(scene, camera);
		})
		// renderer.setAnimationLoop( _ => { renderer.render(scene, camera); })


		let step = 20;
		for(let z = -4; z <= 4; z ++){
			for(let x = -4; x <= 4; x++){
				let p = createPlane(step, Math.random() * 0x7f7f7f + 0x7f7f7f);
				setNoise(p.geometry, new THREE.Vector2(x, z), 2, 3);
				p.geometry.rotateX(Math.PI * 0.5);
				p.position.set(x, 0, z).multiplyScalar(step);
				scene.add(p);
			}
		}

		function createPlane( step, color){
			let g = new THREE.PlaneGeometry(step, step, 25, 25).toQuads();
			let m = new THREE.LineBasicMaterial({color: color});
			let l = new THREE.LineSegments(g, m);
			return l;
		}

		function setNoise(g, uvShift, multiplier, amplitude){
			let pos = g.attributes.position;
			let uv = g.attributes.uv;
			let vec2 = new THREE.Vector2();
			for(let i = 0; i < pos.count; i++){
				vec2.fromBufferAttribute(uv, i).add(uvShift).multiplyScalar(multiplier);
				pos.setZ(i, perlin.noise(vec2.x, vec2.y, 0) * amplitude );
			}
		}


		function ToQuads() {
			let g = this;
			let p = g.parameters;
			let segmentsX = (g.type == "TorusBufferGeometry" ? p.tubularSegments : p.radialSegments) || p.widthSegments || p.thetaSegments || (p.points.length - 1) || 1;
			let segmentsY = (g.type == "TorusBufferGeometry" ? p.radialSegments : p.tubularSegments) || p.heightSegments || p.phiSegments || p.segments || 1;
			let indices = [];
			for (let i = 0; i < segmentsY + 1; i++) {
				let index11 = 0;
				let index12 = 0;
				for (let j = 0; j < segmentsX; j++) {
					index11 = (segmentsX + 1) * i + j;
					index12 = index11 + 1;
					let index21 = index11;
					let index22 = index11 + (segmentsX + 1);
					indices.push(index11, index12);
					if (index22 < ((segmentsX + 1) * (segmentsY + 1) - 1)) {
						indices.push(index21, index22);
					}
				}
				if ((index12 + segmentsX + 1) <= ((segmentsX + 1) * (segmentsY + 1) - 1)) {
				indices.push(index12, index12 + segmentsX + 1);
				}
			}
			g.setIndex(indices);
			return g;
		}

		this.renderer = renderer;

    }


}



