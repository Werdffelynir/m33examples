import {ReaComponent} from "m33/ReaComponent.js";
import {EventBus} from "m33/EventBus.js";
import {Ut} from "m33/Ut.js";
import {loadScene, loadTexture, canvasTexture} from "m33/web3d/Ut3D.js";
import {Temporary} from "m33/utils/Temporary.js";

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
div.absolute.top
  div.w-200px.h-200px.absolute.top[data-id=comapass]
`;


export const Layers = {
  WORLD:      0, 
  PLAYER:     1, 
  NPC:        2, 
  TRIGGER:    3, 
  INTERACTIVE:4,
  RAMP:       5,
};

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
            	pointerLock: false,
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
		let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 200);
		let renderer = new THREE.WebGLRenderer({antialias: false});

		renderer.setSize(innerWidth, innerHeight);
		// renderer.setClearColor(0x404040);

		this.scene = scene
		this.camera = camera
		this.renderer = renderer


		camera.position.set(5, 3, -5);


        const lightHem = new THREE.HemisphereLight('#999999', '#000000', 0.5)
        lightHem.position.set(0,5,0)
        scene.add(lightHem)


        // const lightDir = new THREE.DirectionalLight('#b691e9', 4)
        // lightDir.position.set(3, 5, 8)
        // scene.add(lightDir)
		// renderer.setAnimationLoop( _ => {
		// 	renderer.render(scene, camera);
		// })

		// Night env

        const darknessColor = 0x000000
        scene.background = darknessColor
        scene.fog = new THREE.FogExp2( darknessColor, 0.018 );


        // scene.add(new THREE.GridHelper(10, 2, 0xf1e9fc, 0xf1e9fc))



		const {camCtrl, spCtrl} = this.setGameController()


		function createPlane( step = 10, color = '#645a3c'){
			let geo = new THREE.PlaneGeometry(step, step, 1, 1)
			let mat = new THREE.MeshStandardMaterial({color: color});
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

		for (var i = 0; i < 5; i++) {

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



		const ground = createPlane()
		ground.rotateX(-1.57079)
		ground.scale.setScalar(10)
		scene.add(ground)

		const comapass = this.createCompass(spCtrl)

		this.register.onUpdate((dt, i) => {
			comapass.update(dt, i)
		    // if (box3.intersectsBox(buildBox3[ib])) {
			// 	intersects = true;
			// }
		})

		renderer.render(scene, camera);
		return renderer;
    }

    createCompass (spCtrl) {
		const WORLD_NORTH = new THREE.Vector3(0, 0, -1);
		const WORLD_EAST  = new THREE.Vector3(1, 0, 0);
		const compScene = new THREE.Scene();
		const compCamera =  new THREE.OrthographicCamera( -1, 1, 1, -1, 0.1, 100 );
		const compRenderer = new THREE.WebGLRenderer({antialias: false});
		compCamera.position.set(0, 0, 1)
		compRenderer.setSize(200, 200);
		compRenderer.setClearColor(0x505050);
		
		this.elements["comapass"].appendChild( compRenderer.domElement );

		const tx = canvasTexture ((ctx)=>{
			ctx.fillStyle = '#ffffff'
			ctx.fillText("N", 100, 20)
			ctx.fillText("S", 100, 180)
			ctx.fillText("E", 180, 100)
			ctx.fillText("W", 20, 100)
		}, 200, 200) 

		// CircleGeometry( 5, 32 ); SphereGeometry( 15, 32, 16 );
		// const geo = new THREE.PlaneGeometry(2, 2, 1, 1)
		const geo = new THREE.CircleGeometry(1, 12)
		const mat = new THREE.MeshStandardMaterial({color: 0xffffff, map: tx});
		tx.needsUpdate = true
		const mesh = new THREE.Mesh(geo, mat)

		mesh.position.set(0, 0, 0)

		compScene.add( new THREE.HemisphereLight('#f1e9fc', '#000000', 2) );
		compScene.add( mesh );
		compRenderer.render(compScene, compCamera);

	    const forward = new THREE.Vector3(0, 0, -1)

	    // v1.angleTo(v2)
		// const dot = forward.dot(WORLD_NORTH);
		// const cross = WORLD_NORTH.cross(forward);
		return {
			update: (dt, i) => {
				if (spCtrl.ismoved) {
					forward.set(0, 0, -1)
					forward.applyQuaternion(spCtrl.player.quaternion).normalize();

					let ang = WORLD_NORTH.angleTo(forward)

					if (forward.cross(WORLD_NORTH).y < 0) ang *= -1

					mesh.rotation.z = ang
				}

				compRenderer.render(compScene, compCamera);
			}
		}
		
    }

    setGameController () {
    	const camera = this.camera
    	const scene = this.scene
    	const renderer = this.renderer

		let camCtrl, spCtrl = null; 

		if (!this.state.firstPerson) {

			camCtrl = new OrbitControls(camera, renderer.domElement);

			camCtrl.addEventListener('change', (e) => {
				renderer.render(scene, camera);
			})

			// camCtrl.listenToKeyEvents(window); 			
			// camCtrl.enableKeys = true;
			// camCtrl.keyPanSpeed = 100.0;
			// camCtrl.keys = {
			//     LEFT: "KeyA",
			//     UP: "KeyW",
			//     RIGHT: "KeyD",
			//     DOWN: "KeyS"
			// };
			// camCtrl.screenSpacePanning = false;  
			// camCtrl.target = camera.position.clone().add(new THREE.Vector3(0, 0,-5))

			camCtrl.update();

		}


        if (this.state.player) {

			const keyman = this.register.inputs.keyboardManager

			spCtrl = new SPControl({
				renderer: renderer,
				scene: scene,
				camera: camera,
				inputs: this.register.inputs.keyboardManager.keys,
				moveSpeed: 1.5,
				turnSpeed: 3,
				enabledMouse: this.state.firstPerson,
				pointerLock: this.state.pointerLock,
			})

			scene.add(spCtrl.player)

			if (this.state.firstPerson) {
				// First Person View. In constructor need set enabledMouse = true
				camera.position.set(0, 1, 0.55)
				spCtrl.player.getObjectByName("face").add(camera)
			}

			this.register.onUpdate((dt, i) => {

				spCtrl.update(dt)

				renderer.render(scene, camera);
			})

			keyman.onKeyJust("KeyV", () => {
				this.register.looper.togglePause()
				console.log("played: ", this.register.looper.played)
			})
			keyman.onKeyJust("KeyL", () => {
				console.log("Flashlight: ", spCtrl.player.enableFlashlight())
			})
			keyman.onKeyJust("KeyM", () => {
				console.log("Mark: ", spCtrl.player.enableMark())
			})
        }

        return {
        	camCtrl, spCtrl
        }
    }
}



