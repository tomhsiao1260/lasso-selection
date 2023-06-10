import * as THREE from 'three';
import Stats from 'stats.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
    MeshBVHVisualizer,
    MeshBVH,
    CONTAINED,
    INTERSECTED,
    NOT_INTERSECTED,
} from 'three-mesh-bvh'

const params = {

    toolMode: 'lasso',
    selectionMode: 'intersection',
    liveUpdate: false,
    selectModel: false,
    wireframe: false,
    useBoundsTree: true,

    displayHelper: false,
    helperDepth: 10,
    rotate: true,

}

let renderer, camera, scene, gui, stats, controls, selectionShape, mesh, helper
let highlightMesh, highlightWireframeMesh, outputContainer, group
const selectionPoints = []
let dragging = false
let selectionShapeNeedsUpdate = false
let selectionNeedsUpdate = false

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

    // selection shape
    selectionShape = new THREE.Line();
    selectionShape.material.color.set( 0xff9800 ).convertSRGBToLinear();
    selectionShape.renderOrder = 1;
    selectionShape.position.z = - .2;
    selectionShape.depthTest = false;
    selectionShape.scale.setScalar( 1 );
    camera.add( selectionShape );

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
    )
    mesh.geometry.boundsTree = new MeshBVH( mesh.geometry )
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add( mesh )

    helper = new MeshBVHVisualizer( mesh, 10 )
    group.add( helper )

    // stats setup
    stats = new Stats();
    document.body.appendChild( stats.dom );

    // controls
    controls = new OrbitControls( camera, renderer.domElement );
    controls.minDistance = 3;
    controls.touches.ONE = THREE.TOUCH.PAN;
    controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
    controls.touches.TWO = THREE.TOUCH.ROTATE;
    controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
    controls.enablePan = false;

    // handle building lasso shape
    let startX = - Infinity;
    let startY = - Infinity;

    let prevX = - Infinity;
    let prevY = - Infinity;

    const tempVec0 = new THREE.Vector2();
    const tempVec1 = new THREE.Vector2();
    const tempVec2 = new THREE.Vector2();
    renderer.domElement.addEventListener( 'pointerdown', e => {

        prevX = e.clientX;
        prevY = e.clientY;
        startX = ( e.clientX / window.innerWidth ) * 2 - 1;
        startY = - ( ( e.clientY / window.innerHeight ) * 2 - 1 );
        selectionPoints.length = 0;
        dragging = true;

    } );

    renderer.domElement.addEventListener( 'pointerup', () => {

        dragging = false
        if ( selectionPoints.length ) { selectionNeedsUpdate = true }

    } )

    renderer.domElement.addEventListener( 'pointermove', e => {
        // If the left mouse button is not pressed
        if ( ( 1 & e.buttons ) === 0 ) { return }

        const ex = e.clientX;
        const ey = e.clientY;

        const nx = ( e.clientX / window.innerWidth ) * 2 - 1;
        const ny = - ( ( e.clientY / window.innerHeight ) * 2 - 1 );

        // set points for the corner of the box
        selectionPoints.length = 3 * 5;

        selectionPoints[ 0 ] = startX;
        selectionPoints[ 1 ] = startY;
        selectionPoints[ 2 ] = 0;

        selectionPoints[ 3 ] = nx;
        selectionPoints[ 4 ] = startY;
        selectionPoints[ 5 ] = 0;

        selectionPoints[ 6 ] = nx;
        selectionPoints[ 7 ] = ny;
        selectionPoints[ 8 ] = 0;

        selectionPoints[ 9 ] = startX;
        selectionPoints[ 10 ] = ny;
        selectionPoints[ 11 ] = 0;

        selectionPoints[ 12 ] = startX;
        selectionPoints[ 13 ] = startY;
        selectionPoints[ 14 ] = 0;

        if ( ex !== prevX || ey !== prevY ) { selectionShapeNeedsUpdate = true }

        prevX = ex
        prevY = ey
        selectionShape.visible = true;
        if ( params.liveUpdate ) { selectionNeedsUpdate = true }
    } )

    window.addEventListener( 'resize', function () {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );

    }, false );

}

function render() {

    stats.update()
    requestAnimationFrame( render )

    mesh.material.wireframe = params.wireframe
    helper.visible = params.displayHelper

    // Update the selection lasso lines
    if ( selectionShapeNeedsUpdate ) {

        selectionShape.geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute( selectionPoints, 3, false )
        )

        selectionShape.frustumCulled = false
        selectionShapeNeedsUpdate = false

    }

    const yScale = Math.tan( THREE.MathUtils.DEG2RAD * camera.fov / 2 ) * selectionShape.position.z;
    selectionShape.scale.set( - yScale * camera.aspect, - yScale, 1 );

    renderer.render( scene, camera )

}
