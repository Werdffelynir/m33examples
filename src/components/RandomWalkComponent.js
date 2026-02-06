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

    @scope(#RandomWalkComponent) {
        
    }

}
`;

const HTML = `
div.absolute.top
  h3.bold: "Labyrinth DFS Classic"
`;

export class RandomWalkComponent extends ReaComponent {

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




		function drunkWalk(w, h, steps = 500) {
		  const map = Array.from({length:h},()=>Array(w).fill(1));

		  let x = Math.floor(w/2);
		  let y = Math.floor(h/2);

		  for (let i=0; i<steps; i++) {
		    map[y][x] = 0;

		    const dir = Math.floor(Math.random()*4);
		    if (dir === 0 && x>1) x--;
		    if (dir === 1 && x<w-1) x++;
		    if (dir === 2 && y>1) y--;
		    if (dir === 3 && y<h-1) y++;
		  }

		  return map;
		}

		const maze = drunkWalk(80,80)

		const drawRoom = (gfx, x, y, cell, size = 10) => {
		    if (cell) {
		        gfx.rect(x * size, y * size, size, size, 'black');
		    } else {
		        gfx.rect(x * size, y * size, size, size, 'red');
		    }
		}

		draw((/**@type {CanvasRenderingContext2D} */ ctx, /**@type {Graphic} */ gfx) => {

		    for (let y = 0; y < maze.length; y++) {
		        const yCells = maze[y];
		        for (let x = 0; x < yCells.length; x++) {
		            const cell = yCells[x];
		            drawRoom(gfx, x, y, cell)
		        }
		    }

		})


		return layer
    }


}



