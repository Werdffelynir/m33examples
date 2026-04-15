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

    @scope(#InstancedMeshesComponent) {
        
    }

}
`;

const HTML = `
div.absolute.top: ""
`;


export class InstancedMeshesComponent extends ReaComponent {

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

        scene.add(this.control.player)

        this.lights = addLights (scene)
        this.lights.helpersOff()
        this.renderer = renderer;
        this.camera = camera;
        this.scene = scene;


        this.groundMesh = createGround({
            color: "#404d3a"
        })
        scene.add(this.groundMesh )

        multiTextureLoader({

        }).then(textures => {

        })


        // multiFBXLoader({
        //     tree01: "/src/resources/models/tree_pack/models/tree01.fbx",
        //     tree02: "/src/resources/models/tree_pack/models/tree02.fbx",
        //     tree03: "/src/resources/models/tree_pack/models/tree03.fbx",
        //     tree04: "/src/resources/models/tree_pack/models/tree04.fbx",
        //     tree05: "/src/resources/models/tree_pack/models/tree05.fbx",
        //     tree06: "/src/resources/models/tree_pack/models/tree06.fbx",
        //     tree07: "/src/resources/models/tree_pack/models/tree07.fbx",
        //     tree08: "/src/resources/models/tree_pack/models/tree08.fbx",
        //     tree09: "/src/resources/models/tree_pack/models/tree09.fbx",
        // }).then(models => {
        //     this.reository = models;
        //     this.createObjects(scene, models)
        // })

        multiGLTFLoader({
            residence: "/src/resources/models/building_residential_03.glb",
            char: "/src/resources/models/exported-model.glb",
            xbot: "/src/resources/models/Xbot.glb",
            woman: "/src/resources/models/adventurer_woman.glb",
            lowpoly_trees: "/src/resources/models/lowpoly_trees_2.glb",
            tree_pack: "/src/resources/models/tree_pack.glb",
        }).then(models => {
            this.reository = models;
            this.createObjects(scene, models)
        })


        this.register.onUpdate((dt, i) => {
            this.control.update(dt)
            renderer.render(scene, camera);
        })

        return renderer;
    }


    createObjects (scene, models) {

        //scene.add(models.lowpoly_trees.scene.children[0])

        console.log( models )
        // FBX models
        // Object.values(models).forEach(tree => {
        //     tree = tree.children[0]
        //     tree.scale.set(0.001,0.001,0.001)
        //     tree.updateMatrix()
        //     this.addTreeV2(tree, 10)
        // })

        // GLB
        // models.tree_pack.scene.children.forEach(tree => {
        //     // this.addTree(tree.geometry, tree.material, 10)
        //     // this.addTreeV1(tree, 10)
        //     this.addTreeV2(tree, 3)
        // })

        // GLB transparent fix
        const _scale = 0.0095
        const _trees = Ut.randomUnique(Object.values(models.tree_pack.scene.children), 5)
        console.log(_trees)
        _trees.forEach(tree => {

            tree.position.set(0,0,0)
            tree.scale.set(_scale, _scale, _scale)
            tree.updateMatrix()
            if (tree.material.alphaTest !== 0.5) {
                tree.material.transparent = false
                tree.material.alphaTest = 0.5
                tree.material.opacity = 1
                tree.material.side = THREE.DoubleSide
                tree.material.needsUpdate = true
                tree.material.depthWrite = true
            }

            // this.addTree(tree.geometry, tree.material, 10)
            // this.addTreeV1(tree, 10)
            this.addTreeV2(tree, 5)
        })

        // scene.add(createBox({size: 2}))
        // scene.add(createBox({size: 2, position: new THREE.Vector3(5, 1, 0), color: 0xff0000}))

        this.renderer.render(this.scene, this.camera);
    }

    addTree (treeGeo, treeMat, count = 100, size = [100, 100]) {

        // const count = 1000;
        const mesh = new THREE.InstancedMesh(treeGeo, treeMat, count);
        const dummy = new THREE.Object3D();

        for (let i = 0; i < count; i++) {
            dummy.position.set(Math.random() * size[0] - (size[0]/2), 0, Math.random() * size[1] - (size[1]/2));
            dummy.rotation.y = Math.random() * Math.PI;
            dummy.updateMatrix();

            mesh.setMatrixAt(i, dummy.matrix);
        }

        mesh.instanceMatrix.needsUpdate = true;

        this.scene.add(mesh);
    }

    addTreeV1(model, count = 10, size = [100, 100]) {
        const dummy = new THREE.Object3D();
        const parts = [];
        model.traverse(c => {
            if(c.isMesh) {
                const im = new THREE.InstancedMesh(c.geometry, c.material, count);
                im.userData.offset = c.matrix.clone();
                this.scene.add(im);
                parts.push(im);
            }
        });

        for (let i = 0; i < count; i++) {
            const x = Math.random() * size[0] - (size[0]/2)
            const z = Math.random() * size[1] - (size[1]/2)
            const rotY = Math.random() *  Math.PI * 2
            dummy.position.set(x, 0, z);
            dummy.rotateY(rotY);
            dummy.updateMatrix();
            parts.forEach(im => {
                im.setMatrixAt(i, dummy.matrix.clone().multiply(im.userData.offset));
            });
        }
        parts.forEach(im => im.instanceMatrix.needsUpdate = true);
    }

    addTreeV2(model, count = 10, size = [100, 100]){
        const dummy = new THREE.Object3D();
        const parts = [];
        model.traverse(child => child.isMesh && parts.push(child));
        const instancedParts = parts.map(p => {
            const im = new THREE.InstancedMesh(p.geometry, p.material, count)

            return {
                iMesh: im,
                sourceMatrix: p.matrix.clone(),
                sourceMesh: p,
            }
        });

        for (let i = 0; i < count; i++) {
            const x = Math.random() * size[0] - (size[0]/2)
            const z = Math.random() * size[1] - (size[1]/2)
            const rotY = Math.random() *  Math.PI * 2
            const scale = Math.random() + 1.5 - 0.4
            dummy.position.set(x, 0, z);
            dummy.scale.set(scale, scale, scale);
            dummy.rotateY(rotY);
            dummy.updateMatrix();

            instancedParts.forEach(({ iMesh, sourceMesh }) => {
                const finalMatrix = dummy.matrix.clone().multiply(sourceMesh.matrix);
                iMesh.setMatrixAt(i, finalMatrix);
            });

        }

        instancedParts.forEach( ({iMesh}) => {
            this.scene.add(iMesh);
        })
    }


}










function createGround1( {step = 100, color = 0xff00ff, fragments = 1} = {} ){
    let geo = new THREE.PlaneGeometry(step, step, fragments, fragments)
    geo.rotateX(-90 * Math.PI / 180);
    let mat = new THREE.MeshBasicMaterial({
        color: color,
    });
    let mesh = new THREE.Mesh(geo, mat);
    return mesh;
}

function createGround( {step = 100, color = 0xff00ff, fragments = 1} = {} ){
    const canvas = createGroundCanvasTexture();
    const groundTexture = new THREE.CanvasTexture(canvas);

    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(10, 10); // Скільки разів повторити текстуру на меші

    const groundMaterial = new THREE.MeshBasicMaterial({
        map: groundTexture,
        color: 0x666666,
        // emissive: 0x000000,
        // roughness: 0.9,
        // metalness: 0.0
    });

    const geometry = new THREE.PlaneGeometry(step, step, fragments);
    const plane = new THREE.Mesh(geometry, groundMaterial);
    plane.rotation.x = -Math.PI / 2;
    return plane
}

function createGroundCanvasTexture() {
    const size = 256; // Розмір текстури
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // 1. Основний колір ґрунту (коричневий)
    ctx.fillStyle = '#2d2b20';
    ctx.fillRect(0, 0, size, size);

    // 2. Додаємо "шум" (камінці та неоднорідність)
    for (let i = 0; i < 4500; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const s = Math.random() * 2; // Розмір "зерна"

        // Випадкові відтінки: від темного до світлого коричневого
        const opacity = Math.random() * 0.5;
        const color = Math.random() > 0.5 ? 40 : 100;
        ctx.fillStyle = `rgba(${color}, ${color * 0.8}, 30, ${opacity})`;
        ctx.fillRect(x, y, s, s);
    }

    // 3. Додаємо м'які плями (імітація вологості/тіней)
    // for (let i = 0; i < 56; i++) {
    //     const x = Math.random() * size - (size/6);
    //     const y = Math.random() * size - (size/6);
    //     const radius = Math.random() * size/8;
    //     const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    //     grad.addColorStop(0, 'rgba(40, 25, 10, 0.3)');
    //     grad.addColorStop(1, 'rgba(40, 25, 10, 0)');
    //     ctx.fillStyle = grad;
    //     ctx.fillRect(0, 0, size, size);
    // }

    return canvas;
}

/*


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

*/
