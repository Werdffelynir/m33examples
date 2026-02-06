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

    @scope(#MirrorBranchComponent) {
        
    }

}
`;

const HTML = `
div.absolute.top
  h3.bold: "Mirror Branch Generator"
`;

export class MirrorBranchComponent extends ReaComponent {

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




		function branchGenerator({x, y, length = 50, angle = 0, angleTurn = 0.4363323129985824, depth = 6, branches = [] } ) {
		    if (depth === 0) return branches;

		    const x2 = x + Math.cos(angle) * length;
		    const y2 = y + Math.sin(angle) * length;

		    branches.push({x1: x, y1: y, x2, y2});

		    branchGenerator({
		        x: x2, 
		        y: y2, 
		        length: length * 0.7, 
		        angle: angle - angleTurn, 
		        angleTurn: angleTurn, 
		        depth: depth - 1,
		        branches: branches,
		    });

		    branchGenerator({
		        x: x2, 
		        y: y2, 
		        length: length * 0.7, 
		        angle: angle + angleTurn, 
		        angleTurn: angleTurn, 
		        depth: depth - 1,
		        branches: branches,
		    });

		    return branches;
		}


		const branch = branchGenerator({
		    x: 400, 
		    y: 600, 
		    length: Ut.random(150, 200, true), 
		    angle: -90 * Math.PI / 180, 
		    angleTurn: 30 * Math.PI / 180, 
		    depth: Ut.random(4, 10, true),
		})

		// console.log(branch);

		layGame.gfx.mixContextParams({
		    lineCap: "round", // "round" | "butt" | "square"
		    lineJoin: "miter", // "round" | "bevel" | "miter"
		    lineWidth: 3,
		})

		const drawRoom = (gfx, line, size = 1) => {
		    gfx.line(line.x1, line.y1, line.x2, line.y2)
		    gfx.stroke()
		}

		draw((/**@type {CanvasRenderingContext2D} */ ctx, /**@type {Graphic} */ gfx) => {

		    for (let y = 0; y < branch.length; y++) {
		        const line = branch[y];
		        drawRoom(gfx, line)
		    }

		})




		return layer
    }


}



