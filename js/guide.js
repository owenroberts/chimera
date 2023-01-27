window.onload = guideSetup;

function guideSetup() {
	console.log('guide setup')
	const guideButton = document.getElementById('guide-button');
	const guide = document.getElementById('guide');
	const dismissGuide = document.getElementById('guide-dismiss');
	
	guideButton.addEventListener('click', () => {
		guide.classList.add('visible');
	});

	dismissGuide.addEventListener('click', () => {
		guide.classList.remove('visible');
	});
}