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

    @scope(#LabyrinthDFSClassicComponent) {
        
    }

}
`;

const HTML = `
div.absolute.top
  h3.bold: "Labyrinth DFS Classic"
`;

export class LabyrinthDFSClassicComponent extends ReaComponent {

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



		function generateMaze(w, h, start = [0, 0]) {
		    const maze = Array.from({ length: h }, () =>
		        Array.from({ length: w }, () => ({ visited: false, walls: [1, 1, 1, 1] }))
		    );

		    const dirs = [
		        [-1, 0, 0, 2],  // left
		        [0, -1, 1, 3],  // up
		        [1, 0,  2, 0],  // right
		        [0, 1,  3, 1],  // down
		    ];

		    function carve(x, y) {
		        maze[y][x].visited = true;

		        dirs.sort(() => Math.random() - 0.5);

		        for (const [dx, dy, wallA, wallB] of dirs) {
		            const nx = x + dx;
		            const ny = y + dy;

		            if (ny >= 0 && ny < h && nx >= 0 && nx < w && !maze[ny][nx].visited) {
		                maze[y][x].walls[wallA] = 0;
		                maze[ny][nx].walls[wallB] = 0;
		                carve(nx, ny);
		            }
		        }
		    }

		    carve(start[0], start[1]);
		    return maze;
		}

		const maze = generateMaze(18, 8, [0, 0])

		const drawRoom = (gfx, x, y, aroom, size = 50) => {
		    const offsets = aroom.map((c, i) =>  c * 10)

		    gfx.rect(x*size, y*size, size, size, 'red');
		    gfx.rect(x*size+offsets[0], y*size+offsets[1], size-offsets[2]-offsets[0], size-offsets[3]-offsets[1], 'black');
		}

		draw((/**@type {CanvasRenderingContext2D} */ ctx, /**@type {Graphic} */ gfx) => {

		    for (let y = 0; y < maze.length; y++) {
		        const yRooms = maze[y];
		        for (let x = 0; x < yRooms.length; x++) {
		            const cell = yRooms[x];
		            drawRoom(gfx, x, y, cell.walls)
		        }
		    }
		    
		})


		return layer
    }


}



