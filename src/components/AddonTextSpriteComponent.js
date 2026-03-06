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


const CSS = `
@layer page {

    @scope(#AddonTextSpriteComponent) {
        
    }

}
`;

const HTML = `
div.absolute.top: ""
`;

export class AddonTextSpriteComponent extends ReaComponent {

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
		let scene = new THREE.Scene();
		let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 1000);

		camera.position.set(0, 8, 13);

		let renderer = new THREE.WebGLRenderer({antialias: false});

		renderer.setSize(innerWidth, innerHeight);
		renderer.setClearColor(0x404040);


        const lightHem = new THREE.HemisphereLight('#f1e9fc', '#000000', 2)
        lightHem.position.set(0,5,0)
        scene.add(lightHem)

        const lightDir = new THREE.DirectionalLight('#b691e9', 4)
        lightDir.position.set(3, 5, 8)
        scene.add(lightDir)


        scene.add(new THREE.GridHelper(10))



		let controls = new OrbitControls(camera, renderer.domElement);
		controls.addEventListener('change', (e) => {
			renderer.render(scene, camera);
		})

		// renderer.setAnimationLoop( _ => {
		// 	renderer.render(scene, camera);
		// })

		function createObjs( count, color){
			let group = new THREE.Group()
		}
		function createPlane( step = 1, color = 0xff00ff){
			let geo = new THREE.PlaneGeometry(step, step, 25, 25)
			let mat = new THREE.MeshBasicMaterial({color: color});
			let mesh = new THREE.Mesh(geo, mat);
			return mesh;
		}
		let box_id = 0
		function createBox( size = 1, color = 0xffffff){
			let geo = new THREE.BoxGeometry(size, size, size)
			let mat =  new THREE.MeshBasicMaterial({color: color});
			let mesh = new THREE.Mesh(geo, mat);
			
	        const title = new TextSprite({text: `Box ${box_id}`,})

	        title.sprite.position.set(0, 3, 0)
        	mesh.add(title.sprite)
        
	        box_id ++;
			return mesh;
		}


		;[ createBox(2) , createBox(3) , createBox(1) ].forEach((b,i) => {
			b.position.set(i * 4 - 4, b.geometry.parameters.height/2, 0)
			scene.add(b)
		})



        const labelStart = new TextSprite({
            text: "Wellcome my friend!",
            width: 600,
        })

        labelStart.sprite.position.set(0, 5, -2)
        scene.add(labelStart.sprite)


		renderer.render(scene, camera);
		return renderer;
    }


}



   /**
    *
    * const textSprite = new TextSprite({
    *     width: 200,
    *     height: 50,
    *     font: '26px bold Play, sans, sans-serif',
    *     color: '#000000',
    *     bgColor: '#e3f946',
    *     align: 'left',
    *     offsetX: 10,
    *     offsetY: 25,
    *     text: "Dist: 0",
    * })
    * textSprite.sprite.position.set(0, 3, 0)
    *
    * scene.add(textSprite.sprite)
    *
    * textSprite.text("Replaced")
    **/
    class TextSprite {
        constructor({text = "TextSprite", width, height, font, color, bgColor, align, offsetX, offsetY }) {
            this._limit = 60
            this._timer = 0

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            this._text = text
            this._color = color ?? '#e3f946'
            this._bgColor = bgColor

            canvas.width = width ?? 256;
            canvas.height = height ?? 128;

            if (bgColor) {
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height)
            }

            ctx.font = font ?? '50px Play, sans, sans-serif, Arial';
            ctx.fillStyle = this._color;
            ctx.textAlign = align ?? 'center'; // "left" || "right" || "center" || "start" || "end";
            ctx.textBaseline = 'middle'; // "top" || "hanging" || "middle" || "alphabetic" || "ideographic" || "bottom";

            this.offsetX = offsetX ?? canvas.width / 2;
            this.offsetY = offsetY ?? canvas.height / 2;

            ctx.fillText(this._text, this.offsetX, this.offsetY);

            const texture = new THREE.CanvasTexture(canvas);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.colorSpace = THREE.SRGBColorSpace;

            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true
            });

            const sprite = new THREE.Sprite(material);
            sprite.scale.set(canvas.width / canvas.height, 1, 1);

            this.ctx = ctx
            this.texture = texture
            this.material = material
            this.sprite = sprite

        }
        copy() {
            return new TextSprite({
                text: this._text,
                width: this.ctx.canvas.width,
                height: this.ctx.canvas.height,
                font: this.ctx.font,
                color: this._color,
                bgColor: this._bgColor,
                align: this.ctx.textAlign,
                offsetX: this.offsetX,
                offsetY: this.offsetY
            })
        }
        text(text) {
            this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)

            if (this._bgColor) {
                this.ctx.fillStyle = this._bgColor;
                this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
            }

            this._text = text;
            this.ctx.fillStyle = this._color;
            this.ctx.fillText(text, this.offsetX, this.offsetY);
        }
        _update(dt = 0.16) {
            this._timer += dt
            if ( this._timer > this._limit ) {
                // ... ...
            }
        }
    }
