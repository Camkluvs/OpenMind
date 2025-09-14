
        // Add smooth scrolling and interactive effects
        document.addEventListener('DOMContentLoaded', function() {
            // Add parallax effect to floating dots
            window.addEventListener('scroll', function() {
                const scrolled = window.pageYOffset;
                const dots = document.querySelectorAll('.floating-dot');
                
                dots.forEach((dot, index) => {
                    const speed = 0.5 + (index * 0.1);
                    dot.style.transform = `translateY(${scrolled * speed}px)`;
                });
            });

            // Add entrance animations
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            });

            const steps = document.querySelectorAll('.step');
            steps.forEach(step => {
                step.style.opacity = '0';
                step.style.transform = 'translateY(30px)';
                step.style.transition = 'all 0.6s ease';
                observer.observe(step);
            });
        });
   