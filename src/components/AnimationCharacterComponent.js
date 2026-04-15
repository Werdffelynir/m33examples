import {ReaComponent} from "m33/ReaComponent.js";
import {EventBus} from "m33/EventBus.js";
import {Ut} from "m33/Ut.js";
// import {loadScene, loadTexture} from "m33/web3d/Ut3D.js";
//
import * as THREE from "three";
import * as AnimationUtils from 'three/src/animation/AnimationUtils.js';
// import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
// import {ImprovedNoise} from 'three/addons/math/ImprovedNoise.js';
// import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
// import {FBXLoader} from "three/addons/loaders/FBXLoader.js";
// import {HDRLoader} from "three/addons/loaders/HDRLoader.js";
import { GUI } from 'lil-gui';

import {createCameraControl, addLights, createRenderBundle, multiGLTFLoader} from "./basic.js";


const CSS = `
@layer page {

    @scope(#AnimationCharacterComponent) {
        
    }

}
`;

const HTML = `
div.absolute.top: ""
`;


export class AnimationCharacterComponent extends ReaComponent {

    create() {
        this.bus = new EventBus()
        this.children = new Map()

        super.create({
            template: HTML,
            css: CSS,
            state: {},
            parent: this.register.rootScreenElement,
        });

        this.currentModel = 'xbot'
    }

    onMount() {
        if (!this.renderer) {
            this.renderer = this.createRender()
            this.root.appendChild(this.renderer.domElement);
        }
    }

    onUnmount() {
        if (this.renderer?.domElement)
            this.renderer?.domElement.remove()
    }

    createRender() {

        const {renderer, scene, camera} = createRenderBundle()

        this.scene = scene
        this.camera = camera
        this.camera.position.set(0, 4, 6)

        this.control = createCameraControl(renderer, scene, camera)

        this.lights = addLights(scene)
        this.lights.helpersOff()
        this.lights.directional.position.set(5, 15, 8)


        this.createObjects()

        this.refresh = () => renderer.render(scene, camera);
        this.refresh()

        return renderer;

    }

    createObjects(scene) {
        // const model = ;
        // this.mixer = new THREE.AnimationMixer( model );

        multiGLTFLoader({
            residence: "/src/resources/models/building_residential_03.glb",
            char: "/src/resources/models/exported-model.glb",
            xbot: "/src/resources/models/Xbot.glb",
            woman: "/src/resources/models/adventurer_woman.glb",
        }).then(models => {

            this.addModelObjects(models)

        })


    }


    createAnimationHandler(gltf) {
        this.actions = {
            None: false,
        };

        this.mixer =  new THREE.AnimationMixer( gltf.scene );

        gltf.animations.forEach((clip) => {
            this.actions[clip.name] = this.mixer.clipAction(clip);
        });

        this.cleanup = () => {
            this.mixer.stopAllAction();
            this.mixer.uncacheRoot(gltf.scene);
            this._lastAction = null
            this._additiveClip = null
        }

        this.transition = (fromAction, toAction, duration = 0.5) => {
            if (!fromAction) {
                toAction.play();
            } else {
                toAction.enabled = true;
                toAction.setEffectiveTimeScale(1);
                toAction.setEffectiveWeight(1);
                toAction.time = 0;
                fromAction.crossFadeTo(toAction, duration, true);
                toAction.play();
            }
        }

        this.register.onUpdate(delta => {
            this.mixer.update(delta)

            this.refresh()
        } )

    }

    addModelObjects(models) {


        // console.log(models)
        models.residence.scene.position.set(5, 0, -10)
        models.residence.scene.rotateY(1.57079)

        this.scene.add(models.residence.scene)
        this.scene.add(models[this.currentModel].scene)

        this.createAnimationHandler(models[this.currentModel])

        const gui = new GUI();
        this.registerGUI (gui)

        this.refresh()
    }

    registerGUI (gui) {

        this.actionMain = "None"
        gui.add( this, 'actionMain', this.actions).onChange( action => {
            console.log( action ); //

            if (this._lastAction) this._lastAction.stop();

            if (action === false) {
                return this.mixer.stopAllAction();
            }

            action.play();

            this._lastAction = action;
        })

        this.actionTransition = "None"
        gui.add( this, 'actionTransition', this.actions).onChange( action => {
            if (action === false) {
                return this.mixer.stopAllAction();
            }

            this.transition(this._lastAction, action)
            this._lastAction = action;
        })

        this.animationSpeed = 1
        gui.add( this, 'animationSpeed', 0.1,  2,   0.1 ).name( 'Speed' ).onChange( value => {
            if (this._lastAction)
                this._lastAction.timeScale = parseFloat(value);
        })


        if (this.actions?.sad_pose) {

            this.actionMix = "None"
            gui.add( this, 'actionMix', {
                None: false,
                sad_pose: this.actions.sad_pose,
                sneak_pose: this.actions.sneak_pose,
            })
                .onChange( action => {
                    if (action === false && this._lastMixAction) {
                        this._lastMixAction.paused = false;
                        this._lastMixAction.timeScale = -0.1;
                        return this._lastMixAction.play();
                    }

                    if (!this._additiveClip || this._additiveClip.name !== action.getClip().name) {

                        if (this._additiveClip && this._lastMixAction)
                            this._lastMixAction.stop();

                        this._additiveClip = AnimationUtils.makeClipAdditive(action.getClip(), 0);
                    }

                    const breatheAction = this.mixer.clipAction(this._additiveClip);

                    breatheAction.reset();
                    breatheAction.enabled = true;
                    breatheAction.clampWhenFinished = true;
                    breatheAction.timeScale = 0.1
                    breatheAction.loop = THREE.LoopOnce // (LoopOnce, LoopRepeat, LoopPingPong)
                    breatheAction.play()

                    this._lastMixAction = breatheAction
                })


            this.animationMixWeight = 0.5
            gui.add( this, 'animationMixWeight', 0.1,  1,   0.1 ).name( 'MixWeight' ).onChange( value => {
                if (this._lastMixAction)
                    this._lastMixAction.setEffectiveWeight(parseFloat(value));
            })
        }

        gui.add(this, 'globalLoopToggle').name('looper.toggle');

    }
    globalLoopToggle () {
        this.register.looper.togglePause()
    }
}


