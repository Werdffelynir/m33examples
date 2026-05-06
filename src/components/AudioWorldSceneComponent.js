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
import { PositionalAudioHelper } from 'three/examples/jsm/helpers/PositionalAudioHelper.js';

import {createCameraControl, addLights, createRenderBundle, multiGLTFLoader, createCharacterControl} from "./basic.js";


const CSS = `
@layer page {

    @scope(#AudioWorldSceneComponent) {
        
    }

}
`;

const HTML = `
div.absolute.top: ""
`;


export class AudioWorldSceneComponent extends ReaComponent {

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

        const {renderer, scene, camera} = createRenderBundle()
        // console.log(this.register)
        // this.control = createCameraControl(renderer, scene, camera)
        this.control = createCharacterControl(this.register, renderer, scene, camera)
        this.control.enabled = false;


        this.renderer = renderer;
        this.camera = camera;
        this.scene = scene;

        this.lights = addLights (scene)
        this.lights.helpersOff()

        this.sounds = new Set()


        this.register.looper.subscribe('played', () => {
            this.sounds.forEach(audio => audio.play())
            // console.log("playing audio");
            this.control.enabled = true;
        })
        this.register.looper.subscribe('paused', () => {
            this.sounds.forEach(audio => audio.pause())
            // console.log("paused audio");
            this.control.enabled = false;
        } )



        multiGLTFLoader({
            // dam: "/src/resources/models/dam-on-the-river.glb",
            // xbot: "/src/resources/models/Xbot.glb",
            // tree_pack: "/src/resources/models/tree_pack.glb",
            landscape: "/src/resources/scenes/Waterland.scene.glb",
        }).then(models => {
            this.reository = models;
            this.createObjects(scene, models)
            this.updateRenderer()
        })


        return renderer;

    }

    updateRenderer() {
        this.renderer.render(this.scene, this.camera);
    }

    createObjects (scene, models) {

        // const debugView = document.createElement('div');
        // debugView.style.cssText = 'position:fixed; top:10px; left:10px; color:white; background:black; padding:5px;';
        // document.body.appendChild(debugView);
        // const fftSize = 32;
        //
        // this.setDebugSound = (sound) => {
        //     this.analyser = new THREE.AudioAnalyser(sound, fftSize);
        // }
        // this.showDebugView = () => {
        //     if (!this.analyser) return;
        //     const volume = this.analyser.getAverageFrequency();
        //     debugView.innerText = `Volume: ${Math.round(volume)}`;
        //     debugView.style.width = volume + 'px';
        // }
        //
        // this.register.onUpdate((delta, iteration) => {
        //     // this.control?.mixer?.update?.(delta);
        //     if (!this.analyser) return;
        //     if (iteration % 25 === 0 && this?.showDebugView) this.showDebugView()
        // })

        /** @type {THREE.Group} */
        const landscape = models.landscape.scene
        scene.add(landscape)

        landscape.traverse(obj => {

            if (obj.isMesh && obj.name.startsWith("water_sound")) {
                // console.log(obj)
                this.audioForObject(obj, "/src/resources/sounds/river_flow.mp3",
                    {
                        ref: 5,
                        max: 30,
                    })
            }
            if (obj.isMesh && obj.name.startsWith("Build")) {
                this.audioForObject(obj,
                    "/src/resources/sounds/strange_radio_frequency.mp3",
                    {max: 30})
            }
            if (obj.isMesh && obj.name === "Tree_1") {
                const sound = this.audioForObject(obj,
                    "/src/resources/sounds/woodpecker_drumming.mp3",
                    {position: [0,5,0], helper: true})

                // this.setDebugSound(sound)
            }
            if (obj.isMesh && obj.name === "Tree_2") {
                this.audioForObject(obj, "/src/resources/sounds/air_raid_siren.mp3")
            }

        })

        this.updateRenderer()
        this.audioCamera()
    }

    audioCamera() {
        const listener = new THREE.AudioListener()
        const sound = new THREE.Audio(listener)
        const audioLoader = new THREE.AudioLoader()

        audioLoader.load('/src/resources/sounds/forest.mp3', function(buffer) {
            sound.setBuffer(buffer);
            sound.setLoop(true);
            sound.setVolume(0.1);
        })

        this.camera.add(listener)
        this.sounds.add(sound)

        // sound.pause()
        // window.addEventListener('click', e => !sound.isPlaying ? sound.play() : null);
    }

    // {ref: 5, max: 20, mod: 'linear', roll: 1, loop: true, volume: 1, cone: [90, 180, 0.1], position: [0,0,0]}
    audioForObject(mesh, soundSrc, {
        ref = 5,
        max = 20,
        mod = 'linear',
        roll = 1,
        loop = true,
        volume = 1,
        cone = [],
        position = [0,0,0],
        helper = false,
    } = {}) {
        const listener = new THREE.AudioListener()
        const audioLoader = new THREE.AudioLoader()
        const positionalSound = new THREE.PositionalAudio(listener)

        audioLoader.load(soundSrc, function(buffer) {

            positionalSound.setBuffer(buffer)
            positionalSound.setLoop(loop)
            positionalSound.setVolume(volume)
            positionalSound.setDistanceModel(mod)
            positionalSound.setRefDistance(ref)
            positionalSound.setMaxDistance(max)
            positionalSound.setRolloffFactor(roll)

            if (cone.length === 3) positionalSound.setDirectionalCone(cone[0], cone[1], cone[2])

        })

        if (position.length === 3) positionalSound.position.set(position[0], position[1], position[2])

        if (helper) {
            const helper = new PositionalAudioHelper(positionalSound, 10)
            positionalSound.add(helper);
        }

        mesh.add(positionalSound);

        this.sounds.add(positionalSound)
        this.camera.add(listener);
        return positionalSound;

        // window.addEventListener('click', () => {
        //     if (!sound.isPlaying) sound.play();
        // });
    }


}


