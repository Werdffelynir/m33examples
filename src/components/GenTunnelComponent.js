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

import * as BuildUtil from "../systems/Builders/BuildUtil.js";
import {SPControl} from "../modules/SPControl.js";



const CSS = `
@layer page {

    @scope(#ExtrudeTunelComponent) {
        
    }

}
`;

const HTML = `
div.absolute.top: ""
`;

export class GenTunnelComponent extends ReaComponent {

    create() {
        super.create({
            template: HTML,
            css: CSS,
            state: {
            	firstPerson: false,
            },
            parent: this.register.rootScreenElement,
        });
        // 
        // this.onState('firstPerson')
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
		let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 250);
		let renderer = new THREE.WebGLRenderer({antialias: false});
		renderer.setSize(innerWidth, innerHeight);
		renderer.setClearColor(0x404040);

		this.scene = scene
		this.camera = camera
		this.renderer = renderer

        // const lightAmb = new THREE.AmbientLight('#f1e9fc', 2)
        // scene.add(lightAmb)

        const lightHem = new THREE.HemisphereLight('#f1e9fc', '#000000', 2)
        lightHem.position.set(0,5,0)
        scene.add(lightHem)

        // const lightDir = new THREE.DirectionalLight('#b691e9', 4)
        // lightDir.position.set(3, 5, 8)
        // scene.add(lightDir)

        // scene.add(new THREE.GridHelper(10))

        // const darknessColor = 0xcccccc
        // scene.background = darknessColor
        // scene.fog = new THREE.FogExp2( darknessColor, 0.012 );

	    camera.position.set(0, 0, 25);
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.addEventListener('change', (e) => {
			renderer.render(scene, camera);
		})
		// controls.listenToKeyEvents(window); 
		// controls.enableKeys = true;
		// controls.keyPanSpeed = 100.0;
		// controls.keys = { LEFT: "KeyA",  UP: "KeyW", RIGHT: "KeyD",DOWN: "KeyS"};
		// controls.screenSpacePanning = false;  
		// controls.target = camera.position.clone().add(new THREE.Vector3(0, 0,-5))
		// controls.update();
		// renderer.setAnimationLoop( _ => { renderer.render(scene, camera) })
		// this.tunnel(renderer, scene, camera)

		this.drawPoint(renderer, scene, camera)

		renderer.render(scene, camera);
		return renderer;
    }

    drawPoint (renderer, scene, camera) {
		const pts = [
		  new THREE.Vector3(0,0,0),
		  new THREE.Vector3(2,0,1),
		  new THREE.Vector3(-1,0,2),
		]

		const geo = new THREE.BufferGeometry().setFromPoints(pts)
		const mat = new THREE.PointsMaterial({ size: 0.1, color: 0xff0000 })

		const points = new THREE.Points(geo, mat)
		scene.add(points)
    }
	// /var/app/m33examples/src/resources/textures/floorBoard_S_Diffuse.jpg
	// /var/app/m33examples/src/resources/textures/floorBoard_S_Normal.jpg
	// /var/app/m33examples/src/resources/textures/retro/BRICK_4A.PNG
	// /var/app/m33examples/src/resources/textures/retro/PAPER_1B.PNG
	// /var/app/m33examples/src/resources/textures/retro/PAPER_1F.PNG
	// /var/app/m33examples/src/resources/textures/retro/SAND_1A.PNG
	// /var/app/m33examples/src/resources/textures/retro/STEEL_1A.PNG
	// /var/app/m33examples/src/resources/textures/retro/TILE_1A.PNG
	// /var/app/m33examples/src/resources/textures/retro/WARN_1A.PNG
	// /var/app/m33examples/src/resources/textures/retro/WOOD_1C.PNG

	tunnel(renderer, scene, camera) {
		const loadMan = new THREE.LoadingManager();
		const loader = new THREE.TextureLoader(loadMan);
		const texture = loader.load( 'src/resources/textures/retro/BRICK_4A.PNG' );
		// const textureNormal = loader.load( 'src/resources/textures/floorBoard_S_Normal.jpg' );
		loadMan.onLoad = () => {
			renderer.render(scene, camera);
		}

		texture.colorSpace = THREE.SRGBColorSpace;
		texture.wrapS = THREE.RepeatWrapping
		texture.wrapT = THREE.RepeatWrapping
		texture.repeat = new THREE.Vector2(1, 1)
		// texture.needsUpdate = true

		const mat = new THREE.MeshStandardMaterial( {
			// color: '#7d8b14',
			side: THREE.DoubleSide,
			map: texture,
			// normalMap: textureNormal,
			// emissive: 0xffffff,
			// emissiveIntensity: 0.015,
			// wireframe: true,
			// flatShading: true 
		} );
		this.standardMat = mat
		const basicMat = new THREE.MeshBasicMaterial( {
			color: '#3379a1',
			side: THREE.DoubleSide,
			wireframe: false,
		} );
		this.basicMat = basicMat

		const pointsPath = {
			p: [0,0,0,-8,6,-8,8,-6,6,-4,3,-4],
			curve: [0,0,0,-9,1,-10,7,-10,8,-9,12,-10,15,-9,15,-6,14,-4,12,-3,9,-3],
			cubic: [0,-2,0,-8,-10,-8,-10,-13,-4,-13,-4,-19,10,-19,10,-9,5,-9,5,-14,2,-14],
			cubic2: [0,0,0,-5,-5,-5,-5,-10,-2,-10,-2,-8,2,-8,2,-11,5,-11,5,-9,4,-9,4,-6,2,-6,2,-3],
			cubic3: [-5,-5,-3,-5,-3,-10,-8,-10,-8,-14,8,-14,8,-10,3,-10,3,-5,5,-5,5,-3,10,-3,10,-8,14,-8,14,3,5,3,5,5,-5,5,-5,3,-10,3,-10,-3,-5,-3],
			omega: [0,0,0,-5,-5,-5,-5,-10,5,-10,5,-5,2,-5,2,0]  ,
			wave: [0,-2,0,-8,-10,-8,-10,-13,-4,-13,-4,-19,10,-19,10,-9,5,-9,5,-14,2,-14],
			a: [0,0,0,-5,5,-5,5,-10, 0,-10],
			b: [0,0,0,-5,-5,-5,-5,-8,-2,-8,-2,-12,4,-12],
			c: [0,0,0,-5,-5,-5,-5,-8,-2,-8,-2,-12,9,-12,9,-9,2,-9,2,-7,6,-7,6,0],
			d: [0,0,0,-10,5,-10,5,-5,10,-5,10,-15,-5,-15,-5,-5],
			round: [
				0,0,-3,-1,-5,-3,-6,-6,-6,-9,-5,-12,-3,-14,0,-15,3,-15,6,-14,8,-12,9,-9,9,-6,8,-3,6,-1,3,0,
				0,0,-3,-1,-5,-3,-6,-6,-6,-9,-5,-12,-3,-14,0,-15,3,-15,6,-14,8,-12,9,-9,9,-6,8,-3,6,-1,3,0,
				0,0,-3,-1,-5,-3,-6,-6,-6,-9,-5,-12,-3,-14,0,-15,3,-15,6,-14,8,-12,9,-9,9,-6,8,-3,6,-1,3,0,
			],
		}
		const f1 = this.addFigure1()
		// f1.scale.set(0.4, 0.4, 0.4)
		// f1.position.set(-15, 0, -5)



		return;
	}

	addFigure1 () {


	}



}











		// const tunnelGeo = BuildUtil.catacombs(pointsPath.round, 1, 1)
		// const tunnelMesh = new THREE.Mesh(tunnelGeo, mat);
		// scene.add(tunnelMesh);

		// const rounded = pointsPath.round
		// const snakePath = []
		// let x = 0, z = 0; 
		// for (var i = 1; i < 12; i++) {
		// 	if (i % 2 === 0) x = x > 0 ? -Ut.random(3, 5, true) : Ut.random(3, 5, true)
		// 	else z -= Ut.random(3, 5, true)
		// 	snakePath.push(new THREE.Vector3(x, 0, z))
		// }

		// const tunnelGeo2 = BuildUtil.geometryLines({points: pointsPath.curve, width: 1, height: 1})
		// const tunnelMesh2 = new THREE.Mesh(tunnelGeo2, mat);
		// tunnelMesh2.scale.set(15, 15, 15)
		// tunnelMesh2.position.setY(-10)
		// scene.add(tunnelMesh2);

		//cataGeo.rotateX(-Math.PI / 2)
		//console.log()
		//mat.wireframe = true;


        // let upper = 0
        // pointsPath.round.forEach((p, i) => { if (i > 2) p.y = upper-= 0.3})

		// const cataGeo = BuildUtil.geometryLines({points: pointsPath.round, width:1, height:1})
		
		// cataGeo.scale(1, 1, 1)
		// mat.side = THREE.DoubleSide

		// const cataMesh = new THREE.Mesh(cataGeo, mat)
		// const cata = new THREE.Group()
		// cata.position.setX(-10)
		// cata.position.setY(5)

		// cata.add(cataMesh)
		// scene.add(cata)


		// const builder = new VentilationCorridorBuilder(points, 1, 2)
		// const geometry = builder.build()
		// const mesh = new THREE.Mesh(geometry, material)
		// scene.add(mesh)
		// const tube = new THREE.Mesh( tubeGeo, material );
		// const ceiling = floor.clone()



/*



        if (!this.state.firstPerson) {
			const controls = new OrbitControls(camera, renderer.domElement);
			controls.addEventListener('change', (e) => {
				renderer.render(scene, camera);
			})
			controls.listenToKeyEvents(window); 
			controls.enableKeys = true;
			controls.keyPanSpeed = 100.0;
			controls.keys = {
			    LEFT: "KeyA",
			    UP: "KeyW",
			    RIGHT: "KeyD",
			    DOWN: "KeyS"
			};
			controls.screenSpacePanning = false;  
			controls.target = camera.position.clone().add(new THREE.Vector3(0, 0,-5))
			controls.update();
        } else {
			const keyman = this.register.inputs.keyboardManager
			const control = new SPControl({
				renderer: renderer,
				scene: scene,
				camera: camera,
				inputs: this.register.inputs.keyboardManager.keys,
				moveSpeed: 1.5,
				turnSpeed: 1.2,
				enabledMouse: false,
			})

			scene.add(control.player)

			// First Person View. In constructor need set enabledMouse = true
			camera.position.set(0,1.5,2)
			control.player.getObjectByName("face").add(camera)

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
        }


*/



		// mat.transparent  = true;
		// mat.opacity  = 0.5;
		// // mat.wireframe = true;
		// // mat.side = THREE.DoubleSide;
		// const corridorGeo = blindTunnel(BuildUtil.arrayToPoints(pointsArr), 1, 1)
		// corridorGeo.scale(5,5,5)
		// const corridorMesh = new THREE.Mesh(corridorGeo, mat)
		// scene.add(corridorMesh)



		// const cataGol = BuildUtil.catacombLine(pointsArr, 2, 2)
		// // console.log("played: ", pointsGeo)
		// // geo.rotateX(-Math.PI / 2)
		// // mat.wireframe = true;
		// mat.side = THREE.DoubleSide
		// const mesh = new THREE.Mesh(cataGol, mat)
		// scene.add(mesh)


		// for (var i = 0; i < cataGol.userData.points.length; i++) {
		// 	const p = cataGol.userData.points[i]
		// 	console.log(p)
		// 	const tubeGeo = new THREE.BoxGeometry(1, 1, 1)

		// 	const tube = new THREE.Mesh( tubeGeo, mat );
		// 	tube.position.copy(p)
		// 	scene.add(tube)
		// }











// const shape = new THREE.Shape()
// shape.moveTo(0, 0)
// shape.lineTo(5, 0)
// shape.lineTo(5, 3)
// shape.lineTo(0, 3)
// shape.lineTo(0, 0)
// const geo = new THREE.ExtrudeGeometry(shape, {
//   depth: 1,
//   bevelEnabled: false
// })
// geo.rotateX(-Math.PI / 2)
// const mesh = new THREE.Mesh(geo, mat)
// scene.add(mesh)

		// const path = [
		//     new THREE.Vector3(0, 0, 0),
		//     new THREE.Vector3(0, 0, -10),
		//     new THREE.Vector3(5, 0, -20),
		//     new THREE.Vector3(5, 2, -30)
		// ];
		// const path2 = [new THREE.Vector3(0, 0, 0)]
		// let x = 0, y = 0, z = 0
		// for (var i = 1; i < 12; i++) {
		// 	if (i % 2 === 0) {
		// 		x = x > 0 ? -Ut.random(3, 5, true) : Ut.random(3, 5, true)
		// 	} else {
		// 		z -= Ut.random(3, 5, true)
		// 	}
		// 	path2.push(new THREE.Vector3(x, 0, z))
		// 	console.log(x, 0, z)
		// }
		// const path1 = BuildUtil.arrayToPoints(
		// 	[0,0,0,-8,6,-8,8,-6,6,-4,3,-4]
		// 	// [0,0,0,-5,-5,-5,-5,-10,-2,-10,-2,-8,2,-8,2,-11,5,-11,5,-9,4,-9,4,-6,2,-6,2,-3]
		// )
		// const generator = new VentilationBuilder({
		// 	width: 1,
		// 	height: 1,
		// });
		// const geometry = generator.build( BuildUtil.arrayToPoints( 
//[0,0,0,-5,-1,-7,-1,-10,0,-12,2,-13,5,-13,7,-12,8,-10,8,-7,7,-5,7,-3]) );
		// // console.log(tunnelMesh)
		// const geometry = BuildUtil.geometryLines({
		// 	points: [0,0,0,-5,-1,-7,-1,-10,0,-12,2,-13,5,-13,7,-12,8,-10,8,-7,7,-5,7,-3],
		// 	width: 1,
		// 	height: 1,
		// })
		// const tunnelMesh = new THREE.Mesh(geometry, mat);
		// tunnelMesh.scale.set(2, 2, 2)
		// scene.add(tunnelMesh);


		// const points = []
		// for (var i = 0; i < pointsArr.length; i += 4) {
		// 	const v3from = new THREE.Vector3(pointsArr[i], 0, pointsArr[i+1])
		// 	const v3to = new THREE.Vector3(pointsArr[i+2], 0, pointsArr[i+3])
		// 	// points.push(v3)

		// 	const path = new THREE.Path();
		// 	path.lineTo( v3from.x, v3from.z );
		// 	path.lineTo( v3to.x, v3to.z );

		// 	const tubeGeo = new THREE.TubeGeometry(path, 4, 2, 8, true)

		// 	const tube = new THREE.Mesh( tubeGeo, material );
		// 	scene.add( tube );
		// }
		// console.log(points)

