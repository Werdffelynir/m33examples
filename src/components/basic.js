import * as THREE from "three";
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {ImprovedNoise} from 'three/addons/math/ImprovedNoise.js';
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {FBXLoader} from "three/addons/loaders/FBXLoader.js";
import {HDRLoader} from "three/addons/loaders/HDRLoader.js";



/*
Use:
import {createCameraControl, addLights, createRenderBundle} from "./basic.js";


const {renderer, scene, camera} = createRenderBundle()
const {control} = createCameraControl(renderer, scene, camera)
const {hemisphere, directional, helpersOff, helpersOn} = addLights (scene)
*/

export function createCameraControl (renderer, scene, camera) {


    let controls = new OrbitControls(camera, renderer.domElement);

    controls.addEventListener('change', (e) => {
        renderer.render(scene, camera);
    })

    return controls
}



export function addLights (scene, helpers = true) {

    const lightHem = new THREE.HemisphereLight('#f1e9fc', '#000000', 2)
    lightHem.position.set(0, 5, 0)
    scene.add(lightHem)

    const lightDir = new THREE.DirectionalLight('#82bbdc', 2)
    lightDir.position.set(3, 5, 8)
    scene.add(lightDir)

    const lightHemHelp = new THREE.HemisphereLightHelper(lightHem)
    const lightDirHelp = new THREE.DirectionalLightHelper(lightDir)

    if (helpers) {
        scene.add(lightDirHelp)
        scene.add(lightHemHelp)
    }

    return {
        hemisphere: lightHem,
        directional: lightDir,
        helpersOff: () => {
            lightDirHelp.visible = false;
            lightHemHelp.visible = false;
        },
        helpersOn: () => {
            lightDirHelp.visible = true;
            lightHemHelp.visible = true;
        },
    }
}



export function createRenderBundle ({
    grid = {size: 10, division: 10},
} = {}) {

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 8, 13);

    const renderer = new THREE.WebGLRenderer({antialias: false});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x404040);


    if (grid)
        scene.add(new THREE.GridHelper(grid.size, grid.division, 0xffffff))


    renderer.render(scene, camera);

    return {
        renderer, scene, camera
    };
}



export function createSimpleAnimation (fps = 30, callback, keyStartCode = "Space") {

    let isplay = false;
    let animationId;
    let lastTime = 0;

    const interval = 1000 / fps;

    const animate = (timestamp = 0) => {

        animationId = requestAnimationFrame(animate);

        const delta = timestamp - lastTime;

        if (!isplay || delta <= interval) return;

        lastTime = timestamp - (delta % interval);

        callback(delta)

    }

    if (keyStartCode) {
        window.addEventListener("keyup", (e) => {
            if (e.code === keyStartCode) {
                isplay = !isplay;
                animate(0)

                console.log("{SimpleAnimation} is " + (isplay ? "PLAYED!": "STOPED!"))
            }
        })
    }

    return () => {animate(0)}
}


export async function multiTextureLoader(srcObject, callback) {
    /**@type {THREE.Texture} */
    const textureLoader = new THREE.TextureLoader();
    const entries = Object.entries(srcObject);

    try {
        const texture = await Promise.all(
            entries.map(([name, url]) => {
                const tx = textureLoader.loadAsync(url)
                tx.wrapS = THREE.RepeatWrapping
                tx.wrapT = THREE.RepeatWrapping

                tx.repeat.set(repeated, repeated);
                callback?.(tx, name)
                return tx
            })
        );
        return Object.fromEntries(
            entries.map(([name], index) => [name, texture[index]])
        );
    } catch (error) {
        console.error(error)
        throw error;
    }
}


export async function multiGLTFLoader(srcObject, callback) {

    const loader = new GLTFLoader();
    const entries = Object.entries(srcObject);

    try {

        const models = await Promise.all(
            entries.map(([name, url]) => {
                const model = loader.loadAsync(url)
                callback?.(model, name)
                return model
            })
        );

        return Object.fromEntries(
            entries.map(([name], index) => [name, models[index]])
        );

    } catch (error) {
        console.error(error)
        throw error;
    }
}


export async function multiFBXLoader(srcObject, callback) {

    const loader = new FBXLoader();
    const entries = Object.entries(srcObject);

    try {

        const models = await Promise.all(
            entries.map(([name, url]) => {
                const model = loader.loadAsync(url)
                callback?.(model, name)
                return model
            })
        );

        return Object.fromEntries(
            entries.map(([name], index) => [name, models[index]])
        );

    } catch (error) {
        console.error(error)
        throw error;
    }
}


