import * as THREE from 'three';
import Stats from 'stats.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
    MeshBVHVisualizer,
    MeshBVH,
    CONTAINED,
    INTERSECTED,
    NOT_INTERSECTED,
} from 'three-mesh-bvh';

let renderer, camera, scene, stats, controls, mesh
let outputContainer, group

init();
render();

function init() {

    outputContainer = document.getElementById( 'output' );

    const bgColor = new THREE.Color( 0x263238 );

    // renderer setup
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( bgColor, 1 );
    renderer.shadowMap.enabled = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild( renderer.domElement );

    // scene setup
    scene = new THREE.Scene();

    const light = new THREE.DirectionalLight( 0xffffff, 1 );
    light.castShadow = true;
    light.shadow.mapSize.set( 2048, 2048 );
    light.position.set( 10, 10, 10 );
    scene.add( light );
    scene.add( new THREE.AmbientLight( 0xb0bec5, 0.8 ) );

    // camera setup
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 50 );
    camera.position.set( 2, 4, 6 );
    camera.far = 100;
    camera.updateProjectionMatrix();
    scene.add( camera );

    // group for rotation
    group = new THREE.Group();
    scene.add( group );

    // base mesh
    mesh = new THREE.Mesh(
        new THREE.TorusKnotGeometry( 1.5, 0.5, 500, 60 ).toNonIndexed(),
        new THREE.MeshStandardMaterial( {
            polygonOffset: true,
            polygonOffsetFactor: 1,
        } )
    );
    group.add( mesh );

    console.log(new THREE.TorusKnotGeometry( 1.5, 0.5, 500, 60 ))
    console.log(new THREE.TorusKnotGeometry( 1.5, 0.5, 500, 60 ).toNonIndexed())


    // stats setup
    stats = new Stats();
    document.body.appendChild( stats.dom );

    // controls
    controls = new OrbitControls( camera, renderer.domElement );
    controls.minDistance = 3;
    // controls.touches.ONE = THREE.TOUCH.PAN;
    // controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
    // controls.touches.TWO = THREE.TOUCH.ROTATE;
    // controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
    // controls.enablePan = false;

}

function render() {

    stats.update()
    requestAnimationFrame( render )

    renderer.render( scene, camera )

}
