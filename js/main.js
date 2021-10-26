window.ARThreeOnLoad = function() {

	ARController.getUserMediaThreeScene({
		maxARVideoSize: 640,
		cameraParam: './lib/camera_para-iPhone 5 rear 640x480 1.0m.dat',
		onSuccess: function(arScene, arController, arCamera) {
			console.log(arCamera);
			let ar = new ARScene(arScene, arController);
		}
	});


	delete window.ARThreeOnLoad;
};

if (window.ARController && ARController.getUserMediaThreeScene) {
	ARThreeOnLoad();
}