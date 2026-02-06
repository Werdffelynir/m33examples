import {ReaComponent} from "engine/ReaComponent.js";
import {EventBus} from "engine/EventBus.js";
import {Ut} from "engine/Ut.js";
import {loadScene, loadTexture} from "engine/web3d/Ut3D.js";
import {Temporary} from "engine/utils/Temporary.js";

import * as THREE from "three";
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {ImprovedNoise} from 'three/addons/math/ImprovedNoise.js';
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {FBXLoader} from "three/addons/loaders/FBXLoader.js";
import {HDRLoader} from "three/addons/loaders/HDRLoader.js";

import {SPControl} from "../modules/SPControl.js";

const CSS = `
@layer page {

    @scope(#DirectionDistanceComponent) {
        
    }

}
`;

const HTML = `
div.absolute.top: ""
`;

export class DirectionDistanceComponent extends ReaComponent {

    create() {
        this.bus = new EventBus()
        this.children = new Map()

        super.create({
            template: HTML,
            css: CSS,
            state: {
            	player: true,
            	firstPerson: false,
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
		let renderer = new THREE.WebGLRenderer({antialias: false});

		renderer.setSize(innerWidth, innerHeight);
		renderer.setClearColor(0x404040);

		this.scene = scene
		this.camera = camera
		this.renderer = renderer


		camera.position.set(0, 10, 20);


        const lightHem = new THREE.HemisphereLight('#f1e9fc', '#000000', 2)
        lightHem.position.set(0,5,0)
        scene.add(lightHem)

        // const lightDir = new THREE.DirectionalLight('#b691e9', 4)
        // lightDir.position.set(3, 5, 8)
        // scene.add(lightDir)

        scene.add(new THREE.GridHelper(10, 2, 0xf1e9fc, 0xf1e9fc))



		this.setGameController()

		// renderer.setAnimationLoop( _ => {
		// 	renderer.render(scene, camera);
		// })

		function createCompas( count, color){
			let group = new THREE.Group()
		}
		function createPlane( step = 1, color = 0xcd10bc){
			let geo = new THREE.PlaneGeometry(step, step, 25, 25)
			let mat = new THREE.MeshBasicMaterial({color: color});
			let mesh = new THREE.Mesh(geo, mat);
			return mesh;
		}

		const wallTexture = (type = "wall") => {
			const canvas = document.createElement('canvas');
			canvas.width = 512;
			canvas.height = 512;
			const ctx = canvas.getContext('2d');

			// create wall bricks pattern 
			const fillBricks = () => {
				const p = document.createElement('canvas')
				p.width = p.height = 32
				const pctx = p.getContext('2d')
				pctx.fillStyle = '#222'
				pctx.fillRect(0,0,32,32)
				pctx.fillStyle = '#333'
				pctx.fillRect(0,2,20,12)
				pctx.fillRect(24,2,8,12)
				pctx.fillRect(0,18,6,12)
				pctx.fillRect(12,18,20,12)
				const pattern = ctx.createPattern(p, 'repeat')
				ctx.fillStyle = pattern
				ctx.fillRect(0,0,canvas.width,canvas.height)
			}
			const fillRoof = () => {
				const p = document.createElement('canvas')
				p.width = p.height = 32
				const pctx = p.getContext('2d')
				pctx.fillStyle = '#555'
				pctx.fillRect(0,0,32,32)

				pctx.fillStyle = '#444'
				pctx.fillRect(10, 0, 6, 32)
				const pattern = ctx.createPattern(p, 'repeat')
				ctx.fillStyle = pattern
				ctx.fillRect(0,0,canvas.width,canvas.height)
			}
			const drawDoor = () => {
				ctx.fillStyle = '#707070'
				ctx.fillRect(206, 212, 100, 300)
				ctx.fillStyle = '#afafaf'
				ctx.arc(230, 352, 6, Math.PI * 2, 0)
				ctx.fill()
			}

			switch (type) {
				case "roof":
					fillRoof()
					break;
				case "wall":
					fillBricks()
					break;
				case "door":
					fillBricks()
					drawDoor()
					break;
			}

			const texture = new THREE.CanvasTexture(canvas);
			texture.colorSpace = THREE.SRGBColorSpace;
			texture.needsUpdate = true;

			const textureMaterial = new THREE.MeshBasicMaterial({ map: texture });
			return textureMaterial
		}

		function createBuild(){
			const cache = Temporary.get ('build_texture')

			if (cache) {
				const loader = new THREE.ObjectLoader();
				let _cube = loader.parse(cache)
				_cube.material.forEach(m => m.needsUpdate = true)	

				return _cube;
			}

			const materials = [
			    wallTexture('wall'), // Right
			    wallTexture('wall'), // Left
			    wallTexture('roof'), // Top
			    wallTexture('none'), // Bottom
			    wallTexture('door'), // Front (Your canvas texture here)
			    wallTexture('wall')  // Back
			];

			const geometry = new THREE.BoxGeometry(10, 5, 10);
			const cube = new THREE.Mesh(geometry, materials);
			cube.name = "build"

			Temporary.set ('build_texture', cube.toJSON())

			// mat.color.set(color); 
			// mat.color.setHex(color, THREE.SRGBColorSpace)
			// mat.needsUpdate = true;
			// mesh.material.color.set(0xff0000);
			return cube;
		}


		const worldGrid = Array.from({ length: 10 }, (_, y) => {
			return Array.from({ length: 10 }, (_, x)  =>  new THREE.Vector2(x, y))
		});

		const buildBox3 = []
	    const cubeOrigin = createBuild()

		for (var i = 0; i < 10; i++) {

	    	const cube = cubeOrigin.clone()

			cube.position.set(Ut.random(-40, 40, true), 2.5, Ut.random(-40, 40, true))
			cube.rotateY( Ut.random(1,4,true) * Math.PI / 2 )

			const box3 = (new THREE.Box3()).setFromObject(cube);
			let intersects = false;

			for (var ib = 0; ib < buildBox3.length; ib++) {
			    if (box3.intersectsBox(buildBox3[ib])) {
					intersects = true;
				}
			}


			if (intersects) continue;

			buildBox3.push(box3)
			scene.add(cube);
		}

		renderer.render(scene, camera);
		return renderer;
    }


    setGameController () {
    	const camera = this.camera
    	const scene = this.scene
    	const renderer = this.renderer


		if (!this.state.firstPerson) {

			const controls = new OrbitControls(camera, renderer.domElement);

			controls.addEventListener('change', (e) => {
				renderer.render(scene, camera);
			})

			// controls.listenToKeyEvents(window); 			
			// controls.enableKeys = true;
			// controls.keyPanSpeed = 100.0;
			// controls.keys = {
			//     LEFT: "KeyA",
			//     UP: "KeyW",
			//     RIGHT: "KeyD",
			//     DOWN: "KeyS"
			// };
			// controls.screenSpacePanning = false;  
			// controls.target = camera.position.clone().add(new THREE.Vector3(0, 0,-5))
			
			controls.update();
		}


        if (this.state.player) {

			const keyman = this.register.inputs.keyboardManager

			const control = new SPControl({
				renderer: renderer,
				scene: scene,
				camera: camera,
				inputs: this.register.inputs.keyboardManager.keys,
				moveSpeed: 1.5,
				turnSpeed: 1.2,
				enabledMouse: true,
			})

			scene.add(control.player)

			if (this.state.firstPerson) {
				// First Person View. In constructor need set enabledMouse = true
				camera.position.set(0,1.5,2)
				control.player.getObjectByName("face").add(camera)
			}

			this.register.onUpdate((dt, i) => {
			    // if (box3.intersectsBox(buildBox3[ib])) {
				// 	intersects = true;
				// }

				control.update(dt)

				renderer.render(scene, camera);
			})

			keyman.onKeyJust("KeyV", () => {
				this.register.looper.togglePause()
				console.log("played: ", this.register.looper.played)
			})
			keyman.onKeyJust("KeyL", () => {
				console.log("Flashlight: ", control.player.enableFlashlight())
			})
			keyman.onKeyJust("KeyM", () => {
				console.log("Mark: ", control.player.enableMark())
			})
        }


    }
}



