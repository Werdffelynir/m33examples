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

import {createCameraControl, createLights, createRenderBandle} from "./basic.js";


const CSS = `
@layer page {

    @scope(#Def_2_Component) {
        
    }

}
`;

const HTML = `
div.absolute.top: ""
`;


export class Def_2_Component extends ReaComponent {

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

        const {renderer, scene, camera} = createRenderBandle()

        this.control = createCameraControl(renderer, scene, camera)

        this.lights = createLights (scene)
        this.lights.helpersOff()

        this.createObjects(scene)

        renderer.render(scene, camera);
        return renderer;

    }

    createObjects (scene) {
        scene.add(createBox({size: 2}))
        scene.add(createBox({size: 2, position: new THREE.Vector3(5, 1, 0), color: 0xff0000}))
    }

}


function createPlane( {step = 1, color = 0xff00ff, fragments = 1} = {} ){
    let geo = new THREE.PlaneGeometry(step, step, fragments, fragments)
    let mat = new THREE.MeshBasicMaterial({color: color});
    let mesh = new THREE.Mesh(geo, mat);
    return mesh;
}

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

