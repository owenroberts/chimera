window.onload = guideSetup;

function guideSetup() {
	const guideButton = document.getElementById('guide-button');
	const guide = document.getElementById('guide');
	const dismissGuide = document.getElementById('guide-dismiss');
	
	guideButton.addEventListener('click', () => {
		if (guide.classList.contains('visible')) {
			guide.classList.remove('visible');
		} else {
			guide.classList.add('visible');
		}
	});

	dismissGuide.addEventListener('click', () => {
		guide.classList.remove('visible');
	});
}