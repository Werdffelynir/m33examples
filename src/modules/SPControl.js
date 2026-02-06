import {Module} from "../../m33/Module.js";
import * as THREE from "three";

/*

const keyman = this.register.inputs.keyboardManager
const control = new SPControl({
    renderer: renderer,
    scene: scene,
    camera: camera,
    inputs: keyman.keys,
    moveSpeed: 1.5,
    turnSpeed: 1.2,
    enabledMouse: false,
})

scene.add(control.player)

// First Person View. In constructor need set enabledMouse = true
// camera.position.set(0,1.5,2)
// control.player.getObjectByName("face").add(camera)

this.register.onUpdate((dt, i) => {
    control.update(dt)
    renderer.render(scene, camera);
})

keyman.onKeyJust("KeyV", () => {
    this.register.looper.togglePause()
    console.log("played: ", this.register.looper.played)
})
keyman.onKeyJust("KeyL", () => {
    console.log("Flashlight: ", control.player.enableFlashlight())
})
keyman.onKeyJust("KeyM", () => {
    console.log("Mark: ", control.player.enableMark())
})

*/
export class SPControl{

    constructor(params = {}) {
        this.enabled =  params?.enabled ?? true;
        this.enabledMouse =  params?.enabledMouse ?? true;

        this.limitDistanceSq = params?.limitDistanceSq ?? 10 * 10
        this.limitRotateSq = params?.limitRotateSq ?? Math.PI / 4
        this.moveSpeed = params?.moveSpeed ?? 1
        this.turnSpeed = params?.turnSpeed ?? 0.85


        this.renderer = params.renderer;
        this.scene = params.scene;
        this.camera = params.camera;
        this.inputs = params?.inputs ?? {
            forward: false,
            backward: false,
            up: false,
            down: false,
            left: false,
            right: false,
            jump: false,
            space: false,
            shift: false,
            ctrl: false,
            alt: false,
            q: false,
            e: false,
            f: false,
            r: false,
            dig1: false,
            dig2: false,
            dig3: false,
        };

        this.player = this.createCharacter({position: new THREE.Vector3(0, 1, 0)})
        this.head = this.player.getObjectByName("face")
        this.ctrl ()



        this.yaw = 0
        this.pitch = 0

        if (this.enabledMouse) {
            this.renderer.domElement.addEventListener('contextmenu', e => {
                if (e.buttons !== 2 || !this.enabledMouse) return
                e.preventDefault()
            })
            this.renderer.domElement.addEventListener('mouseup', e => {
                if (e.buttons !== 2 || !this.enabledMouse) return
                this.inputs.left = false;
                this.inputs.right = false;
            })
            this.renderer.domElement.addEventListener('mousemove', e => {
                if (e.buttons !== 2 || !this.enabledMouse) return
                this.yaw   -= e.movementX * 0.002
                this.pitch -= e.movementY * 0.002
                this.pitch = Math.max(-1, Math.min(1, this.pitch))

                this.player.rotation.y = this.yaw
                this.camera.rotation.x = this.pitch
            });
        }
    }



    ctrl () {
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
            moveDirection.applyQuaternion(this.player.quaternion).normalize()
            moveDirection.y = 0
            return moveDirection
        }



        let speed = this.moveSpeed

        this.update = ( dt => {

            // if (
            //     !this.inputs.forward &&
            //     !this.inputs.backward &&
            //     !this.inputs.r &&
            //     !this.inputs.f &&
            //     !this.inputs.up &&
            //     !this.inputs.down &&
            //     !this.inputs.left &&
            //     !this.inputs.right &&
            //     !this.inputs.jump &&
            //     !this.inputs.space &&
            //     !this.inputs.shift &&
            //     !this.inputs.ctrl
            //     ) return;

            
            // this.player.rotation.y = this.yaw
            // this.camera.rotation.x = this.pitch
            // if (this.inputs.left) this.yaw += this.turnSpeed * dt
            // if (this.inputs.right) this.yaw -= this.turnSpeed * dt
            if (this.inputs.left) this.player.rotation.y += this.turnSpeed * dt
            if (this.inputs.right) this.player.rotation.y -= this.turnSpeed * dt


            if (speed !== this.moveSpeed) speed = this.moveSpeed
            if (this.inputs.shift) speed *= 3



            if (this.inputs.forward) {
                this.player.position.addScaledVector(getPlayerDirection(), speed * dt)
            }
            if (this.inputs.backward) {
                this.player.position.addScaledVector(getPlayerDirection(), -speed * dt)
            }


            if (this.inputs.r) this.player.position.y += this.moveSpeed * dt
            if (this.inputs.f) this.player.position.y -= this.moveSpeed * dt


            // this.renderer.render(scene, camera);

        })

    }



    createCharacter ({position}) {
        const height = 2
        const character = new THREE.Group()
        const mat = new THREE.MeshBasicMaterial({color: new THREE.Color('#bbc37c')})
        character.name = 'player'

        const bodyGeo = new THREE.BoxGeometry(0.25, 2, 0.15)
        const body = new THREE.Mesh(bodyGeo, mat)
        body.name = 'body'



        const faceGeo = new THREE.BoxGeometry(0.5, 0.10, 0.2)
        const face = new THREE.Mesh(faceGeo, mat)
        face.name = 'face'
        face.position.y = 0.75
        face.position.z = -0.35


        const arr = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, -1),
            body.position.clone().add(new THREE.Vector3(0,0.5,0)),
            3,
            new THREE.Color('#c733dd'),
            0.1, 0.1, 0.25 )


        const markGeo = new THREE.RingGeometry( 1, 1.20, 24 );
        const markMat = new THREE.MeshBasicMaterial( { color: 0xffff00, side: THREE.DoubleSide } );
        const mark = new THREE.Mesh( markGeo, markMat );


        mark.name = 'mark'
        mark.rotation.x = -(Math.PI / 2)
        mark.visible = false


        const flashlight = this.createFlashlight()
        flashlight.visible = false
        flashlight.name = 'flashlight'
        flashlight.position.set(0, 1, 1)
        flashlight.target.position.set(1, -1, -10)
        character.add( flashlight )
        character.add( flashlight.target )

        character.add(body)
        character.add(face)
        character.add(mark)
        character.add(arr)

        character.enableMark = (on) => mark.visible = on ?? !mark.visible 
        character.enableFlashlight = (on) => flashlight.visible = on ??  !flashlight.visible 

        character.position.copy(position)
        // character.castShadow = true
        // character.receiveShadow = true
        // console.log(character)

        return character
    }


    createFlashlight () {
        const color = 0xe0f06f;
        const intensity = 5;        // Adjust as needed
        const distance = 100;       // Max distance the light reaches
        const angle = Math.PI / 4;  // Math.PI * 0.1 - Width of the light cone (e.g., 10 degrees)
        const penumbra = 0.5;       // Amount of soft edge
        const decay = 0.85

        return new THREE.SpotLight(color, intensity, distance, angle, penumbra, decay);
    }

}