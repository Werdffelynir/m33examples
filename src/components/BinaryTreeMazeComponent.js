import {ReaComponent} from "engine/ReaComponent.js";
import {EventBus} from "engine/EventBus.js";
import {Ut} from "engine/Ut.js";
import {LayerManager} from "engine/LayerManager.js";
import {loadScene, loadTexture, canvasTexture} from "engine/web3d/Ut3D.js";
import {Graphic} from "engine/canvas2d/Graphic.js";
import {Temporary} from "engine/utils/Temporary.js";
import {Noise} from "engine/utils/Noise.js";


const CSS = `
@layer page {

    @scope(#BinaryTreeMazeComponent) {
        
    }

}
`;

const HTML = `
div.absolute.top
  h3.bold: "Binary Tree Maze"
`;

export class BinaryTreeMazeComponent extends ReaComponent {

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
		this.layer = this.createRender ()

        this.layer.attach()
    }

    onUnmount () {
    	this.layer.detach()
    }

    createRender () {

        const layer = new LayerManager({})

        layer.configured({
            parent: this.register.rootScreenElement,
            width: window.innerWidth,
            height: window.innerHeight,
        })

        const layUI = layer.get('ui')
        const layGame = layer.get('game')

        layUI.setGraphic()
        layGame.setGraphic(layUI.gfx)

        const draw = (cb) => { cb(layGame.ctx, layGame.gfx) }




		function binaryTreeMaze(w, h) {
			const maze = [];

			for (let y = 0; y < h; y++) {

				maze[y] = [];
				
				for (let x = 0; x < w; x++) {
					const north = y > 0;
					const east = x < w - 1;

					if (north && east) {
						maze[y][x] = Math.random() < 0.5 ? "N" : "E";
					} else if (north) {
						maze[y][x] = "N";
					} else if (east) {
						maze[y][x] = "E";
					}
				}
			}

			return maze;
		}



		const maze = binaryTreeMaze(20, 20)

		const drawRoom = (gfx, x, y, cell, size = 25) => {
			if (cell === "E") {
				gfx.rect(x*size, y*size, size * 0.1, size, 'red');
			}
			if (cell === "N") {
				gfx.rect(x*size, y*size, size, size * 0.1, 'red');
			}
		}

		draw((/**@type {CanvasRenderingContext2D} */ ctx, /**@type {Graphic} */ gfx) => {
			
			for (let y = 0; y < maze.length; y++) {
				
				const cells = maze[y];
				
				for (let x = 0; x < cells.length; x++) {
					const cell = cells[x];
					drawRoom(gfx, x, y, cell)
				}
			}
		})



		return layer
    }


}



