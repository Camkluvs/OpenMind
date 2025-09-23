// js/animations.js - Funciones de animación

// Crear estrellas animadas
function createStars() {
    const container = document.getElementById('starsContainer');
    if (!container) return;
    
    const starCount = 150;

    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = `star ${['small', 'medium', 'large'][Math.floor(Math.random() * 3)]}`;
        
        star.style.left = Math.random() * 100 + '%';
        star.style.top = -10 + 'px';
        
        const duration = 15 + Math.random() * 20;
        const delay = Math.random() * 20;
        
        star.style.animationDuration = duration + 's';
        star.style.animationDelay = -delay + 's';
        
        container.appendChild(star);
        
        setTimeout(() => {
            if (star.parentNode) {
                star.remove();
            }
        }, (duration - delay) * 1000);
    }
}

function maintainStars() {
    createStars();
    setInterval(() => {
        if (document.querySelectorAll('.star').length < 50) {
            createStars();
        }
    }, 5000);
}

// Efecto de escritura para la IA
function initTypingEffect() {
    const typingText = document.getElementById('typingText');
    if (!typingText) return;

    const texts = [
        "Ayúdame a mejorar mis ideas de negocio",
        "Optimiza este proceso para mayor eficiencia", 
        "Genera un plan de marketing innovador",
        "Analiza estos datos y crea insights",
        "Desarrolla una estrategia de crecimiento"
    ];
    
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 80;
    let pauseTime = 2000;

    function type() {
        const currentText = texts[textIndex];
        
        if (isDeleting) {
            typingText.innerHTML = currentText.substring(0, charIndex - 1) + '<span class="cursor">|</span>';
            charIndex--;
            typingSpeed = 40;
        } else {
            typingText.innerHTML = currentText.substring(0, charIndex + 1) + '<span class="cursor">|</span>';
            charIndex++;
            typingSpeed = 90;
        }
        
        if (!isDeleting && charIndex === currentText.length) {
            typingSpeed = pauseTime;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
            typingSpeed = 500;
        }
        
        setTimeout(type, typingSpeed);
    }
    
    setTimeout(type, 1500);
}

// Animaciones de scroll
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                const staggerElements = entry.target.querySelectorAll('.stagger-animation');
                staggerElements.forEach((element, index) => {
                    setTimeout(() => {
                        element.classList.add('visible');
                    }, index * 100);
                });
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    const animatedElements = document.querySelectorAll('.scroll-animate, .section-title, .section-subtitle');
    animatedElements.forEach(element => {
        observer.observe(element);
    });

    setupSpecificAnimations();
}

function setupSpecificAnimations() {
    const featureCards = document.querySelectorAll('.feature-card');
    const pricingCards = document.querySelectorAll('.pricing-card');
    
    featureCards.forEach((card, index) => {
        card.classList.add('scroll-animate', 'stagger-animation');
        if (index % 2 === 0) {
            card.classList.add('animate-left');
        } else {
            card.classList.add('animate-right');
        }
    });

    pricingCards.forEach((card, index) => {
        card.classList.add('scroll-animate', 'stagger-animation');
        if (index === 1) {
            card.classList.add('animate-scale');
        } else {
            card.classList.add(index === 0 ? 'animate-left' : 'animate-right');
        }
    });

    const featuresGrid = document.querySelector('.features-grid');
    const pricingGrid = document.querySelector('.pricing-grid');
    
    if (featuresGrid) featuresGrid.classList.add('scroll-animate');
    if (pricingGrid) pricingGrid.classList.add('scroll-animate');
}

// Smooth scroll y efectos de parallax
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    let ticking = false;
    
    function updateParallax() {
        const scrolled = window.pageYOffset;
        const orb = document.querySelector('.purple-orb');
        
        if (orb) {
            const speed = 0.5;
            orb.style.transform = `translate(-50%, -50%) translateY(${scrolled * speed}px) rotate(${scrolled * 0.1}deg)`;
        }
        
        ticking = false;
    }

    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    });
}