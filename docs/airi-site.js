const current = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('[data-nav]').forEach((link) => {
  if (link.getAttribute('href') === current) link.classList.add('active');
});

document.querySelectorAll('[data-float]').forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    const rect = card.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 7;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * -7;
    card.style.transform = `perspective(900px) rotateY(${x}deg) rotateX(${y}deg)`;
  });
  card.addEventListener('pointerleave', () => {
    card.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg)';
  });
});
