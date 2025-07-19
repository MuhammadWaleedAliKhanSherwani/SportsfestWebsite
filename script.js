// Sponsors Carousel Functionality
function initSponsorsCarousel() {
    const carouselTrack = document.querySelector('.carousel-track');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const dots = document.querySelectorAll('.dot');
    
    if (!carouselTrack) return;

    let currentSlide = 0;
    const slideWidth = 250 + 32; // card width + gap
    const slidesPerView = Math.floor(window.innerWidth / slideWidth);
    const totalSlides = document.querySelectorAll('.sponsor-card').length;
    const maxSlides = Math.max(0, totalSlides - slidesPerView);

    function updateCarousel() {
        const translateX = -currentSlide * slideWidth;
        carouselTrack.style.transform = `translateX(${translateX}px)`;
        
        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
        
        // Update buttons
        prevBtn.disabled = currentSlide === 0;
        nextBtn.disabled = currentSlide >= maxSlides;
    }

    function nextSlide() {
        if (currentSlide < maxSlides) {
            currentSlide++;
            updateCarousel();
        }
    }

    function prevSlide() {
        if (currentSlide > 0) {
            currentSlide--;
            updateCarousel();
        }
    }

    function goToSlide(slideIndex) {
        currentSlide = Math.max(0, Math.min(slideIndex, maxSlides));
        updateCarousel();
    }

    // Event listeners
    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToSlide(index));
    });

    // Auto-slide functionality
    let autoSlideInterval;
    
    function startAutoSlide() {
        autoSlideInterval = setInterval(() => {
            if (currentSlide >= maxSlides) {
                currentSlide = 0;
            } else {
                currentSlide++;
            }
            updateCarousel();
        }, 3000); // Change slide every 3 seconds
    }

    function stopAutoSlide() {
        clearInterval(autoSlideInterval);
    }

    // Pause auto-slide on hover
    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', stopAutoSlide);
        carouselContainer.addEventListener('mouseleave', startAutoSlide);
    }

    // Initialize carousel
    updateCarousel();
    startAutoSlide();

    // Handle window resize
    window.addEventListener('resize', () => {
        const newSlidesPerView = Math.floor(window.innerWidth / slideWidth);
        const newMaxSlides = Math.max(0, totalSlides - newSlidesPerView);
        
        if (currentSlide > newMaxSlides) {
            currentSlide = newMaxSlides;
        }
        
        updateCarousel();
    });

    // Touch/swipe support for mobile
    let startX = 0;
    let endX = 0;

    carouselTrack.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        stopAutoSlide();
    });

    carouselTrack.addEventListener('touchmove', (e) => {
        endX = e.touches[0].clientX;
    });

    carouselTrack.addEventListener('touchend', () => {
        const swipeDistance = startX - endX;
        const minSwipeDistance = 50;

        if (Math.abs(swipeDistance) > minSwipeDistance) {
            if (swipeDistance > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
        
        startAutoSlide();
    });
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initSponsorsCarousel();
});

// Mobile Navigation Toggle
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    
    // Animate hamburger menu
    const bars = navToggle.querySelectorAll('.bar');
    bars.forEach((bar, index) => {
        bar.style.transform = navMenu.classList.contains('active') 
            ? `rotate(${index === 0 ? 45 : index === 2 ? -45 : 0}deg) translate(${index === 1 ? -100 : 0}%, ${index === 0 ? 8 : index === 2 ? -8 : 0}px)`
            : 'none';
        bar.style.opacity = navMenu.classList.contains('active') && index === 1 ? '0' : '1';
    });
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const bars = navToggle.querySelectorAll('.bar');
        bars.forEach(bar => {
            bar.style.transform = 'none';
            bar.style.opacity = '1';
        });
    });
});

// Smooth Scrolling for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Navbar Background on Scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(27, 36, 82, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(27, 36, 82, 0.3)';
    } else {
        navbar.style.background = 'rgba(27, 36, 82, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Intersection Observer for Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.about-card, .info-item, .tournament-rules');
    animateElements.forEach(el => {
        observer.observe(el);
    });
});

// Add CSS for scroll animations
const style = document.createElement('style');
style.textContent = `
    .about-card, .info-item, .tournament-rules {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease;
    }
    
    .about-card.animate-in, .info-item.animate-in, .tournament-rules.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(style);

// Parallax Effect for Hero Background
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroBackground = document.querySelector('.hero-background');
    if (heroBackground) {
        const speed = scrolled * 0.5;
        heroBackground.style.transform = `translateY(${speed}px)`;
    }
});

// Dynamic Stats Counter Animation
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start);
        }
    }, 16);
}

// Trigger counter animation when stats come into view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
            const statNumbers = entry.target.querySelectorAll('.stat-number');
            statNumbers.forEach(stat => {
                const target = parseInt(stat.textContent);
                stat.textContent = '0';
                setTimeout(() => {
                    animateCounter(stat, target);
                }, 200);
            });
            entry.target.dataset.animated = 'true';
        }
    });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
    statsObserver.observe(heroStats);
}

// Floating Ball Animation Enhancement
const floatingBall = document.querySelector('.floating-ball');
if (floatingBall) {
    let mouseX = 0;
    let mouseY = 0;
    let ballX = 0;
    let ballY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animate() {
        ballX += (mouseX - ballX) * 0.02;
        ballY += (mouseY - ballY) * 0.02;
        
        floatingBall.style.transform = `translate(${(ballX - window.innerWidth / 2) * 0.02}px, ${(ballY - window.innerHeight / 2) * 0.02}px)`;
        requestAnimationFrame(animate);
    }
    animate();
}

// CTA Button Pulse Effect
function addPulseEffect() {
    const ctaButtons = document.querySelectorAll('.cta-button.primary');
    ctaButtons.forEach(button => {
        setInterval(() => {
            button.style.transform = 'scale(1.05)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
            }, 200);
        }, 3000);
    });
}

// Initialize pulse effect after page load
window.addEventListener('load', () => {
    setTimeout(addPulseEffect, 2000);
});

// Form Validation and Enhancement (for future form integration)
function enhanceRegistrationLinks() {
    const registrationLinks = document.querySelectorAll('a[href*="forms.google.com"]');
    registrationLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Add tracking or analytics here if needed
            console.log('Registration link clicked');
            
            // Add visual feedback
            link.style.transform = 'scale(0.95)';
            setTimeout(() => {
                link.style.transform = 'scale(1)';
            }, 150);
        });
    });
}

// Initialize enhancements
document.addEventListener('DOMContentLoaded', () => {
    enhanceRegistrationLinks();
});

// Keyboard Navigation Enhancement
document.addEventListener('keydown', (e) => {
    // ESC key closes mobile menu
    if (e.key === 'Escape' && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        const bars = navToggle.querySelectorAll('.bar');
        bars.forEach(bar => {
            bar.style.transform = 'none';
            bar.style.opacity = '1';
        });
    }
});

// Performance Optimization: Throttle scroll events
let ticking = false;

function updateOnScroll() {
    // Navbar background
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(27, 36, 82, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(27, 36, 82, 0.3)';
    } else {
        navbar.style.background = 'rgba(27, 36, 82, 0.95)';
        navbar.style.boxShadow = 'none';
    }

    // Parallax effect
    const scrolled = window.pageYOffset;
    const heroBackground = document.querySelector('.hero-background');
    if (heroBackground) {
        const speed = scrolled * 0.5;
        heroBackground.style.transform = `translateY(${speed}px)`;
    }

    ticking = false;
}

function requestTick() {
    if (!ticking) {
        requestAnimationFrame(updateOnScroll);
        ticking = true;
    }
}

window.addEventListener('scroll', requestTick);

// Add loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// Add CSS for loading state
const loadingStyle = document.createElement('style');
loadingStyle.textContent = `
    body {
        opacity: 0;
        transition: opacity 0.5s ease;
    }
    
    body.loaded {
        opacity: 1;
    }
`;
document.head.appendChild(loadingStyle); 