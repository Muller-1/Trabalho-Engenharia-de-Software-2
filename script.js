let slides = document.querySelectorAll(".slide");
let current = 0;

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.remove("active");
    if (i === index) {
      slide.classList.add("active");
    }
  });
}

document.querySelector(".next").addEventListener("click", () => {
  current = (current + 1) % slides.length;
  showSlide(current);
});

document.querySelector(".prev").addEventListener("click", () => {
  current = (current - 1 + slides.length) % slides.length;
  showSlide(current);
});

// Passagem automática a cada 5s
setInterval(() => {
  current = (current + 1) % slides.length;
  showSlide(current);
}, 5000);

// Inicia no primeiro slide
showSlide(current);
