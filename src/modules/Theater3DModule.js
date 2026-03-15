import * as THREE from "three";
import * as GeometryUtils from 'three/addons/utils/GeometryUtils.js';

import {Module} from "/m33/Module.js";
import {Reactive} from "/m33/Reactive.js";
import {AnimationLoop} from "/m33/AnimationLoop.js";
import {LoopKeeper} from "/m33/LoopKeeper.js";
import {Actor3DManager} from "/m33/web3d/Actor3DManager.js";
import {SystemManager} from "/m33/web3d/SystemManager.js";




export class SceneKeeper {
    constructor() {
        this.scenes = new Map();
        this.activeSceneId = null;
    }

    addScene (sceneId, scene, instance) {
        if (!this.scenes.has(sceneId))
            this.setScene(sceneId, scene, instance)
        else 
            throw new Error(`Can't add existing Scene. By id name ${sceneId}!`)
    }

    setScene (sceneId, scene, instance, entries) {
        
        this.scenes.set(sceneId, {sceneId, scene, instance, entries: [] });
        
        if (!this.activeSceneId) this.activeSceneId = sceneId
    }

    get (sceneId) { return this.scenes.get(sceneId) }
    getScene (sceneId) { return this.scenes.get(sceneId)?.scene }
    getInstance (sceneId) { return this.scenes.get(sceneId)?.instance }

    get scene () {
        return this.scenes.get(this.activeSceneId).scene
    }
}


export class Theater3DModule extends Module {


    setup() {
        this.updatable = false;
        this.type = 'rerender'
        this.reactive = new Reactive({
            updated: null,
            loaded: null,
            selectedTargetId: null,
        })

        this.state = this.reactive.state;
        this.cachedObjects = new Set()
        this.loopLocalUpdates = new Set()
    }

    addUpdate = cb => this.loopLocalUpdates.add(cb)

    removeUpdate = cb => this.loopLocalUpdates.delete(cb)

    startup() {

        this.loader = new THREE.ObjectLoader();
        this.sceneKeeper = new SceneKeeper();

        this.actors = new Actor3DManager();
        this.systems = new SystemManager();

        /** @type {THREE.Scene}*/ this.scene = null
        /** @type {THREE.WebGLRenderer}*/ this.renderer = null

        /** @type {THREE.Object3D|THREE.Camera|THREE.PerspectiveCamera|THREE.OrthographicCamera}*/
        this.camera = null
        this.project = null
        this.environment = null
        this.history = null
        this.metadata = null
        this.scripts = null
        this.root = this.props?.root ?? this.register.rootScreenElement

        // Basic Controls Cameras
        const conf = {...{
            skipFrame: 0,
            fps: 60,
            fov: 50,
            aspect: window.innerWidth / window.innerHeight,
            near: 0.01,
            far: 1000,
            frustumSize: 5,
        }, ...this.register.config}


        this.cameraPerspective = new THREE.PerspectiveCamera( conf.fov, conf.aspect,  conf.near,  conf.far );
        this.cameraOrthographic = new THREE.OrthographicCamera( - conf.frustumSize * conf.aspect, conf.frustumSize * conf.aspect, conf.frustumSize, - conf.frustumSize,  conf.near,  conf.far);


        // Loop manager

        this.loopKeeper = new LoopKeeper(this.register, conf)

        if (this.props?.autoUpdate === true) {
        }


        // UPDATE
        //
        //
        // 
        this.loopKeeper.onUpdate((delta, i) => {

            this.loopLocalUpdates.forEach(cb => cb(delta, i))

        })


        const onWindowResize = () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize( window.innerWidth, window.innerHeight );
            this.update(0)
        }

        window.addEventListener( 'resize', onWindowResize );
    }


    /**
     * ```
     *
     * renderer = createWebGLRenderer ({
     *     sizeWidth: window.innerWidth,
     *     sizeHeight: window.innerHeight,
     *     alpha: false,
     *     premultipliedAlpha: true,
     *     antialias: true,
     *     stencil: true,
     *     preserveDrawingBuffer: true,
     *     failIfMajorPerformanceCaveat: true,
     *     depth: true,
     *     logarithmicDepthBuffer: false,
     *     reversedDepthBuffer: true,
     *     precision: "lowp",
     *     powerPreference: "default",
     *     pixelRatio: 1,
     *     shadowMap: {enabled: true, type: THREE.PCFShadowMap},
     *     canvas
     *     context
     *     sortObjects
     *     toneMappingExposure: 1
     * })
     *
     * theater.attach(rootElement)
     *
     *
     * renderer.setClearAlpha(0)
     *
     * ```
     */
    createWebGLRenderer (project) {
        let parameters = {
            sizeWidth: project?.sizeWidth ?? window.innerWidth,
            sizeHeight: project?.sizeHeight ?? window.innerHeight,
            alpha: project?.alpha ?? false,
            premultipliedAlpha: project?.premultipliedAlpha ?? true,
            antialias: project?.antialias ?? true,
            stencil: project?.stencil ?? true,
            preserveDrawingBuffer: project?.preserveDrawingBuffer ?? true,
            failIfMajorPerformanceCaveat: project?.failIfMajorPerformanceCaveat ?? true,
            depth: project?.depth ?? true,
            logarithmicDepthBuffer: project?.logarithmicDepthBuffer ?? false,
            reversedDepthBuffer: project?.reversedDepthBuffer ?? true,
            precision: project?.precision ?? "lowp",
            powerPreference: project?.powerPreference ?? "default",
        }

        if (project?.canvas) parameters.canvas = project.canvas;
        if (project?.context) parameters.context = project.context;

        /** @type {THREE.WebGLRenderer}*/
        this.renderer = new THREE.WebGLRenderer(parameters);
        this.rendererParameters = parameters

        this.renderer.setSize(parameters.sizeWidth, parameters.sizeHeight);
        this.renderer.setPixelRatio(project?.pixelRatio ?? window.devicePixelRatio);
        this.renderer.autoClear = parameters?.autoClear ?? true
        this.renderer.shadowMap.enabled = project?.shadowMap?.enabled ?? true
        this.renderer.shadowMap.type = project?.shadowMap?.type ?? THREE.PCFShadowMap;
        this.renderer.toneMapping = project?.toneMapping ?? THREE.NoToneMapping ;
        this.renderer.toneMappingExposure = project?.toneMappingExposure ?? 1;
        this.renderer.sortObjects = project?.sortObjects ??  false;

        return this.renderer;
    }



    /**
     * ```
     * setCameraPerspective ( {
     *      position: Vector3(),
     * } )
     *
     * ```
     * @return {void | THREE.Camera | THREE.PerspectiveCamera} */
    setCameraPerspective(params = {}){

        for (const [name, param] of Object.entries(params)) {
            if (this.cameraPerspective[name] === undefined)
                this.cameraPerspective[name] = param
        }

        return this.setCamera(this.cameraPerspective)
    }



    /** @return {void | THREE.Camera | THREE.PerspectiveCamera} */
    setCamera (/**@type {THREE.Camera | THREE.PerspectiveCamera} */ camera) {
        if (!(camera instanceof THREE.Camera)) return console.warn(`Error setCamera (camera). parameter not is "THREE.Camera" instance`)

        if (camera !== this.camera) {
            this.camera = camera;
            camera.updateMatrixWorld()
        }

        return this.camera
    }

    setupJSON({scene, camera, environment, history, metadata, project, scripts}) {
       this.createWebGLRenderer({...{
                alpha: true,
            }, ...project})

        this.setScene((scene?.isObject3D && scene instanceof THREE.Scene) ? scene : this.loader.parse(scene))

        this.cameraPerspective = this.loader.parse(camera)
        this.setCamera(this.cameraPerspective)

        this.environment = this.loader.parse(environment)

        this.updateCache()

        this.state.loaded =  (new Date).getTime()
        this.state.updated =  (new Date).getTime()

        this.render()
    }

    setScene (/**@type {THREE.Scene} */ scene, instance = null ) {

        if (!scene?.name || scene.name.trim().length < 2) throw new Error(`Scene Object not have key name`);
        
        if (!(scene instanceof THREE.Scene))
            return console.warn(`Error setScene (scene). parameter not is "THREE.Scene" instance`)


        // if (this.scene && this.scene?.name === scene.name )
        //     return console.warn(`Scene object "${scene.name}" is already active `)
        // // TODO add init|wake-load
        // if (this.sceneKeeper.scenes.has(scene.name)) {
        //     this.sceneKeeper.scenes.get(scene.name),scene = scene;
        //     console.warn(`Scene "${scene.name}" is registered, overwriten!`)
        // } else {
        //     this.sceneKeeper.setScene(scene.name, scene )
        // }
        // this.sceneKeeper.setScene(scene.name, scene, instance)
        // if (instance) this.sceneKeeper.scenes.get(scene.name),instance = instance;

        if (!instance) console.warn(`scene "${scene.name}" instance is empty`)

        this.sceneKeeper.setScene(scene.name, scene, instance)
        this.sceneKeeper.activeSceneId = scene.name
        
        this.scene = scene

        this.cachedObjects = new Set()
        this.updateCache()

        return this.scene
    }


    getScene (name) { 
        if (name)
            return this.sceneKeeper.getScene(name)
        else
            return this.scene
    }
    getInstance (name) { 
        if (name) 
            return this.sceneKeeper.getInstance(name)
        else
            return this.sceneKeeper.getInstance(this.scene.name)
    }
    /** @return {AnimationLoop} */ 
    get animationLoop () {
        return this.loopKeeper.animation
    }





    _recursiveScan(object3d) {
        if (!(object3d instanceof THREE.Object3D)) return;

        if (object3d.children.length) {
            object3d.children.forEach(child => {
                if (child.uuid === object3d.uuid) return;

                child.parentId = object3d.id
                this._recursiveScan(child)
            })
        }

        this.cachedObjects.add(object3d)
    }

    updateCache() {
        this.cachedObjects.clear()
        this._recursiveScan(this.camera)
        this._recursiveScan(this.scene)
    }

    update () {
        if (!this.renderer || !this.scene || !this.camera) return;
        this.render()
    }

    render () {
        this.renderer.render(this.scene, this.camera)
    }





    append (targetObject3D) {
        this.appendTo(targetObject3D, this.scene);
    }


    /**
     *
     * @param targetObject3D {THREE.Object3D}
     * @param parentObject3D {THREE.Object3D|THREE.Scene}
     */
    appendTo (targetObject3D, parentObject3D) {

        if (!parentObject3D?.isObject3D || !targetObject3D?.isObject3D)
            return console.warn(`Parameters is not types of Object3D. Deprecated append to root`)

        if (parentObject3D.children.includes(targetObject3D))
            return console.warn(`Parent Object3D is consists the target Object3D`)


        parentObject3D.add(targetObject3D)

        targetObject3D.parentId = parentObject3D.id

        targetObject3D.isHidden = false

        this.updateCache()

        this.state.updated = (new Date).getTime()
    }

    replaceObject (targetObject3D, parentObject3D) {

        targetObject3D.removeFromParent()

        parentObject3D.add(targetObject3D)

        targetObject3D.parentId = parentObject3D.id

        this.updateCache();

        this.state.updated =  (new Date).getTime()
    }


    lastSelectedTargetObject3D = null;
    setTarget(object) {
        this.lastSelectedTargetObject3D = object
        this.state.selectedTargetId = object.id
    }
    clearTarget() {
        this.lastSelectedTargetObject3D = null
        this.state.selectedTargetId = null
    }


    clear() {
        this.clearTarget()
        this.cachedObjects.clear()
    }


    cloneObject(object) {
        if (this.lastSelectedTargetObject3D === object)
            this.clearTarget()

        object.children.forEach(ch => { if(ch.isHidden) ch.removeFromParent() })

        return object.clone()
    }

    removeObject(obj) {
        if (!obj) return;

        if (obj.parent) {
            obj.parent.remove(obj);
            obj.removeFromParent()
        }

        obj.traverse(child => {
            if (child.geometry) child.geometry.dispose();

            if (child.material) {

                if (Array.isArray(child.material)) {

                    child.material.forEach(m => this.disposeMaterial(m));

                } else {

                    this.disposeMaterial(child.material);

                }

            }
        });
    }

    disposeMaterial(material) {
        for (let k in material) {
            const v = material[k];
            if (v && v.isTexture) v.dispose();
        }
        material.dispose();
    }

    attach(root) {
        if (root) this.root = root;

        this.root.textContent = ''
        this.root.appendChild( this.renderer.domElement );
    }
    detach() {
        this.root.textContent = ''
        this.root.removeChild( this.renderer.domElement );
    }


    toJSON() {
        this.updateCache()
        return {
            scene: this.scene?.toJSON?.(),
            camera: this.camera?.toJSON?.(),
            environment: this.environment?.toJSON?.(),
            history: this.history?.toJSON?.(),
            metadata: this.metadata?.toJSON?.(),
            project: this.project?.toJSON?.(),
            scripts: this.scripts?.toJSON?.(),
        }
    }


    /**
     * bypasses all cached objects. not an alternative for
     * this.scene.traverse( cb ) or this.scene.traverseVisible( cb )
     *
     * @param cb
     */
    each(cb) {this.cachedObjects.forEach(node => cb(node))}

    /**
     * ```
     *
     * ```
     * @param cb
     * @return {*}
     */
    find(cb) {return [...this.cachedObjects].find(node => cb(node))}

    findBy(propertyName, propertyValue) {
        if (propertyName.startsWith("userData.")) {

        }
        return this.find(item => item[propertyName] === propertyValue
    )}
}
