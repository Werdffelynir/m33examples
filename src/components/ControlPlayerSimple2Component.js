import {ReaComponent} from "m33/ReaComponent.js";
import {EventBus} from "m33/EventBus.js";
import {Ut} from "m33/Ut.js";
import {loadScene, loadTexture} from "m33/web3d/Ut3D.js";

import * as THREE from "three";
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {ImprovedNoise} from 'three/addons/math/ImprovedNoise.js';
import {SimplexNoise} from 'three/addons/math/SimplexNoise.js';
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {FBXLoader} from "three/addons/loaders/FBXLoader.js";
import {HDRLoader} from "three/addons/loaders/HDRLoader.js";


const CSS = `
@layer page {

    @scope(#ControlPlayerSimple2Component) {
        
    }

}
`;

const HTML = `
div.absolute.top: ""
`;

export class ControlPlayerSimple2Component extends ReaComponent {

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
		let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 50);
       
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


        scene.add(new THREE.GridHelper(10))


		let controls = new OrbitControls(camera, renderer.domElement);
		controls.addEventListener('change', (e) => {
			renderer.render(scene, camera);
		})



		this.ctrl()



		renderer.render(scene, camera);
		return renderer;
    }



    ctrl () {
        const scene = this.scene
        const camera = this.camera
        const keyboard = this.register.inputs.keyboardManager
        const keymap = this.register.inputs.keyboardManager.keymap


        const player = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 2, 0.15), 
            new THREE.MeshBasicMaterial({color: new THREE.Color('#bbc37c')})
        )
        body.name = 'body'
        body.position.y = 1

        const arr = new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), body.position.clone().add(new THREE.Vector3(0,0.5,0)),  5,  new THREE.Color('#c733dd'),  0.1, 0.1, 0.25 )

        player.add(body)
        player.add(arr)

        scene.add(player)


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
        let lestTime = 0
		this.renderer.setAnimationLoop( _ => {

            if (lestTime <  1 / 30) {
                lestTime += dt
                return;
            }
            lestTime = 0


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
    
    
}



