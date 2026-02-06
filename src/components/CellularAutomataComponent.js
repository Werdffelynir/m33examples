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

    @scope(#CellularAutomataComponent) {
        
    }

}
`;

const HTML = `
div.absolute.top: "Cellular Automata"
`;

export class CellularAutomataComponent extends ReaComponent {

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

		function generateCave(width, height, coefficient = 0.4, math = { random: Math.random }) {
		    let map = [];

		    // 1. Ініціалізація шумом
		    for (let y = 0; y < height; y++) {
		        map[y] = [];
		        for (let x = 0; x < width; x++) {
		            map[y][x] = math.random() < coefficient ? 1 : 0; // 1 = камінь, 0 = повітря
		        }
		    }

		    function neighbours(x, y) {
		        let n = 0;
		        for (let yy = -1; yy <= 1; yy++)
		            for (let xx = -1; xx <= 1; xx++) {
		                if (xx === 0 && yy === 0) continue;
		                const nx = x + xx, ny = y + yy;
		                if (nx < 0 || ny < 0 || nx >= width || ny >= height) n++;
		                else n += map[ny][nx];
		            }
		        return n;
		    }

		    // 2. 5 ітерацій еволюції
		    for (let iteration = 0; iteration < 5; iteration++) {
		        let newMap = JSON.parse(JSON.stringify(map));

		        for (let y = 0; y < height; y++) {
		            for (let x = 0; x < width; x++) {
		                const count = neighbours(x, y);
		                if (count > 4) newMap[y][x] = 1;
		                else if (count < 4) newMap[y][x] = 0;
		            }
		        }
		        map = newMap;
		    }

		    return map;
		}

		const maze = generateCave(50, 40, 0.4, {random: () => this.register.seed.random() })

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



