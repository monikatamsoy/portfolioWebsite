import * as THREE from './libs/three/three.module.js';
import { GLTFLoader } from './libs/three/jsm/GLTFLoader.js';
import { LoadingBar } from './libs/LoadingBar.js';
import { OrbitControls } from './libs/three/jsm/OrbitControls.js';
import { ARButton } from './libs/ARButton.js';
import { ControllerGestures } from './libs/ControllerGestures.js';
import { Stats } from './libs/stats.module.js';





class App {
    constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
		this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 10000 );
		this.camera.position.set( 0, 4, 8 );
        this.camera.lookAt(0,0,0)
        
		this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0x000000 );
        
		this.ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 4);
		this.scene.add(this.ambient);
        

        const light = new THREE.AmbientLight( 0x404040 ); // soft white light
        this.scene.add( light );
        
        const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
        this.scene.add( directionalLight );
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.physicallyCorrectLights = true;
        container.appendChild( this.renderer.domElement );
		
        this.mouse = new THREE.Vector2();
        this.mouse.x = this.mouse.y = -1;
        this.raycaster = new THREE.Raycaster();
        this.loadingBar = new LoadingBar();
        this.stats = new Stats();
        document.body.appendChild( this.stats.dom );
        
        this.origin = new THREE.Vector3();
        this.euler = new THREE.Euler();
        this.quaternion = new THREE.Quaternion();
        this.init();
        this.setupXR();
        
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        // this.controls.target.set(0, 0, 0);
        this.controls.maxDistance = 10;
        this.controls.minDistance = 5;
        this.controls.minPolarAngle = 1.3; // radians
        this.controls.maxPolarAngle = Math.PI/2; 
        this.controls.minAzimuthAngle = -Math.PI/9;
        this.controls.maxAzimuthAngle = Math.PI/9;


        // radians
        this.controls.update();

        
        window.addEventListener('resize', this.resize.bind(this) );
        // document.addEventListener("mousemove", this.onMouseMove, false)
        // document.addEventListener("wheel", this.onWheel.bind(this), false)
        // document.addEventListener("touchmove",this.handleMove.bind(this),false)
        // document.addEventListener("click", this.onMouseClick, false);
        window.addEventListener("keydown", this.onKeyDown.bind(this), false);

	}	

    resize(){
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }

    handleMove(e) {


        this.mouse.x = (e.changedTouches[0].clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.changedTouches[0].clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.image);

        if(intersects[0]) {

            this.controls.enabled = false;

            var vec = new THREE.Vector3(); // create once and reuse
            var pos = new THREE.Vector3(); // create once and reuse
            
            vec.set(
                ( e.changedTouches[0].clientX / window.innerWidth ) * 2 - 1,
                - ( e.changedTouches[0].clientY/ window.innerHeight ) * 2 + 1,
                1 );
                // console.log(vec)
                vec.unproject( this.camera );
                
                vec.sub( this.camera.position ).normalize();
                
                var distance = - this.camera.position.z / vec.z;
                
                pos.copy( this.camera.position ).add( vec.multiplyScalar( distance ) );
                this.image.position.set(pos.x,pos.y,this.image.position.z);
                
        } 
        
        
            }
    setupXR(){
        this.renderer.xr.enabled = true; 
        
        const self = this;
        let controller, controller1;
        
        function onSessionStart(){
            self.spaceRoom.scale.set(2,2,2)
            self.spaceRoom.position.set(0,-1,0);
            // // self.image.position.set(2,0,-1)
            // self.camera.position(  );
            console.log(self.camera.position);
            console.log(self.spaceRoom.position);
        }
        
        function onSessionEnd(){
            self.camera.remove( self.spaceRoom );
        }
        
        const btn = new ARButton( this.renderer, { onSessionStart, onSessionEnd });//, sessionInit: { optionalFeatures: [ 'dom-overlay' ], domOverlay: { root: document.body } } } );
        
        this.gestures = new ControllerGestures( this.renderer );
        // this.gestures.addEventListener( 'pan', (ev)=>{
        //     // console.log( ev );
        //     if (ev.initialise !== undefined){
        //         self.startPosition = self.image.position.clone();
        //     }else{
        //         const pos = self.startPosition.clone().add( ev.delta.multiplyScalar(8) );
        //         self.image.position.copy( pos );
        //     } 
        // });

        this.gestures.addEventListener( 'pinch', (ev)=>{
            //console.log( ev );  
            if (ev.initialise !== undefined){
                self.startScale = self.image.scale.clone();
            }else{
                const scale = self.startScale.clone().multiplyScalar(ev.scale);
                self.image.scale.copy( scale );
            }
        });
        // this.gestures.addEventListener( 'rotate', (ev)=>{
        //     //      console.log( ev ); 
        //     if (ev.initialise !== undefined){
        //         self.startQuaternion = self.image.quaternion.clone();
        //     }else{
        //         self.image.quaternion.copy( self.startQuaternion );
        //         self.image.material.rotation = ev.theta;
        //     }
        // });
        // this.gestures.addEventListener( 'tap', (ev)=>{
        //     this.image.position.z -= 0.1;

        // });
        // this.gestures.addEventListener( 'doubletap', (ev)=>{
        //     this.image.position.z += 0.1;
        // });
        this.renderer.setAnimationLoop( this.render.bind(this) );
    }

    onWheel(e) {
        if(this.imageClicked == true) {
            this.controls.enableZoom = false;
            let scale = 1;
            let isPinch = Math.abs(e.deltaY) < 50;
    
            if (isPinch) {

                // scale += e.deltaY*2 * -0.05;
                let factor = 1 - 0.5 * e.deltaY;
                scale *= factor;

                // Restrict scale
                scale = Math.min(Math.max(.125, scale), 8);
                this.image.scale.set(scale,scale,scale)
            }
        }

            }

    onKeyDown(e){
            
        if(e.keyCode == 37 && this.camera.position.x >= -3 ) {
            this.camera.position.x -= 0.1;
        }
        else if(e.keyCode == 38 && this.camera.position.y <=4) {
            this.camera.position.y += 0.1;

    } else if(e.keyCode == 39 && this.camera.position.x <=3) {
        this.camera.position.x += 0.1;

    } else if(e.keyCode == 40 && this.camera.position.y >=0) {
        this.camera.position.y -= 0.1;

    } else if(e.keyCode == 32 && this.camera.position.z <= 14) {
        this.camera.position.z += 0.1;

    } else if(e.keyCode == 13 && this.camera.position.z >= -10 ) {
        this.camera.position.z -= 0.1;

    } 
    }

    addDatGUI() {
        this.gui = new dat.GUI();
        var opacityFolder = this.gui.addFolder("Opacity");
        opacityFolder.add(this.image.material,'opacity',0,1);

        var scaleFolder = this.gui.addFolder("Scale");
        scaleFolder.add(this.image.scale,'x',-3,4);

        scaleFolder.add(this.image.scale,'y',-3,4);

        this.image.updateMatrix();

        var rotationFolder = this.gui.addFolder("Rotation");
        rotationFolder.add(this.image.material,'rotation',-Math.PI,Math.PI);

        var distanceFolder = this.gui.addFolder("Distance");
        distanceFolder.add(this.image.position,'z',-10,5);
    }

    loadBackground = () => {
        // Load the images used in the background.
        var path = "assets/cubemap/";
        
    
        let urls = [
            path + 'px.jpeg',path + 'nx.jpeg',
            path +'py.jpeg', path +'ny.jpeg',
            path +'pz.jpeg', path +'nz.jpeg',
          ];
        var reflectionCube = new THREE.CubeTextureLoader().load(urls);
        reflectionCube.format = THREE.RGBFormat;
        this.scene.background = reflectionCube;
    }
    
    init(){
        // const axesHelper = new THREE.AxesHelper( 5 );
        // this.scene.add( axesHelper );  
        this.loadTunnel();
        // this.loadImage();
        // this.addDatGUI();
        // this.loadBackground();
    }

    onMouseMove = (e) => {
            if (this.imageClicked == true )
            {   
                var vec = new THREE.Vector3();
                var pos = new THREE.Vector3();
                
                vec.set(
                    ( e.clientX / window.innerWidth ) * 2 - 1,
                    - ( e.clientY / window.innerHeight ) * 2 + 1,
                    0 );
                    
                    vec.unproject( this.camera );
                    vec.sub( this.camera.position ).normalize();
                    var distance = - this.camera.position.z / vec.z;
                    pos.copy( this.camera.position ).add( vec.multiplyScalar( distance ) );
                    this.image.position.set(pos.x,pos.y,this.image.position.z)
                    this.image.updateMatrix();
                    // console.log(this.image.position)
                    
            }
 
    } 
    onMouseClick = (e) => {
        
        e.preventDefault();
        
        this.mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
        this.mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
        
        this.raycaster.setFromCamera( this.mouse, this.camera );

        var intersects = this.raycaster.intersectObject( this.image);
        if (intersects[0] )
        {   
            this.imageClicked = !this.imageClicked
        } 
         
    
}


    loadImage() {
        const map = new THREE.TextureLoader().load( './assets/door.png' );
        const material = new THREE.SpriteMaterial( { map: map } );

        this.image = new THREE.Sprite( material );
        this.image.position.set(1,-2,1)
        this.image.name = "image"
        this.scene.add( this.image );
    }

    loadTunnel(){
        const loader = new GLTFLoader( ).setPath('./assets/');
        const self = this;
		
		// Load a glTF resource
		loader.load(
			// resource URL
			'spaceRoom.glb',
			// called when the resource is loaded
			function ( gltf ) {
                
                gltf.scene.name = 'spaceRoom'    
                self.spaceRoom = gltf.scene;
                // self.spaceRoom.rotateY(Math.PI/2)
                // self.spaceRoom.scale.set(0.5,0.5,0.5)
                self.spaceRoom.position.set(0,-0.5,0)
				self.scene.add( self.spaceRoom );                
                self.loadingBar.visible = false;         
				
				self.renderer.setAnimationLoop( self.render.bind(self));
			},
			// called while loading is progressing
			function ( xhr ) {
                // const total = 19821040;

				self.loadingBar.progress = (xhr.loaded / xhr.total);
				
			},
			// called when loading has errors
			function ( error ) {

				console.log( 'An error happened' )
                    
            }
        );
    }

    render( ) {   
        if ( this.renderer.xr.isPresenting ){
            this.gestures.update();
            
        }
        this.stats.update();
        this.renderer.render( this.scene, this.camera );
    }
    
}

export {App};