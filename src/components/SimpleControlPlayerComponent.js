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

    @scope(#SimpleControlPlayerComponent) {
        
    }

}
`;

const HTML = `
div.absolute.top: ""
`;

export class SimpleControlPlayerComponent extends ReaComponent {

    create() {

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
       
        // scene.fog = new THREE.FogExp2(0x000000, 0.008);
        camera.position.set(0, 8, 13);


		let renderer = new THREE.WebGLRenderer({antialias: false});

		renderer.setSize(innerWidth, innerHeight);
		renderer.setClearColor(0x404040);

		this.scene = scene
		this.camera = camera
		this.renderer = renderer

        const lightHem = new THREE.HemisphereLight('#f1e9fc', '#000000', 0.8)
        lightHem.position.set(0,5,0)
        scene.add(lightHem)

        // const lightDir = new THREE.DirectionalLight('#b691e9', 4)
        // lightDir.position.set(3, 5, 8)
        // scene.add(lightDir)


        scene.add(new THREE.GridHelper(10))


		let controls = new OrbitControls(camera, renderer.domElement);

		controls.addEventListener('change', (e) => {
			renderer.render(scene, camera);
		})

		// renderer.setAnimationLoop( _ => {
		// 	renderer.render(scene, camera);
		// })


		this.ctrl()


		renderer.render(scene, camera);
		return renderer;
    }



    ctrl () {
        const scene = this.scene
        const camera = this.camera
        const keyboard = this.register.inputs.keyboardManager
        const keymap = this.register.inputs.keyboardManager.keymap


        // const player = this.createCharacter(new THREE.Vector3(0,0,0))

        const player = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 2, 0.15), 
            new THREE.MeshBasicMaterial({color: new THREE.Color('#bbc37c')})
        )
        body.name = 'body'

        const arr = new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), body.position.clone().add(new THREE.Vector3(0,0.5,0)),  5,  new THREE.Color('#c733dd'),  0.1, 0.1, 0.25 )

        player.add(body)
        player.add(arr)

        scene.add(player)

        // return

        // const flashlight = this.createFlashlight(player)
        // flashlight.visible = false

        // keyboard.onKeyJust("KeyQ", () => player.setMark() )
        // keyboard.onKeyJust("KeyL", () => flashlight.visible = !flashlight.visible )

        // const spotLightHelper = new THREE.SpotLightHelper( flashlight )
        // scene.add( spotLightHelper )

        // player.getObjectByName("face").add( camera );
        // camera.position.set(0, 1.0, 10)


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


        const moveDirection = new THREE.Vector3(0, 0, -1)


        const getPlayerDirection = () => {
            moveDirection.set(0, 0, -1)
            moveDirection.applyQuaternion(player.quaternion).normalize()
            moveDirection.y = 0
            return moveDirection
        }



        const limitDistanceSq = 10 * 10
        const limitRotateSq = Math.PI / 4
        const moveSpeed = 1.55
        const turnSpeed = 0.75
        let speed = moveSpeed

        // fake timer. FPS limitter
        const dt = 0.016
		this.renderer.setAnimationLoop( _ => {


            if (
                !keymap.f.pressed &&
                !keymap.r.pressed &&
                !keymap.up.pressed &&
                !keymap.down.pressed &&
                !keymap.right.pressed &&
                !keymap.left.pressed) return;


            if (keymap.left.pressed) player.rotation.y += turnSpeed * dt
            if (keymap.right.pressed) player.rotation.y -= turnSpeed * dt


            if (speed !== moveSpeed ) speed = moveSpeed
            if (keymap.shift.pressed) speed *= 3


            if (keymap.up.pressed) {
            	player.position.addScaledVector(getPlayerDirection(), speed * dt)
            }
            if (keymap.down.pressed) {
				player.position.addScaledVector(getPlayerDirection(), -speed * dt)
            }


            if (keymap.r.pressed) player.position.y += moveSpeed * dt
            if (keymap.f.pressed) player.position.y -= moveSpeed * dt


			this.renderer.render(scene, camera);

        })

    }
    


    createCharacter ({position = new THREE.Vector3(0, 1, 0)}) {
        const height = 2
        const character = new THREE.Group()
        const mat = new THREE.MeshBasicMaterial({color: new THREE.Color('#bbc37c')})


        const bodyGeo = new THREE.BoxGeometry(0.25, 2, 0.15)
        const body = new THREE.Mesh(bodyGeo, mat)
        body.name = 'body'



        const faceGeo = new THREE.BoxGeometry(0.5, 0.10, 0.2)
        const face = new THREE.Mesh(faceGeo, mat)
        face.name = 'face'
        face.position.y = 0.75
        face.position.z = -0.35


        const arr = new THREE.ArrowHelper( 
            new THREE.Vector3(0, 0, -1), 
            body.position.clone().add(new THREE.Vector3(0,0.5,0)), 
            5, 
            new THREE.Color('#c733dd'), 
            0.1, 0.1, 0.25 )
        

        const markGeo = new THREE.RingGeometry( 1, 1.20, 24 );
        const markMat = new THREE.MeshBasicMaterial( { color: 0xffff00, side: THREE.DoubleSide } );
        const mark = new THREE.Mesh( markGeo, markMat );
        

        mark.name = 'mark'
        mark.rotation.x = -(Math.PI / 2)
        mark.visible = false


        const flashlight = this.createFlashlight()
        flashlight.name = 'flashlight'
        flashlight.position.set(0, 1, 1)
        flashlight.target.position.set(1, -1, -10)
        character.add( flashlight )
        character.add( flashlight.target )

        character.add(body)
        character.add(face)
        character.add(mark);
        character.add(arr)

        character.showActive = (on = true) => meshMark.visible = on ?? !meshMark.visible
        character.showFlashlight = (on = true) => flashlight.visible = on ?? !flashlight.visible

        character.position.copy(position)
        // character.castShadow = true
        // character.receiveShadow = true
        console.log(character)

        return character
    }


    createFlashlight () {
        const color = 0xe0f06f;
        const intensity = 5;        // Adjust as needed
        const distance = 100;       // Max distance the light reaches
        const angle = Math.PI / 4;  // Math.PI * 0.1 - Width of the light cone (e.g., 10 degrees)
        const penumbra = 0.5;       // Amount of soft edge
        const decay = 0.85

        return new THREE.SpotLight(color, intensity, distance, angle, penumbra, decay);
    }
}




// function createMapPlane( step = 10, srgments = 1, color = '#52724e') {
//     let geo = new THREE.PlaneGeometry(step, step, srgments, srgments)
//     let mat = new THREE.MeshBasicMaterial({color: color});
//     let mesh = new THREE.Mesh(geo, mat);
//     mesh.rotateX(-1.57079)
//     return mesh;
// }

// function createBuilding( sizeX = 1, sizeY = 1, sizeZ = 1, color = 0x444444) {
//     const geo = new THREE.BoxGeometry(sizeX, sizeY, sizeZ)
//     const mat = new THREE.MeshStandardMaterial({color: color});

//     // varius of change color
//     // mat.color.set(color);
//     // mat.color.setHex(color, THREE.SRGBColorSpace)
//     // mat.needsUpdate = true;
//     // mesh.material.color.set(0xff0000);

//     let mesh = new THREE.Mesh(geo, mat);

//     return mesh;
// }

// function createMapDecoration(count = 2){
// 	let group = new THREE.Group()

//     for (var i = 0; i < count; i++) {
//         const x = Ut.random(3, 6)
//         const y = Ut.random(3, 6)
//         const z = Ut.random(3, 6)
//         const build = createBuilding(x, y, z)
//         build.position.x = i % 2 === 0 ? i * x : i * x * 1.5
//         build.position.y = y / 2
//         build.position.z = i % 2 !== 0 ? i * z : i * z * 1.5

//         if (Ut.random() > 0.5)
//             build.position.z *= -1

//         group.add(build)
//     }

//     return group;
// }


// const place = createMapPlane(100)

// scene.add(place)



// for (var i = 0; i < 3; i++) {
//     const builds = createMapDecoration(Ut.random(1, 3))
//     builds.position.x = Ut.random(-40, 40)
//     builds.position.z = Ut.random(-40, 40)
//     scene.add(builds)
// }
