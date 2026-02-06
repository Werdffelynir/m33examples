import {ReaComponent} from "engine/ReaComponent.js";
import {EventBus} from "engine/EventBus.js";
import {Ut} from "engine/Ut.js";
import {loadScene, loadTexture} from "engine/web3d/Ut3D.js";

import * as THREE from "three";
import { GUI } from 'lil-gui';
import Stats from 'stats';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {ImprovedNoise} from 'three/addons/math/ImprovedNoise.js';
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {FBXLoader} from "three/addons/loaders/FBXLoader.js";
import {HDRLoader} from "three/addons/loaders/HDRLoader.js";


const CSS = `
@layer page {

    @scope(#ExtrudeHolesComponent) {
        
    }

}
`;

const HTML = `
div.absolute.top: ""
`;

export class ExtrudeHolesComponent extends ReaComponent {

    create() {
        this.bus = new EventBus()
        this.children = new Map()

        super.create({
            template: HTML,
            css: CSS,
            state: {
                structure: "View Structure"
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
		let scene = new THREE.Scene();
		let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 1000);

		camera.position.set(0, 20, 20);

		let renderer = new THREE.WebGLRenderer({antialias: false});
		renderer.setSize(innerWidth, innerHeight);
		renderer.setClearColor(0x404040);

		this.scene = scene
		this.camera = camera
		this.renderer = renderer


		let controls = new OrbitControls(camera, renderer.domElement);
		controls.addEventListener('change', (e) => {
			renderer.render(scene, camera);
		})
		this.controls = controls


        const lightHem = new THREE.HemisphereLight('#f1e9fc', '#000000', 2)
        lightHem.position.set(0,5,0)
        scene.add(lightHem)


        scene.add(new THREE.GridHelper(10))


        const gui = new GUI();

        gui.add( this.state, 'structure', [ 
            'Structure_B', 
            'Structure_C', 
            'Structure_D', 
            'Structure_E', 
            'Structure_F',
        ] ).onChange( value => {

            this.state.structure = value

            this.scene.traverse ( obj => {
                if (obj.isMesh)
                    obj.removeFromParent()

            })

            let shape;
            switch(value) {
                case 'Structure_B': shape = this.structure_B(); break;
                case 'Structure_C': shape = this.structure_C(); break;
                case 'Structure_D': shape = this.structure_D(); break;
                case 'Structure_E': shape = this.structure_E(); break;
                case 'Structure_F': shape = this.structure_F(); break;
            }
            scene.add(shape)
            this.update()
        })


        scene.add( this.structure_F() )

        this.update()


		return renderer;
    }


    update() {
		this.renderer.render(this.scene, this.camera);
    }


    createCurvePath (curvePath, pointsArr, x = 0, y = 0, scale = 1) {

        let points = [...pointsArr].map((n, i) => {
        	const scale = 4
        	const offsetX = -6
        	const offsetY = 6
        	return i % 2 === 0 ? n * scale + offsetX : n * scale + offsetY
        })

        let result = []

		let sp = points.splice(0, 2)

		curvePath.moveTo(sp[0], sp[1]);

		for (var i = points.length; i > 0; i -= 2) {

			sp = points.splice(0, 2)

			curvePath.lineTo( sp[0], sp[1] );
		}
    }


    structure_B () {

        const length = 12, width = 8;
        const shape = new THREE.Shape();

        shape.moveTo( 4,0 );
        shape.lineTo( -10,0 );
        shape.lineTo( -10,-10 );
        shape.lineTo( 0,-10 );
        shape.lineTo( 0,-5 );
        shape.lineTo( 4,-5 );
        shape.lineTo( 4,0 );

        const hole = new THREE.Path();
        hole.moveTo(4,-1);
        hole.lineTo(-9,-1);
        hole.lineTo(-9,-9);
        hole.lineTo(-1,-9);
        hole.lineTo(-1,-4);
        hole.lineTo(4,-4);
        shape.holes.push(hole)

        // const hole2 = new THREE.Path();
        // hole2.moveTo(-8,-8);
        // hole2.lineTo(-4,-8);
        // hole2.lineTo(-4,-4);
        // hole2.lineTo(-8,-4);
        // hole2.lineTo(-8,-8);
        // shape.holes.push(hole2)


        const options = {
            curveSegments: 12,      // Number of points on the curves.
            steps: 1,               // Number of points used for subdividing segments along the depth of the extruded spline.
            depth: 5,               // Depth to extrude the shape.
            bevelEnabled: false,    // Whether to beveling to the shape or not.
            bevelThickness: 0.2,    // How deep into the original shape the bevel goes.
            bevelSize: 0.1,         // Distance from the shape outline that the bevel extends.
            bevelOffset: 0,         // Distance from the shape outline that the bevel starts.
            bevelSegments: 4,       // Number of bevel layers.
            extrudePath: null,      // Curve. A 3D spline path along which the shape should be extruded. Bevels not supported for path extrusion.
        }
        const geometry = new THREE.ExtrudeGeometry( shape, options );
        geometry.rotateX( -(Math.PI / 2) )
        geometry.rotateY( Math.PI )

        const material = new THREE.MeshStandardMaterial( { color: 0x008800 } );
        material.side = THREE.DoubleSide
        // material.wireframe = true

        const mesh = new THREE.Mesh( geometry, material ) ;
        mesh.position.set(0, 0, 0)

        
        return mesh;
    }


    structure_C () {

        const shape = new THREE.Shape();
	    const egesPoints = [-11,0,-11,-7,-15,-7,-15,-14,4,-14,4,-3,1,-3,1,0,-11, 0];
	    this.createCurvePath(shape, egesPoints)


	    const holePoints = [-10,0,-10,-10,-11,-10,-11,-8,-14,-8,-14,-13,-6,-13,-6,-8,-5,-8,-5,-13,3,-13,3,-4,-5,-4,-5,-6,-6,-6,-6,-3,0,-3,0,-1,-6,-1,-6,0]
	    const hole = new THREE.Path();
	    this.createCurvePath(hole, holePoints)
		shape.holes.push(hole)


        const options = {
            curveSegments: 12,      // Number of points on the curves.
            steps: 1,               // Number of points used for subdividing segments along the depth of the extruded spline.
            depth: 5,               // Depth to extrude the shape.
            bevelEnabled: false,    // Whether to beveling to the shape or not.
            bevelThickness: 0.2,    // How deep into the original shape the bevel goes.
            bevelSize: 0.1,         // Distance from the shape outline that the bevel extends.
            bevelOffset: 0,         // Distance from the shape outline that the bevel starts.
            bevelSegments: 4,       // Number of bevel layers.
            extrudePath: null,      // Curve. A 3D spline path along which the shape should be extruded. Bevels not supported for path extrusion.
        }

        const geometry = new THREE.ExtrudeGeometry( shape, options );
        geometry.rotateX( -(Math.PI / 2) )
        geometry.rotateY( Math.PI )

        const material = new THREE.MeshStandardMaterial( { color: 0x008800 } );
        material.side = THREE.DoubleSide
        // material.wireframe = true

        const mesh = new THREE.Mesh( geometry, material ) ;
        mesh.position.set(0, 0, 0)

        
        return mesh;
    }


    structure_D () {
    	const tunnel = [-1,1,-1,-2,-7,-2,-7,-7,-3,-7,-3,-8,3,-8,3,-6,7,-6,7,-4,1,-4,1,-6,-1,-6,-1,-5,-5,-5,-5,-4,-1,-4,1,-2,1,1,-1,1];

    	const shape = new THREE.Shape()
    	const hole = new THREE.Path()

    	this.createCurvePath(hole, tunnel)

		shape.holes.push(hole)

	    const settings = {
		    steps: 10,
		    depth: 5,
		    bevelEnabled: false,
		    // extrudePath: curve // Використовуємо наш 3D шлях
		};
        const geometry = new THREE.ExtrudeGeometry( shape, settings );
        geometry.rotateX( -Math.PI * 1.5 )
        geometry.translate(0,5, -10)
        const material = new THREE.MeshStandardMaterial( { color: 0xd388b1 } );
        material.side = THREE.DoubleSide

        const mesh = new THREE.Mesh( geometry, material ) ;
        // mesh.position.set(0, 5, 0)
        // mesh.rotation.x =  -Math.PI * 1.5



        
        return mesh;
    }

    structure_E () {
        // 1. Створюємо основну форму стіни (прямокутник 10х5)
        const wallShape = new THREE.Shape();
        wallShape.moveTo(0, 0);
        wallShape.lineTo(10, 0);
        wallShape.lineTo(10, 5);
        wallShape.lineTo(0, 5);
        wallShape.closePath();

        // 2. Створюємо шлях для дверного отвору з аркою
        const doorPath = new THREE.Path();

        const doorWidth = 2;
        const doorHeightRect = 2; // висота прямої частини дверей
        const doorX = 4; // позиція дверей по горизонталі
        const doorRadius = doorWidth / 2; // радіус арки

        // Малюємо контур дверей (за годинниковою стрілкою для отвору)
        doorPath.moveTo(doorX, 0);
        doorPath.lineTo(doorX, doorHeightRect); // лівий косяк

        // Додаємо арку зверху
        // .absarc(x, y, radius, startAngle, endAngle, clockwise)
        doorPath.absarc(
            doorX + doorRadius,
            doorHeightRect,
            doorRadius,
            Math.PI, 0,
            true // малюємо верхню дугу
        );

        doorPath.lineTo(doorX + doorWidth, 0); // правий косяк
        doorPath.lineTo(doorX, 0); // закриваємо поріг

        // Додаємо отвір до стіни
        wallShape.holes.push(doorPath);

        // 3. Налаштування екструзії
        const extrudeSettings = {
            depth: 0.5,           // товщина стіни
            bevelEnabled: false,
            curveSegments: 12     // плавність арки
        };

        const geometry = new THREE.ExtrudeGeometry(wallShape, extrudeSettings);
        const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
        const wallMesh = new THREE.Mesh(geometry, material);

        wallMesh.position.x = -5

        return wallMesh


    }


    structure_F ( scale = 1 ) {

        const mainShape = new THREE.Shape();

        mainShape.moveTo(-10, 0);
        mainShape.lineTo(10, 0);
        mainShape.lineTo(10, 10);
        mainShape.lineTo(-10, 10);
        mainShape.lineTo(-10, 0);

        const hole1 = new THREE.Path();
        hole1.arc( 2, 2, 0.8)

        const hole2 = new THREE.Path();
        hole2.arc( 6, 6, 0.5)

        const hole3 = new THREE.Path();
        hole3.arc( 2, 8, 0.25)

        const hole4 = new THREE.Path();
        hole4.ellipse( -2, 2, 0.5, 1.5)

        const hole5 = new THREE.Path();
        hole5.absellipse( -4, 2, 0.5, 1.5)

        mainShape.holes.push(hole1);
        mainShape.holes.push(hole2);
        mainShape.holes.push(hole3);
        mainShape.holes.push(hole4);
        mainShape.holes.push(hole5);



        const holeLine = new THREE.Path();
        holeLine.moveTo(7,0);
        const poinsSource = [5,4,3,5,4,7,1,10,5,7,4,5,6,4,9,0]
        const poins = []
        for (var i = 0; i < poinsSource.length; i += 2) {
            poins.push(new THREE.Vector2(poinsSource[i], poinsSource[i+1]) )
        }
        holeLine.splineThru(poins); 
        holeLine.closePath() 
        mainShape.holes.push(holeLine);

        const holeBez = new THREE.Path();
        holeBez.moveTo(1, 5);
        holeBez.bezierCurveTo( -1, 8, -2, 5, -8, 5 )
        holeBez.closePath() 
        mainShape.holes.push(holeBez);

        const holeQuad = new THREE.Path();
        holeQuad.moveTo(1, 7);
        holeQuad.quadraticCurveTo( -1, 11, -8, 7 )
        holeQuad.closePath() 
        mainShape.holes.push(holeQuad);



        // Create the geometry

        const geometry = new THREE.ExtrudeGeometry(mainShape, {
          depth: 4,
          bevelEnabled: false
        })
        // const geometry = new THREE.ShapeGeometry(mainShape);

        const material = new THREE.MeshStandardMaterial({ 
            color: 0x008800, 
            side: THREE.DoubleSide, 
            // wireframe: true 
        });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.scale.set(scale,scale,scale)
        // mesh.rotateX( -(Math.PI/2) )

        return mesh
    }
}



