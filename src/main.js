import {Register, STATUSES} from "m33/Register.js";
import {MenuComponent} from "./components/MenuComponent.js";
import {GenTerranQuadsComponent} from "./components/GenTerranQuadsComponent.js";
import {DefComponent} from "./components/DefComponent.js";
import {CellularAutomataComponent} from "./components/CellularAutomataComponent.js";
import {LabyrinthDFSClassicComponent} from "./components/LabyrinthDFSClassicComponent.js";
import {DummyDungeonRoomsComponent} from "./components/DummyDungeonRoomsComponent.js";
import {SceneBackgroundCanvasTextureComponent} from "./components/SceneBackgroundCanvasTextureComponent.js";
import {RandomWalkComponent} from "./components/RandomWalkComponent.js";
import {SidewinderComponent} from "./components/SidewinderComponent.js";
import {BinaryTreeMazeComponent} from "./components/BinaryTreeMazeComponent.js";
import {MirrorBranchComponent} from "./components/MirrorBranchComponent.js";
import {AddonTextSpriteComponent} from "./components/AddonTextSpriteComponent.js";
import {ExtrudeHolesComponent} from "./components/ExtrudeHolesComponent.js";
import {GenTerraBasicComponent} from "./components/GenTerraBasicComponent.js";
import {GenShapesComponent} from "./components/GenShapesComponent.js";
import {GenTunnelComponent} from "./components/GenTunnelComponent.js";


import {ControlPlayerSimple2Component} from "./components/ControlPlayerSimple2Component.js";
import {ControlPlayer4VariousComponent} from "./components/ControlPlayer4VariousComponent.js";
import {DirectionDistanceComponent} from "./components/DirectionDistanceComponent.js";
import {WaterAnimationComponent} from "./components/WaterAnimationComponent.js";
import {AnimationLoop} from "../m33/AnimationLoop.js";



//
// import {SimpleRaycastControlPlayerComponent} from "./components/SimpleRaycastControlPlayerComponent.js"; // todo
// import {SimpleControlPlayerComponent} from "./components/SimpleControlPlayerComponent.js"; // todo


const game = new Register({
    config: {
        fps: 20,
        width: window.innerWidth,
        height: window.innerHeight,
        preload: [],
        keymap: {
            forward: {pressed: false, codes: ['ArrowUp','KeyW'], callbacks: []},
            backward: {pressed: false, codes: ['ArrowDown','KeyS'], callbacks: []},
            up: {pressed: false, codes: ['ArrowUp','KeyW'], callbacks: []},
            down: {pressed: false, codes: ['ArrowDown','KeyS'], callbacks: []},
            left: {pressed: false, codes: ['ArrowLeft','KeyA'], callbacks: []},
            right: {pressed: false, codes: ['ArrowRight','KeyD'], callbacks: []},
            jump: {pressed: false, codes: ['Space'], callbacks: []},

            space: {pressed: false, codes: ['Space'], callbacks: []},
            shift: {pressed: false, codes: ['ShiftLeft'], callbacks: []},
            ctrl: {pressed: false, codes: ['CtrlLeft'], callbacks: []},
            alt: {pressed: false, codes: ['AltLeft'], callbacks: []},

            q: {pressed: false, codes: ['KeyQ'], callbacks: []},
            e: {pressed: false, codes: ['KeyE'], callbacks: []},
            f: {pressed: false, codes: ['KeyF'], callbacks: []},
            r: {pressed: false, codes: ['KeyR'], callbacks: []},

            dig1: {pressed: false, codes: ['Digit1',], callbacks: []},
            dig2: {pressed: false, codes: ['Digit2',], callbacks: []},
            dig3: {pressed: false, codes: ['Digit3',], callbacks: []},
        },
    },

    state: {},

    update: () => {

    },
})


game.userUpdates = new Set()
game.onUpdate = (cb) => { game.userUpdates.add(cb) }
game.looper = new AnimationLoop({
    update: (delta, iteration) => {
        game.userUpdates.forEach(cb => cb(delta, iteration))
        game.modules.each((mod) => {
            if (mod.updatable === true) mod.update(delta, iteration)
        })
    },
    fixedDelta: 1 / game.config.fps,
    timeScale: 1
});
// game.looper.start()




game.registerModules({
    
});

game.registerComponents({
    Menu: new MenuComponent(game),
    Def: new DefComponent(game, {menu: true, title: "I blank, await for example"}),

    CellularAutomata: new CellularAutomataComponent(game, {menu: true, title: "2D. Cellular Automata Dungeon generator(simple)"}),
    LabyrinthDFSClassic: new LabyrinthDFSClassicComponent(game, {menu: true, title: "2D. Classic Labyrinth DFS generator"}),
    DummyDungeonRooms: new DummyDungeonRoomsComponent(game, {menu: true, title: "2D. \"Dummy\" Dungeon Rooms generator (ROGUE Style)"}),
    RandomWalk: new RandomWalkComponent(game, {menu: true, title: "2D. Random Walk - Corridors generator"}),
    Sidewinder: new SidewinderComponent(game, {menu: true, title: "2D. Sidewinder - Maze generator. simple and fast algoritm"}),
    BinaryTreeMaze: new BinaryTreeMazeComponent(game, {menu: true, title: "2D. Binary Tree Maze. (max simpled)"}),
    MirrorBranch: new MirrorBranchComponent(game, {menu: true, title: "2D. Mirror Branch generator"}),
    AddonTextSprite: new AddonTextSpriteComponent(game, {menu: true, title: "TextSprite Component"}),
    SceneBackgroundCanvasTexture: new SceneBackgroundCanvasTextureComponent(game, {menu: true, title: "Sky alternative. Scene.background = CanvasTexture"}),
    ExtrudeHoles: new ExtrudeHolesComponent(game, {menu: true, title: "ExtrudeGeometry and Holes"}),GenTerraBasic: new GenTerraBasicComponent(game, {menu: true, title: "Gen. Basic Terran"}),
    GenTerranQuads: new GenTerranQuadsComponent(game, {menu: true, title: "Gen. Terran Quads by Segments (Noise BufferGeometry)"}),
    ExtrudeShapes: new GenShapesComponent(game, {menu: true, title: "Gen. Shapes  - ExtrudeGeometry"}),

    ControlPlayerSimple2: new ControlPlayerSimple2Component(game, {menu: true, title: "Control Player Simple 2. example"}),
    ControlPlayer4Various: new ControlPlayer4VariousComponent(game, {menu: true, title: "Control Player. 4 Various examples"}),

    GenTunnelBasic: new GenTunnelComponent(game, {menu: true, title: "TODO Gen. Tunnels, Vents - BufferGeometry (vertix, indexes, uv)"}),
    DirectionDistance: new DirectionDistanceComponent(game, {menu: true, title: "TODO Math. direction distance dot cross"}),

    WaterAnimationComponent: new WaterAnimationComponent(game, {menu: true, title: "Water Animation with one normals map"}),

    // SimpleRaycastControlPlayer: new SimpleRaycastControlPlayerComponent(game, {menu: true, title: "Simple example of Camera Control Player with Ground Raycaster"}),
});


await game.setup()


if (location.search.length > 1) {
    game.components.get(location.search.slice(1)).mount()
} else {
    game.components.get("Menu").mount()
}

