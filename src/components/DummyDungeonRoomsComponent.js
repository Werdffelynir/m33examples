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

    @scope(#DummyDungeonRoomsComponent) {
        
    }

}
`;

const HTML = `
div.absolute.top
  h3.bold: "DummyDungeonRooms (ROGUE Style)"
`;

export class DummyDungeonRoomsComponent extends ReaComponent {

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



		function dungeonRooms(w, h, roomsCount = 8) {
		  const map = Array.from({length:h},()=>Array(w).fill(1));
		  const rooms = [];

		  // 1. кімнати
		  for (let i = 0; i < roomsCount; i++) {
		    const rw = 4 + Math.floor(Math.random()*6);
		    const rh = 4 + Math.floor(Math.random()*6);
		    const rx = Math.floor(Math.random()*(w-rw-2))+1;
		    const ry = Math.floor(Math.random()*(h-rh-2))+1;

		    rooms.push({x:rx,y:ry,w:rw,h:rh});

		    for (let y=ry; y<ry+rh; y++)
		      for (let x=rx; x<rx+rw; x++)
		        map[y][x] = 0;
		  }

		  // 2. коридори
		  for (let i = 1; i < rooms.length; i++) {
		    const r1 = rooms[i-1];
		    const r2 = rooms[i];

		    const x1 = r1.x + (r1.w/2 | 0);
		    const y1 = r1.y + (r1.h/2 | 0);
		    const x2 = r2.x + (r2.w/2 | 0);
		    const y2 = r2.y + (r2.h/2 | 0);

		    // горизонтальний
		    for (let x = Math.min(x1,x2); x <= Math.max(x1,x2); x++)
		      map[y1][x] = 0;

		    // вертикальний
		    for (let y = Math.min(y1,y2); y <= Math.max(y1,y2); y++)
		      map[y][x2] = 0;
		  }

		  return map;
		}




		const maze = dungeonRooms(50, 30)

		const drawRoom = (gfx, x, y, cell, size = 20) => {
		    if (cell) {
		        gfx.rect(x * size, y * size, size, size, 'black');
		    } else {
		        gfx.rect(x * size, y * size, size, size, 'red');
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



