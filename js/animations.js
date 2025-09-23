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

// Animación del código en tiempo real para la sección de proceso
function initProcessCodeAnimation() {
    const codeLines = document.querySelectorAll('.typing-line');
    
    codeLines.forEach((line, index) => {
        setTimeout(() => {
            const originalText = line.textContent;
            line.textContent = '';
            
            let charIndex = 0;
            function typeCode() {
                if (charIndex < originalText.length) {
                    line.textContent = originalText.substring(0, charIndex + 1);
                    charIndex++;
                    setTimeout(typeCode, 50 + Math.random() * 100);
                }
            }
            typeCode();
        }, index * 2000 + 3000); // Delay inicial de 3s
    });
}

// Animaciones de scroll
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Iniciar animaciones específicas de proceso
                if (entry.target.closest('.process-card')) {
                    setTimeout(initProcessAnimations, 500);
                }
                
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

// Animaciones específicas de la sección proceso
function initProcessAnimations() {
    // Animar indicadores de estado
    const statusIndicators = document.querySelectorAll('.status-indicator.loading i');
    statusIndicators.forEach(indicator => {
        indicator.style.animation = 'spin 2s linear infinite';
    });

    // Animar elementos de integración
    const integrationCircles = document.querySelectorAll('.integration-circle');
    integrationCircles.forEach((circle, index) => {
        setTimeout(() => {
            circle.style.animation = 'float 3s ease-in-out infinite';
        }, index * 500);
    });

    // Iniciar animación del código
    setTimeout(initProcessCodeAnimation, 1000);
}

function setupSpecificAnimations() {
    const featureCards = document.querySelectorAll('.feature-card');
    const pricingCards = document.querySelectorAll('.pricing-card');
    const processCards = document.querySelectorAll('.process-card');
    
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

    processCards.forEach((card, index) => {
        card.classList.add('scroll-animate', 'stagger-animation');
        card.classList.add(index % 2 === 0 ? 'animate-left' : 'animate-right');
    });

    const grids = document.querySelectorAll('.features-grid, .pricing-grid, .process-grid');
    grids.forEach(grid => grid.classList.add('scroll-animate'));
}

// Newsletter animation
function initNewsletterAnimation() {
    const newsletterForm = document.querySelector('.newsletter-form');
    const newsletterBtn = document.querySelector('.newsletter-btn');
    
    if (newsletterForm && newsletterBtn) {
        newsletterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Animar botón
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
                this.innerHTML = '¡Suscrito! ✓';
                this.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
                
                // Volver al estado original después de 3s
                setTimeout(() => {
                    this.innerHTML = 'Subscribir';
                    this.style.background = '';
                }, 3000);
            }, 150);
        });
    }
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
        
        // Parallax para el footer
        const footer = document.querySelector('.footer');
        if (footer) {
            const rect = footer.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (isVisible) {
                const parallaxSpeed = (window.innerHeight - rect.top) * 0.1;
                footer.style.transform = `translateY(${parallaxSpeed}px)`;
            }
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

// Inicializar todas las animaciones específicas
function initAllAnimations() {
    initNewsletterAnimation();
    
    // Observer para el footer
    const footerObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-footer');
            }
        });
    }, { threshold: 0.2 });
    
    const footer = document.querySelector('.footer');
    if (footer) footerObserver.observe(footer);
}

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