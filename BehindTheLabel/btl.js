document.getElementById("learnMoreBtn").addEventListener("click", () => {
  document.getElementById("about").scrollIntoView({
    behavior: "smooth"
  });
});


// Partner logo reveal on scroll
const partnerLogo = document.querySelector('.partner-logo');

const observer = new IntersectionObserver(
  ([entry]) => {
    if (entry.isIntersecting) {
      partnerLogo.classList.add('visible');
    }
  },
  { threshold: 0.4 }
);

if (partnerLogo) {
  observer.observe(partnerLogo);
}
