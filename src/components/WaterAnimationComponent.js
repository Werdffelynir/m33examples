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
import { Water } from 'three/examples/jsm/objects/Water.js';
import { GUI } from 'lil-gui';

import {
    createCameraControl,
    createLights,
    createRenderBandle,
    createSimpleAnimation
} from "./basic.js";

const CSS = `
@layer page {

    @scope(#WaterAnimationComponent) {
        
    }

}
`;

const HTML = `
div.absolute.top: ""
`;


export class WaterAnimationComponent extends ReaComponent {

    create() {
        this.bus = new EventBus()
        this.children = new Map()
        this.inputs = this.register.inputs

        super.create({
            template: HTML,
            css: CSS,
            state: {},
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

        const {renderer, scene, camera} = createRenderBandle({grid: false})
        this.control = createCameraControl(renderer, scene, camera)
        this.renderer = renderer
        this.scene = scene
        this.camera = camera

        this.lights = createLights (scene)
        this.lights.helpersOff()

        this.createWater()

        renderer.render(scene, camera);
        return renderer;

    }

    createWater () {
        const updates = new Set()
        const textureLoader = new THREE.TextureLoader();
        const repeat = 1
        const waterNormalMap = textureLoader.load('/src/resources/textures/water/waterNormals.jpg');
        waterNormalMap.wrapS = waterNormalMap.wrapT = THREE.RepeatWrapping;
        waterNormalMap.repeat.set(repeat, repeat);

        const waterGeometry = new THREE.PlaneGeometry(1000, 1000);
        const water = new Water(waterGeometry, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: waterNormalMap,
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 3.7,
            fog: this.scene.fog !== undefined
        });
        water.rotation.x = -Math.PI / 2;

        this.scene.add(water);

        updates.add((d) => {
            water.material.uniforms[ 'time' ].value += 1.0 / 120.0;
            this.renderer.render(this.scene, this.camera);
        })

        createSimpleAnimation(30, (delta) => {
            updates.forEach(fn => fn(delta))
        }, "Space")

    }

}



/*
this.gui = new GUI();

this.gui.add( this, 'controlVariant',  {
    'Variant = 1': 1,
    'Variant = 2': 2,
    'Variant = 3': 3,
    'Variant = 4': 4,
} ).onChange((variant) => {
    console.log(variant)
});
*/

/*


createObjects (scene) {
    const repeat = 4
    const textureLoader = new THREE.TextureLoader();
    const waterNormalMap = textureLoader.load('/src/resources/textures/water/waterNormals.jpg');
    waterNormalMap.wrapS = waterNormalMap.wrapT = THREE.RepeatWrapping;
    waterNormalMap.repeat.set(repeat, repeat);

    const waterMaterial = new THREE.MeshStandardMaterial({
        color: 0x6699ff,
        normalMap: waterNormalMap,
        roughness: 0,
        metalness: 0.25,
        transparent: true,
        opacity: 0.7,
    });

    const waterPlane = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 1, 1), waterMaterial);
    waterPlane.rotation.x = -Math.PI / 2;
    scene.add(waterPlane);


    const island = createIsland()
    scene.add(island);


    this.isplay = false;
    let animationId;
    let lastTime = 0;
    const fps = 30;
    const interval = 1000 / fps;
    const animate = (timestamp = 0) => {
        animationId = requestAnimationFrame(animate);
        const delta = timestamp - lastTime;

        if (!this.isplay || delta <= interval) return;

        lastTime = timestamp - (delta % interval);

        // Animate the normal map's offset
        waterNormalMap.offset.y += 0.0010;
        waterNormalMap.offset.x -= 0.0005;
        // waterHeightMap.offset.y = waterNormalMap.offset.y
        // waterHeightMap.offset.x = waterNormalMap.offset.x
        // waterColorMap.offset.y = waterNormalMap.offset.y
        // waterColorMap.offset.x = waterNormalMap.offset.x

        this.renderer.render(scene, this.camera);
    }

    // animate
    this.inputs.keyboardManager.onKeyJust("Space", () => {
        this.isplay = !this.isplay;
        animate()
    })

   // animate()

}


async createWaterFromPlaneGeometry(object, scene) {
    return new Promise((resolve) => {
        object.geometry.computeBoundingBox();

        const waterNormalsPath = "/src/resources/textures/water/waterNormals.jpg"
        const boundingBox = object.geometry.boundingBox;
        const width = boundingBox.max.x - boundingBox.min.x;
        const length = boundingBox.max.z - boundingBox.min.z;

        const waterGeometry = new THREE.PlaneGeometry(width, length);

        new THREE.TextureLoader().load(waterNormalsPath, (texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

            let waterOptions = {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: texture,
                sunDirection: new THREE.Vector3(),
                sunColor: 0xffffff,
                waterColor: 0x00faff,
                distortionScale: 3.7,
                fog: scene.fog !== undefined,
            }

            const water = new Water(waterGeometry, waterOptions);

            water.rotation.x = -Math.PI / 2;
            water.position.copy(object.position);

            resolve(water);
        });
    });
}

async animateWater (water) {
    water.material.uniforms[ 'time' ].value += 1.0 / 360.0;
}


function createPlane( {step = 1, color = 0xff00ff, fragments = 1} = {} ){
    let geo = new THREE.PlaneGeometry(step, step, fragments, fragments)
    let mat = new THREE.MeshBasicMaterial({color: color});
    let mesh = new THREE.Mesh(geo, mat);

    return mesh;
}

// scene.add(createBox({size: 2}))
// scene.add(createBox({size: 2, position: new THREE.Vector3(5, 1, 0), color: 0xff0000}))
// createBox( {size: 2, position: new THREE.Vector3(5, 0, 0), color: 0xff0000} )

function createBox( {size = 1, position = new THREE.Vector3(), color = 0xffffff} = {}){
    let geo = new THREE.BoxGeometry(size, size, size)
    let mat =  new THREE.MeshBasicMaterial({color: color});
    mat.color.set(color);
    mat.color.setHex(color, THREE.SRGBColorSpace)
    mat.needsUpdate = true;

    let mesh = new THREE.Mesh(geo, mat);
    mesh.position.add(position)
    // mesh.material.color.set(0xff0000);
    return mesh;
}







function createIsland( {step = 1, color = 0xff00ff, fragments = 1} = {} ){

    const shape = new THREE.Shape();
    shape.absarc(0, 0, 1, 0, Math.PI * 2);

    const mat1 = new THREE.MeshStandardMaterial({
        color: 0xeedd88,
        flatShading: true,
        side: THREE.DoubleSide
    });
    const mat2 = new THREE.MeshStandardMaterial({
        color: 0xddee88,
        flatShading: true,
        side: THREE.DoubleSide
    });

    const settings = { depth: 2, bevelEnabled: true, bevelThickness: 0.5 };
    const geo = new THREE.ExtrudeGeometry(shape, settings);

    const island = new THREE.Mesh(geo, [mat1, mat2]);
    island.rotation.x = -Math.PI / 2;
    island.position.y = -1.1
    island.scale.set(0.75,0.95,0.5)

    for (var iy = 0; iy < 5; iy++) {

        for (var ix = 0; ix < 5; ix++) {
            let r = Math.random()
            if (r > 0.5) continue;
            let tree = createLowPolyTree()
            tree.rotation.x = Math.PI / 2;
            tree.position.z = 2.4
            tree.position.y = (iy - r - 2) / 3
            tree.position.x = (ix - r - 2) / 3
            tree.scale.set(0.1, 0.3, 0.1)
            island.add(tree)
        }

    }

    return island;
}



function createLowPolyTree() {
    const tree = new THREE.Group();
    const trunkGeom = new THREE.CylinderGeometry(0.2, 0.4, 1.5, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, flatShading: true });
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.y = 0.75;
    tree.add(trunk);

    const leavesGeom = new THREE.IcosahedronGeometry(0.8, 0);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x228B22, flatShading: true });
    const leaves = new THREE.Mesh(leavesGeom, leavesMat);
    leaves.position.y = 1.8;
    tree.add(leaves);

    return tree;
}


*/


