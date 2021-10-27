window.ARThreeOnLoad = function() {

	ARController.getUserMediaThreeScene({
		maxARVideoSize: 640,
		cameraParam: './lib/camera_para.dat',
		onSuccess: function(arScene, arController, arCamera) {
			let ar = new ARScene(arScene, arController);
		}
	});

	delete window.ARThreeOnLoad;
};

if (window.ARController && ARController.getUserMediaThreeScene) {
	ARThreeOnLoad();
}