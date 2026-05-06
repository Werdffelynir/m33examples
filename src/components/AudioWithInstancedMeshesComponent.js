import {ReaComponent} from "m33/ReaComponent.js";
import {EventBus} from "m33/EventBus.js";
import {SoundManager3D} from "m33/web3d/SoundManager3D.js";
// import {Ut} from "m33/Ut.js";
// import {loadScene, loadTexture} from "m33/web3d/Ut3D.js";

import * as THREE from "three";
// import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
// import {ImprovedNoise} from 'three/addons/math/ImprovedNoise.js';
// import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
// import {FBXLoader} from "three/addons/loaders/FBXLoader.js";
// import {HDRLoader} from "three/addons/loaders/HDRLoader.js";

import {
    createCameraControl,
    addLights,
    createRenderBundle,
    multiGLTFLoader,
    multiFBXLoader,
    multiTextureLoader
} from "./basic.js";
import {SPControl} from "../modules/SPControl.js";


const CSS = `
@layer page {

    @scope(#AudioWithInstancedMeshesComponent) {
        
    }

}
`;

const HTML = `
div.absolute.top: ""
`;


export class AudioWithInstancedMeshesComponent extends ReaComponent {

    create() {
        this.bus = new EventBus()
        this.children = new Map()
        this.reository = {}

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
    updateRenderer() {
        this.renderer.render(this.scene, this.camera);
    }
    createRender () {

        const {renderer, scene, camera} = createRenderBundle()
        this.renderer = renderer;
        this.camera = camera;
        this.scene = scene;

        this.lights = addLights(scene)
        this.lights.helpersOff()

        // this.control = createCameraControl(renderer, scene, camera)

        this.control = new SPControl({
            renderer: renderer,
            scene: scene,
            camera: camera,
            inputs: this.register.inputs.keyboardManager.keys,
            moveSpeed: 1.5,
            turnSpeed: 1.2,
            enabledMouse: true,
        })

        const soundsSrc = {
            river_flow: "/src/resources/sounds/river_flow.mp3",
            strange_radio_frequency: "/src/resources/sounds/strange_radio_frequency.mp3",
            woodpecker_drumming: "/src/resources/sounds/woodpecker_drumming.mp3",
            air_raid_siren: "/src/resources/sounds/air_raid_siren.mp3",
            forest_ambient: "/src/resources/sounds/forest.mp3",
            foot_step: "/src/resources/sounds/FootstepsStoneDirt3.ogg",
        }

        this.soundManager = new SoundManager3D(this.camera, this.scene)

        const promises = Object.entries(soundsSrc).map(async ([name, src]) => {
            const buffer = await this.soundManager.loadSound(name, src);
            return [name, buffer];
        });

        Promise.all(promises).then((sounds) => {

            multiGLTFLoader({
                lowpoly_trees_2: "/src/resources/models/lowpoly_trees_2.glb",
                landscape: "/src/resources/scenes/WaterlandEmpty.scene.glb",
            }).then(models => {
                this.reository = models;

                this.createObjects(scene, models)
                this.updateRenderer()
            })

            const forestSound = this.soundManager.setGlobal('forest_ambient', {
                loop: true,
                volume: 0.5,
            })

            // window.document.onclick = (e) => {
            //     // forestSound.setVolume(0)
            //     this.soundManager.fadeIn(forestSound, 5, 1)
            //     setTimeout(t=>{
            //         this.soundManager.fadeOut(forestSound, 5)
            //     }, 4000)
            // }

        })

        this._soundMuffled = false
        this.register.inputs.keyboardManager.onKeyJust("KeyX", pass => {

            this.soundManager.stopAllFromObject(this.scene.getObjectByName("Speaker"))

            console.log("Audios", {
                common: this.soundManager.sounds.size,
                playing: [...this.soundManager.sounds.values()].filter(s => s.isPlaying).length,
                state: this.soundManager.listener.context.state,
            });
        })

        this.register.looper.subscribe('played', async () => {
            this.control.enabled = true;

            if (!this._isStartedAudio) {
                this._isStartedAudio = true
                this.soundManager.playAll()
            } else {
                await this.soundManager.resumeAll()
            }
        })
        this.register.looper.subscribe('paused', async () => {
            this.control.enabled = false;
            await this.soundManager.pauseAll()
        } )


        this.register.onUpdate((delta, i) => {

            this.control.update(delta)

            this.updateSteps(delta)

            renderer.render(scene, camera);
        })

        return renderer;
    }


    createObjects (scene, models) {
        /** @type {THREE.Group} */
        const landscape = models.landscape.scene
        const trees = models.lowpoly_trees_2.scene.children
        scene.add(landscape)

        this.random = () => this.register.seed.random()

        let iter = 0;
        landscape.traverse(obj => {
            iter ++;

            if (obj.isMesh && obj.name.startsWith("spawn_tree_")) {

                const meshCopy = trees[Math.floor(this.random() * trees.length)].clone()
                meshCopy.position.set(obj.position.x, 0, obj.position.z)

                const inst = this.addInstanceTrees(meshCopy, 20, [80, 80])
                scene.add(inst)
            }

            if (obj.isMesh && obj.name.startsWith("water_sound")) {

                const sound = this.soundManager.setPositional('river_flow', obj,
                    {
                        helper: true,
                        loop: true,
                        refDistance: 20,
                        maxDistance: 40,
                        rename: obj.name,
                        position: [0,2,0],
                    })

                this.soundManager.fadeIn(sound)

            }

            if (obj.isMesh && obj.name.startsWith("Radio")) {
                this.soundManager.setPositional('strange_radio_frequency', obj,
                    {
                        helper: true,
                        loop: true})

            }

            if (obj.isMesh && obj.name === "Tree_1" || obj.name === "Tree_2") {
                this.soundManager.setPositional('woodpecker_drumming', obj,
                    {
                        helper: true,
                        loop: true,
                        position: [0,2,0],
                        rename: obj.name,
                        refDistance: 10,
                        volume: 1.2
                    })
            }


            if (obj.isMesh && obj.name.startsWith("Speaker")) {
                this.soundManager.setPositional('air_raid_siren', obj,
                    {
                        helper: true,
                        loop: true})
            }

        })


        const footStepSound = this.soundManager.setGlobal('foot_step', {
            volume: 0,
            loop: false,
        });

        this.soundManager.fadeIn(footStepSound, 1, 0.1)

        this.playStep = () => {
            const pitch = 0.5 + Math.random() * 0.2;
            if (footStepSound.isPlaying) footStepSound.stop();
            footStepSound.setPlaybackRate(pitch);
            footStepSound.play();
        }

        this.updateSteps = (delta) => {
            if (!this.control.ismoved) {
                this.stepTimer = 0;
                return;
            }

            let stepInterval = 0.5;

            if (this.control.isRunning) {
                stepInterval = 0.3;
            } else if (this.control.isWalkingBack) {
                stepInterval = 1;
            }

            this.stepTimer += delta;

            if (this.stepTimer >= stepInterval) {
                this.playStep();
                this.stepTimer = 0;
            }
        }
    }

    addInstanceTrees (meshRef, count = 1, around = [1, 1]) {
        const treeGeo = meshRef.geometry
        const treeMat = meshRef.material
        const mesh = new THREE.InstancedMesh(treeGeo, treeMat, count);
        const dummy = new THREE.Object3D();

        for (let i = 0; i < count; i++) {
            dummy.position.set(
                meshRef.position.x + this.random() * around[0] - (around[0]/2),
                0,
                meshRef.position.z + this.random() * around[1] - (around[1]/2)
            );
            dummy.rotation.y = this.random() * Math.PI;

            const scale = (0.9 + this.random()) * 2 - 0.9

            dummy.scale.set(scale,scale,scale)
            dummy.updateMatrix();

            mesh.setMatrixAt(i, dummy.matrix);
        }

        mesh.instanceMatrix.needsUpdate = true;

        return mesh
    }


}


