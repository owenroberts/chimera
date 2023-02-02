const stored = localStorage.getItem('chimera');

if (stored) {
	const container = document.getElementById('container');
	container.classList.add('has-stored');

	const create = document.getElementById("create");
	create.addEventListener('click', () => {
		container.classList.remove('has-stored');
		localStorage.setItem('chimera', '');
	});
}