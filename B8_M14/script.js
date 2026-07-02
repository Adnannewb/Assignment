const toggleMenu = document.querySelector('.toggle-menu');
const navLinks = document.querySelector('.nav-links');

if (toggleMenu && navLinks) {
	toggleMenu.addEventListener('click', () => {
		navLinks.classList.toggle('active');
	});
}
