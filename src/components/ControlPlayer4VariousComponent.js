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
import { GUI } from 'lil-gui';


const CSS = `
@layer page {

    @scope(#ControlPlayer4VariusComponent) {
        
    }

}
`;

const HTML = `
div.absolute.top: ""
`;

export class ControlPlayer4VariousComponent extends ReaComponent {

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

        const arr = new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), body.position.clone().add(new THREE.Vector3(0,1,0)),  5,  new THREE.Color('#c733dd'),  0.1, 0.1, 0.25 )

        player.add(body)
        player.add(arr)

        scene.add(player)


        const moveSpeed = 2.5
        const turnSpeed = 1.25
        const forwardDir = new THREE.Vector3(0, 0, -1);
        const upperDir = new THREE.Vector3(0, 1, 0);


        const velocity = new THREE.Vector3(0, 0, 0);
        let yaw = 0;
        let inputZ = 0
        let inputX = 0


        this.controlVariant = 1

        this.gui = new GUI();

        this.gui.add( this, 'controlVariant',  {
            'Variant = 1': 1,
            'Variant = 2': 2,
            'Variant = 3': 3,
            'Variant = 4': 4,
        } ).onChange((variant) => {
            console.log(variant)
        });

        // fake FPS limitter
        const dt = 0.016
        let lestTime = 0
		this.renderer.setAnimationLoop( _ => {

            if (lestTime <  1 / 30) {
                lestTime += dt
                return;
            }
            lestTime = 0


            if (
                !keymap.up.pressed &&
                !keymap.down.pressed &&
                !keymap.right.pressed &&
                !keymap.left.pressed) return;

            switch (this.controlVariant) {
// VAR 1
                case 1:
                    forwardDir.set(0, 0, -1) // reset dir
                    forwardDir.applyQuaternion(player.quaternion);
                    forwardDir.y = 0;
                    forwardDir.normalize();
                    if (keymap.up.pressed) player.position.addScaledVector(forwardDir, moveSpeed * dt);
                    if (keymap.down.pressed) player.position.addScaledVector(forwardDir, -moveSpeed * dt);
                    if (keymap.right.pressed) player.rotation.y -= turnSpeed * dt
                    if (keymap.left.pressed) player.rotation.y += turnSpeed * dt
                    break;

                case 2:
// VAR 2
                    if (keymap.left.pressed)  yaw += turnSpeed * dt;
                    if (keymap.right.pressed) yaw -= turnSpeed * dt;
                    player.rotation.y = yaw;
                    forwardDir.set(0, 0, -1)
                    forwardDir.applyAxisAngle(upperDir, yaw);
                    if (keymap.up.pressed) player.position.addScaledVector(forwardDir, moveSpeed * dt);
                    if (keymap.down.pressed) player.position.addScaledVector(forwardDir, -moveSpeed * dt);
                    break;

                case 3:
// VAR 3 ( press L and R for follow forward )
                    if (keymap.up.pressed)      inputZ = -1
                    if (keymap.down.pressed)    inputZ = 1
                    if (keymap.right.pressed)   yaw += -(moveSpeed * dt)
                    if (keymap.left.pressed)    yaw += (moveSpeed * dt)
                    const dir2 = new THREE.Vector3(inputX, 0, inputZ);
                    if (dir2.lengthSq() > 1) dir2.normalize();
                    const sinYaw = Math.sin(yaw);
                    const cosYaw = Math.cos(yaw);
                    const moveX = dir2.x * cosYaw + dir2.z * sinYaw;
                    const moveZ = -dir2.x * sinYaw + dir2.z * cosYaw;
                    velocity.x = moveX * moveSpeed;
                    velocity.z = moveZ * moveSpeed;
                    player.rotation.y = yaw;
                    player.position.addScaledVector(velocity, dt);
                    break;

                case 4:
// VAR 4 ( press L and R for follow forward )
                    if (keymap.up.pressed)      inputZ = -1
                    if (keymap.down.pressed)    inputZ = 1
                    if (keymap.right.pressed)   yaw += -(moveSpeed * dt)
                    if (keymap.left.pressed)    yaw += (moveSpeed * dt)
                    const dir3 = new THREE.Vector3(inputX, 0, inputZ);
                    if (dir3.lengthSq() > 1) dir3.normalize();
                    dir3.applyAxisAngle(new THREE.Vector3(0,1,0), yaw);
                    velocity.copy(dir3).multiplyScalar(moveSpeed);
                    player.rotation.y = yaw;
                    player.position.addScaledVector(velocity, dt);

                    break;


            }


			this.renderer.render(scene, camera);

        })

    }
    

}



