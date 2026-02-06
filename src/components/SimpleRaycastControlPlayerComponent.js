import {ReaComponent} from "engine/ReaComponent.js";
import {EventBus} from "engine/EventBus.js";
import {Ut} from "engine/Ut.js";
import {loadScene, loadTexture} from "engine/web3d/Ut3D.js";

import * as THREE from "three";
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {ImprovedNoise} from 'three/addons/math/ImprovedNoise.js';
import {SimplexNoise} from 'three/addons/math/SimplexNoise.js';
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {FBXLoader} from "three/addons/loaders/FBXLoader.js";
import {HDRLoader} from "three/addons/loaders/HDRLoader.js";


const CSS = `
@layer page {

    @scope(#SimpleRaycastControlPlayerComponent) {
        
    }

}
`;

const HTML = `
div.absolute.top: ""
`;

export class SimpleRaycastControlPlayerComponent extends ReaComponent {

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

		this.scene = scene
		this.camera = camera
		this.renderer = renderer

        const lightHem = new THREE.HemisphereLight('#f1e9fc', '#000000', 2)
        lightHem.position.set(0,5,0)
        scene.add(lightHem)

        // const lightDir = new THREE.DirectionalLight('#b691e9', 4)
        // lightDir.position.set(3, 5, 8)
        // scene.add(lightDir)


        // scene.add(new THREE.GridHelper(10))


		// let controls = new OrbitControls(camera, renderer.domElement);
		// controls.addEventListener('change', (e) => {
		// 	renderer.render(scene, camera);
		// })
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

		this.ctrl()
		// scene.add()
		scene.add(createBox(2))

		renderer.render(scene, camera);
		return renderer;
    }



    ctrl () {
        const scene = this.scene
        const camera = this.camera
        const keyboard = this.register.inputs.keyboardManager
        const keymap = this.register.inputs.keyboardManager.keymap
        const player = this.createNPC(0,2,0)
        // const target = this.createNPC(0,1,-2)
        scene.add(player)
        // scene.add(target)

        const terrain = this.createTerranCannion(10)
        scene.add(terrain)
		terrain.updateMatrixWorld(true);

        for (var i = 0; i < 10; i++) {
            scene.add(
                this.createBoxDecor(
                    Ut.random(-50, 50), 0, Ut.random(-100, 100), 5
                )
            )
        }




        player.getObjectByName("face").add( camera );
        camera.position.set(0, 1.0, 10)


        const _forward = new THREE.Vector3()
        const getForward = (target) => {
            _forward.set(0,0,-1)
            return _forward.applyQuaternion(target.quaternion).normalize()
        }


        const getDirection = (fromVec3, toVec3) => toVec3.position.clone().sub(fromVec3.position).normalize()

        const getDirectionLengthSq = (fromVec3, toVec3) => {
            const dir = toVec3.position.clone().sub(fromVec3.position)
            return { 
                lengthSq: dir.lengthSq(),
                direction: dir.normalize(),
            }
        }
        const getDistanceSq = (fromVec3, toVec3) => fromVec3.position.distanceToSquared(toVec3.position)

        const limitDistanceSq = 10 * 10
        const limitRotateSq = Math.PI / 4
        const moveSpeed = 1.55
        const turnSpeed = 0.75
        const flashlight = this.createFlashlight(player)
        flashlight.visible = false

        const spotLightHelper = new THREE.SpotLightHelper( flashlight )
        // scene.add( spotLightHelper )
        
        keyboard.onKeyJust("KeyQ", () => player.setMark() )
        keyboard.onKeyJust("KeyL", () => flashlight.visible = !flashlight.visible )

        const moveDirection = new THREE.Vector3(0, 0, -1)
        const getPlayerDirection = () => {
            moveDirection.set(0, 0, -1)
            moveDirection.applyQuaternion(player.quaternion).normalize()
            moveDirection.y = 0
            return moveDirection
        }


        const raycaster = new THREE.Raycaster()
        const downDir = new THREE.Vector3(0, -1, 0)
        const downOffset = 1
        const checkGround = () => {
        	raycaster.set(player.position, downDir);
        	const hits = raycaster.intersectObject(terrain, false);

			if (hits.length) {
			    player.position.y = hits[0].point.y + downOffset;
			}
        }
        
        // console.log( getDistanceSq(player, target) )
        // console.log( getDirectionLengthSq(player, target) )

        // let groundPosition = 0
        // let onGroud = false
        // let gravity = 0.1
        let speed = moveSpeed

        const dt = 0.016
        let lestTime = 0
		this.renderer.setAnimationLoop( _ => {
			// console.log(dt)
		// })

			if (lestTime <  1 / 60) {
				lestTime += dt
				return;
			}
			lestTime = 0

        // this.theater.loopKeeper.onUpdate(dt => {
            // player.position.addScaledVector(getPlayerDirection(), speed * dt * 8)
            if (
                !keymap.f.pressed &&
                !keymap.r.pressed &&
                !keymap.up.pressed &&
                !keymap.down.pressed &&
                !keymap.right.pressed &&
                !keymap.left.pressed) return;

// console.log(player.position)

            if (keymap.left.pressed) player.rotation.y += turnSpeed * dt
            if (keymap.right.pressed) player.rotation.y -= turnSpeed * dt

            if (speed !== moveSpeed ) speed = moveSpeed
            if (keymap.shift.pressed) speed *= 3
            if (keymap.up.pressed) {
            	player.position.addScaledVector(getPlayerDirection(), speed * dt)
            	checkGround()
            }
            if (keymap.down.pressed) {
				player.position.addScaledVector(getPlayerDirection(), -speed * dt)
				checkGround()
            }

            if (keymap.r.pressed) player.position.y += moveSpeed * dt
            if (keymap.f.pressed) player.position.y -= moveSpeed * dt

            // log(onGroud, player.position.y )

            // if (!onGroud)
            //     player.position.y -= gravity

            // if (onGroud && keymap.up.pressed) {
            //     player.position.y += Math.cos(dt % 180 / Math.PI * 5) * 0.5;
            //     onGroud = false
            // }

            // if (player.position.y < fixedGround) {
            //     player.position.y = fixedGround
            //     onGroud = true
            // }

			this.renderer.render(scene, camera);

        })

    }
    


    createNPC (x=0, y=0, z=0) {
            const g = new THREE.BoxGeometry(0.3, 1.8, 0.2)
            const faceG = new THREE.BoxGeometry(0.5, 0.10, 0.2)
            const m = new THREE.MeshBasicMaterial({color: new THREE.Color('#bbc37c')})
            const mesh = new THREE.Mesh(g, m)
            const faceMesh = new THREE.Mesh(faceG, m)
            const arr = new THREE.ArrowHelper( new THREE.Vector3(0, 0, -1), mesh.position.clone().add(new THREE.Vector3(0,0.5,0)), 5, new THREE.Color('#c733dd'), 0.1, 0.1, 0.25 )
            
            mesh.position.add(new THREE.Vector3(x, y, z))
            mesh.castShadow = true
            mesh.receiveShadow = true

            faceMesh.name = 'face'
            faceMesh.position.y = 0.75
            faceMesh.position.z = -0.35

            mesh.add(faceMesh)
            mesh.add(arr)

            const geometryMark = new THREE.RingGeometry( 1, 1.20, 24 );
            const materialMark = new THREE.MeshBasicMaterial( { color: 0xffff00, side: THREE.DoubleSide } );
            const meshMark = new THREE.Mesh( geometryMark, materialMark );
            
            meshMark.name = 'mark'
            meshMark.rotation.x = -(Math.PI / 2)
            meshMark.visible = false

            mesh.setMark = (on = true) => meshMark.visible = on ?? !meshMark.visible
            mesh.add( meshMark );

            return mesh
    }

    createBoxDecor (x=0, y=0, z=0, wx = 0.5, wy = 0.5, wz = 0.5) {
            const g = new THREE.BoxGeometry(wx, wy, wz)
            const m = new THREE.MeshBasicMaterial({color: new THREE.Color('#ffdd22')})
            const mesh = new THREE.Mesh(g, m)
            mesh.position.add(new THREE.Vector3(x, y, z))
            return mesh
    }


    createTerranCannion (scale = 1) {
        const geometry = new THREE.PlaneGeometry(10, 10, 128, 128);
        const threshold = 0.25;
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

        const material = new THREE.MeshStandardMaterial({ 
        	color: 0x008800, 
        	// side: THREE.DoubleSide, 
        	// wireframe: true,
        });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.scale.set( scale, scale, scale )
        mesh.translateY( -1 )
        mesh.rotateX( -(Math.PI/2) )

        return mesh
    }



    createFlashlight (player) {
        const color = 0xe0f06f;
        const intensity = 5;        // Adjust as needed
        const distance = 100;       // Max distance the light reaches
        const angle = Math.PI / 4;  // Math.PI * 0.1 - Width of the light cone (e.g., 10 degrees)
        const penumbra = 0.5;       // Amount of soft edge
        const decay = 0.85

        const flashlight = new THREE.SpotLight(color, intensity, distance, angle, penumbra, decay);

        flashlight.position.set(0, 1, 1)
        flashlight.target.position.set(1, -1, -10)
        player.add( flashlight )
        player.add( flashlight.target )

        return flashlight
    }
}



