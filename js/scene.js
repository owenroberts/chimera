function ARScene(arScene, arController, renderCallback) {

	const { scene, camera } = arScene;
	let w, h;
	let markers = [], mixers = [];
	let riverAlphaTexture, riverDisplaceTexture;
	let line, catBody;
	const textureLoader = new THREE.TextureLoader();

	init();

	function init() {
		document.body.className = arController.orientation;

		arController.setPatternDetectionMode(artoolkit.AR_TEMPLATE_MATCHING_MONO_AND_MATRIX);

		renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setClearColor(0x000000, 0);
		renderer.autoClear = true;
	
		if (arController.orientation === 'portrait') {
			w = window.innerHeight;
			h = (arController.videoWidth / arController.videoHeight) * window.innerWidth;
			renderer.setSize(w, h);
		} else {
			if (/Android|mobile|iPad|iPhone/i.test(navigator.userAgent)) {
				renderer.setSize(window.innerWidth, (window.innerWidth / arController.videoWidth) * arController.videoHeight);
			} else {
				w = window.innerWidth;
				h = (w / arController.videoWidth) * arController.videoHeight;
				renderer.setSize(w, h);
				document.body.className += ' desktop';
			}
		}

		document.body.insertBefore(renderer.domElement, document.body.firstChild);

		// set up markers
		[0, 1, 2].forEach(i => {
			markers[i] = arController.createThreeBarcodeMarker(i, 1);
			scene.add(markers[i]);
		});

		// lighting
		const light = new THREE.HemisphereLight(0xffffff, 0x080820, 1.5);
		scene.add(light);

		loadModels(start);
		setupOutline();
	}

	function loadModels(callback) {
		const loadingManager = new THREE.LoadingManager();
		const loader = new THREE.GLTFLoader(loadingManager);
		loadingManager.onLoad = function() {
			if (callback) callback();
		};
		
		loader.load("models/new_snake.glb", gltf => {
			const snake = gltf.scene;
			snake.scale.multiplyScalar(0.125);

			const snakeTexture = textureLoader.load('./models/scale.jpg');
			const bumpTexture = textureLoader.load('./models/scale_bump.jpg');
			const tongueBumpTexture = textureLoader.load('./models/Voronoi.png');

			snakeTexture.wrapS = THREE.RepeatWrapping;
			snakeTexture.wrapT = THREE.RepeatWrapping;
			snakeTexture.repeat.set(0.25, 0.25);

			bumpTexture.wrapS = THREE.RepeatWrapping;
			bumpTexture.wrapT = THREE.RepeatWrapping;
			bumpTexture.repeat.set(0.25, 0.25);

			snake.traverse(child => {
				if (child.material) {
					if (child.material.name === 'SnakeSkin'){
						child.material.map = snakeTexture;
						child.material.bumpMap = bumpTexture;
						child.material.bumpScale = 0.01;
					}

					if (child.material.name === 'SnakeEyes') {
						child.material.metalness = 1;
					}

					if (child.material.name === 'SnakeTongue') {
						child.material.bumpMap = tongueBumpTexture;
						child.material.bumpScale = 0.01;
					}
				}
			});

			const mixer = new THREE.AnimationMixer(snake);
			gltf.animations.forEach(clip => {
				mixer.clipAction(clip).play();
			});
			mixers.push(mixer);
			markers[2].add(snake);
		});

		loader.load("models/cats_.glb", gltf => {
			cat = gltf.scene;
			cat.scale.multiplyScalar(0.125);
			const mixer = new THREE.AnimationMixer(cat);
			gltf.animations.forEach(clip => {
				mixer.clipAction(clip).play();
			});
			mixers.push(mixer);
			markers[0].add(cat);

			// cat.traverse(o => {
			// 	if (o.material) {
			// 		if (o.material.name === 'CatBody') {
			// 			catBody = o;
			// 		}	
			// 	}
			// });

			// setupLines();
			// updateLines();
		});

		loader.load("models/river_plane.glb", gltf => {
			setupRiverScene(gltf);
		});
	}

	function setupLines() {
		const geo = createLines(true);
		const mat = new THREE.LineBasicMaterial({ color: 0x000000, opacity: 1 });
		line = new THREE.LineSegments(geo, mat);
		markers[0].add(line);
	}

	function updateLines() {
		// line.geometry.dispose();
		line.geometry = createLines(false);
	}

	function createLines(firstTime) {
		const geo = new THREE.BufferGeometry();
		const verts = [];
		const position = catBody.geometry.attributes.position;
		const vert = new THREE.Vector3();

		for (let i = 0, l = position.count; i < l; i++) {
			vert.fromBufferAttribute(position, i);
			vert.applyMatrix4(catBody.matrixWorld);
			if (firstTime) vert.multiplyScalar(0.25);
			verts.push(vert.x, vert.y, vert.z);
			verts.push(
				vert.x + 0.1 * (Math.random() - 0.5), 
				vert.y + 0.1 * (Math.random() - 0.5), 
				vert.z + 0.1 * (Math.random() - 0.5)
			);
		}

		geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
		return geo;
	}

	function setupRiverScene(gltf) {
		
		riverAlphaTexture = textureLoader.load('./models/Bump2.png');
		riverDisplaceTexture = textureLoader.load('./models/Voronoi.png');

		riverAlphaTexture.wrapS = THREE.RepeatWrapping;
		riverAlphaTexture.wrapT = THREE.RepeatWrapping;
		riverAlphaTexture.repeat.set(4, 4);

		riverDisplaceTexture.wrapS = THREE.RepeatWrapping;
		riverDisplaceTexture.wrapT = THREE.RepeatWrapping;
		riverDisplaceTexture.repeat.set(8, 8);

		const riverMaterial = new THREE.MeshStandardMaterial({ 
			color: 0x98b6e7,
			transparent: true,
			opacity: 0.5,
			displacementMap: riverDisplaceTexture,
			displacementScale: 0.125,
		});

		const riverTopMaterial = new THREE.MeshStandardMaterial({ 
			color: 0xb2e7f7,
			alphaMap: riverAlphaTexture,
			transparent: true,
			displacementMap: riverDisplaceTexture,
			displacementScale: 0.125,
		});

		const river = gltf.scene;
		river.scale.multiplyScalar(0.75);

		river.traverse(obj => {
			if (obj.material) {
				obj.material = riverMaterial;
			}
		});

		const riverTop = cloneGltf(gltf).scene;
		riverTop.position.set(0, -0.05, -0.05);
		river.traverse(obj => {
			if (obj.material) {
				obj.material = riverTopMaterial;
			}
		});

		markers[1].add(river);
		markers[1].add(riverTop);
	}

	function start() {
		requestAnimationFrame(render);
	}

	function setupOutline() {
		const effect = new THREE.OutlineEffect(renderer, {
			defaultThickness: 0.0025,
			defaultColor: new THREE.Color( 0xffffff ).toArray()
		});

		let renderingOutline = false;
		scene.onAfterRender = function() {
			if (renderingOutline) return;
			renderingOutline = true;
			effect.renderOutline(scene, camera);
			renderingOutline = false;
		};
	}

	let startTime = performance.now();
	function animateRiver() {
		const time = performance.now() - startTime;
		riverAlphaTexture.offset.set(0, time * 0.000125);
		riverAlphaTexture.needsUpdate = true;

		riverDisplaceTexture.offset.set(0, time * 0.00005);
		riverDisplaceTexture.needsUpdate = true;
	}

	let previousTime = null;
	function render(time) {

		if (!previousTime) previousTime = time;
		const timeElapsed = time - previousTime;
		requestAnimationFrame(render);

		animateRiver();

		for (let i = 0; i < mixers.length; i++) {
			if (mixers[i]) mixers[i].update(timeElapsed / 1000);
		}

		if (renderCallback) renderCallback(time, renderer);
		else {
			arScene.process();
			arScene.renderOn(renderer);
		}

		previousTime = time;
	}
}