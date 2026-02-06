import {ReaComponent} from "engine/ReaComponent.js";
import {Doom} from "engine/utils/Doom.js";


const CSS = `
@layer page {

    @scope(#MenuComponent) {
 		
 		[data-id=menulist]{
			margin: 10px 20px;
 		}

        [data-id=menulist] > div {
        	cursor: pointer;

            padding: 5px;
            background: #233743;
        	margin-bottom: 2px;
        }

        [data-id=menulist] > div:hover {
        	color: #80cf30;
            background: #1c2428;
        }

    }

}
`;

const HTML = `
div.absolute.top.fill
  h2.center: "M33 THREEJS Examples"
  div[data-id=menulist][onclick=@goto]
`;


export class MenuComponent extends ReaComponent {

    create() {

        super.create({
            template: HTML,
            css: CSS,
            state: {
            	goto: (e, t) => {
            		const compoName = e.srcElement.dataset?.id

            		if (this.register.components.has(compoName)) {
            			this.currentCompo = compoName
						this.unmount()
						this.register.components.get(compoName).mount()
						location.hash = compoName
            		}
            	}
            },
            parent: this.register.rootScreenElement,
        });


		window.history.pushState({title: document.title, uri: document.baseURI}, document.title, document.baseURI);

        window.onpopstate = (event) => {

            if (event.state && this.currentCompo) {
				this.register.components.get(this.currentCompo).unmount()
				this.mount()
            }
        };

    }

    onMount () {

    	this.elements['menulist'].textContent = ''

    	this.register.components.getArchive().forEach(compo => {
        	if (compo.props.menu) {
        		
        		const item = Doom.create('div', {'data-id': compo.name}, compo.props?.title ?? compo.name)
        		
        		this.elements['menulist'].appendChild(item)
        	}

    	})

    }

}



