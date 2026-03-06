import {ReaComponent} from "m33/ReaComponent.js";
import {EventBus} from "m33/EventBus.js";
import {Ut} from "m33/Ut.js";
import {LayerManager} from "m33/LayerManager.js";
import {loadScene, loadTexture, canvasTexture} from "m33/web3d/Ut3D.js";
import {Graphic} from "m33/canvas2d/Graphic.js";
import {Temporary} from "m33/utils/Temporary.js";
import {Noise} from "m33/utils/Noise.js";


const CSS = `
@layer page {

    @scope(#SidewinderComponent) {
        
    }

}
`;

const HTML = `
div.absolute.top
  h3.bold: "Sidewinder Labyrinth"
`;

export class SidewinderComponent extends ReaComponent {

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




		function sidewinder(width, height) {
		    const maze = Array.from({length: height}, () =>
		        Array.from({length: width}, () => ({ north: 1, east: 1 }))
		    );

		    for (let y = 0; y < height; y++) {
		        let run = [];

		        for (let x = 0; x < width; x++) {
		            run.push(x);

		            const atEasternBoundary = x === width - 1;
		            const atNorthernBoundary = y === 0;

		            const carveEast = !atEasternBoundary && (atNorthernBoundary || Math.random() < 0.5);

		            if (carveEast) {
		                maze[y][x].east = 0;
		            } else {
		                const member = run[Math.floor(Math.random()*run.length)];
		                maze[y][member].north = 0;
		                run = [];
		            }
		        }
		    }

		    return maze;
		}


		const maze = sidewinder(10, 12)

		const drawRoom = (gfx, x, y, aroom, size = 30) => {
		    
		    if (aroom.east) {
		        gfx.rect(x*size, y*size, size * 0.1, size, 'red');
		    }
		    if (aroom.north) {
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



