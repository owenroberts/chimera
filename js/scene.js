function ARScene(arScene, arController, renderCallback) {


	/* save user chimeric arc */
	/* this could be recognizable pattern, go with it for now */

	const stored = false; // localStorage.getItem('chimera');
	let a, b, c;
	if (stored) {
		const d = JSON.parse(stored);
		a = d.a;
		b = d.b;
		c = d.c;
	} else {
		// a = [...shuffle([1,2,3,4,5,6,7,8,9,10,11,12])];
		a = [...shuffle([0, 1, 2, 0,1,2,0,1,2,0,1,2,0,1,2])];
		b = shiftArray(a);
		c = shiftArray(b);
		localStorage.setItem('chimera', JSON.stringify({ a: a, b: b, c: c }));
	}
	const markerIndexes = [0, 32, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12];

	const { scene, camera } = arScene;
	let renderer;
	let w, h;
	let markers = [], mixers = [];
	let riverAlphaTexture, riverDisplaceTexture;
	let line, catBody;
	const textureLoader = new THREE.TextureLoader();
	let outlineColor = 0xFFFFFF,
		fillColor = 0x000000;

	let composer, effectSobel;

	init();

	function init() {
		document.body.className = arController.orientation;

		arController.setPatternDetectionMode(artoolkit.AR_TEMPLATE_MATCHING_MONO_AND_MATRIX);

		renderer = new THREE.WebGLRenderer({ 
			antialias: false, 
			alpha: true,
			// logarithmicDepthBuffer: true,
		});
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setClearColor(0x000000, 0);
		renderer.autoClear = true;

		if (arController.orientation === 'portrait') {
			w = window.innerHeight;
			h = (arController.videoWidth / arController.videoHeight) * window.innerWidth;
			// renderer.setSize(w, h);
		} else {
			if (/Android|mobile|iPad|iPhone/i.test(navigator.userAgent)) {
				w = window.innerWidth;
				h = (window.innerWidth / arController.videoWidth) * arController.videoHeight;
				// renderer.setSize(w, h);
			} else {
				w = window.innerWidth;
				h = (w / arController.videoWidth) * arController.videoHeight;
				// renderer.setSize(w, h);
				document.body.className += ' desktop';
			}
		}
		let crunch = 2;
		renderer.setSize(w / crunch, h / crunch);
		renderer.domElement.style.zoom = crunch;

		document.body.insertBefore(renderer.domElement, document.body.firstChild);

		// set up markers
		// flip 0 and 32
		markerIndexes.forEach(i => {
			markers[i] = arController.createThreeBarcodeMarker(i, 1);
			markers[i].code = i;
			markers[i].group = new THREE.Group();
			// scene.add(markers[i].group);
			markers[i].add(markers[i].group);
			scene.add(markers[i]);
		});


		// lighting
		// const light = new THREE.HemisphereLight(0xffffff, 0x080820, 1.5);
		const light = new THREE.HemisphereLight(0xffffff, 0xFFFFFF, 1);

		scene.add(light);

		loadModels(start);
		setupOutline();
	}

	function loadModels(callback) {
		const loadingManager = new THREE.LoadingManager();
		const loader = new THREE.GLTFLoader(loadingManager);
		loadingManager.onLoad = function() {
			if (callback) callback();
			markers.forEach(m => {
				m.body.material = m.bodyMaterial;
			});
		};

		// rotate markers?
		markers.forEach((m, i) => {
			m.group.rotation.y = Math.PI * 0.25;
			m.group.position.z = 0.5;
			m.group.position.y = -0.5;

			if (m.code === 0 || m.code === 32) {
				m.group.rotation.z = Math.PI;
				m.group.rotation.y = Math.PI * -0.25;
				m.group.position.y = 0.5;
			}
		});

		loader.load('models/body.glb', gltf => {
			markers.forEach(m => {
				const body = cloneGltf(gltf).scene.children[0];
				m.body = body;
				m.group.add(body);
			});
		});

		const models = [
			'models/ch1_cat.glb',
			'models/ch2_bird.glb',
			'models/ch3_fish.glb',
		];
		
		models.forEach((url, index) => {
			loader.load(url, gltf => {

				const aMarkers = markerIndexes.filter((_, i) => a[i] === index);
				const bMarkers = markerIndexes.filter((_, i) => b[i] === index);
				const cMarkers = markerIndexes.filter((_, i) => c[i] === index);

				aMarkers.forEach(mi => {
					const parts = cloneGltf(gltf).scene.children.filter(p => p.name.includes('_h'));
					for (let i = parts.length - 1; i >= 0; i--) {
						const part = parts[i];
						markers[mi].group.add(part);
					}
				});

				bMarkers.forEach(mi => {
					const parts = cloneGltf(gltf).scene.children.filter(p => p.name.includes('_b'));
					for (let i = parts.length - 1; i >= 0; i--) {
						const part = parts[i];
						// console.log(mi, markers[mi].body)
						markers[mi].bodyMaterial = part.material;
						markers[mi].group.add(part);
					}
				});

				cMarkers.forEach(mi => {
					const parts = cloneGltf(gltf).scene.children.filter(p => p.name.includes('_r'));
					for (let i = parts.length - 1; i >= 0; i--) {
						const part = parts[i];
						markers[mi].group.add(part);
					}
				});


			});
		});
	}

	/* what does this do ?? */
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

	function start() {
		requestAnimationFrame(render);
	}

	function setupOutline() {
		const effect = new THREE.OutlineEffect(renderer, {
			defaultThickness: 0.0025,
			defaultColor: new THREE.Color( outlineColor ).toArray()
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

	let previousTime = null;
	function render(time) {

		if (!previousTime) previousTime = time;
		const timeElapsed = time - previousTime;
		requestAnimationFrame(render);


		for (let i = 0; i < mixers.length; i++) {
			if (mixers[i]) mixers[i].update(timeElapsed / 1000);
		}

		if (renderCallback) {
			renderCallback(time, renderer);
		} else {
			arScene.process();
			arScene.renderOn(renderer, composer);
		}

		previousTime = time;
	}
}


function shuffle(array) {
	// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
	let currentIndex = array.length, randomIndex;
	while (currentIndex != 0) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;
		[array[currentIndex], array[randomIndex]] = [
			array[randomIndex], array[currentIndex]];
	}
	return array;
}

function shiftArray(array, shiftBy) {
	const a = [...array];
	a.unshift(a.pop());
	return a;
}