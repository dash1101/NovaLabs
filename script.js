// Navbar functionality
const navbar = document.querySelector('.navbar');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const navLinkItems = document.querySelectorAll('.nav-link');

// Mobile menu toggle - FIXED
if (navToggle) {
    navToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event bubbling
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
    });
}

// Close mobile menu when clicking a link
navLinkItems.forEach(link => {
    link.addEventListener('click', () => {
        if (navToggle) {
            navToggle.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (navLinks && navLinks.classList.contains('active') && !navbar.contains(e.target)) {
        if (navToggle) {
            navToggle.classList.remove('active');
            navLinks.classList.remove('active');
        }
    }
});

// Add scroll effect to navbar
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    // Add/remove scrolled class for styling
    if (currentScroll > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
});

// NEW FIXED LOGIC
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        // If the link is JUST "#", don't try to smooth scroll to it
        if (this.getAttribute('href') === '#') return;
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offset = 80; // Account for navbar height
            const targetPosition = target.offsetTop - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Update active nav link on scroll
const sections = document.querySelectorAll('section[id], header[id]');

function updateActiveNavLink() {
    const scrollPos = window.pageYOffset + 100;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
            navLinkItems.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', updateActiveNavLink);

// Animated counter for stats
function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        
        // Format the number based on the value
        if (end === 99.9) {
            element.textContent = current.toFixed(1);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Animate stat counters - only if they have data-target
            if (entry.target.classList.contains('stat-value') && entry.target.hasAttribute('data-target')) {
                const target = parseFloat(entry.target.getAttribute('data-target'));
                if (!isNaN(target)) {
                    animateValue(entry.target, 0, target, 2000);
                    observer.unobserve(entry.target);
                }
            }
        }
    });
}, observerOptions);

// Observe all stat values
document.addEventListener('DOMContentLoaded', () => {
    const statValues = document.querySelectorAll('.stat-value');
    statValues.forEach(stat => observer.observe(stat));
});

// Add particle effect on mouse move (optional, subtle effect)
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// Create floating particles on click
document.addEventListener('click', (e) => {
    createParticle(e.clientX, e.clientY);
});

function createParticle(x, y) {
    const particle = document.createElement('div');
    particle.style.position = 'fixed';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.width = '8px';
    particle.style.height = '8px';
    particle.style.borderRadius = '50%';
    particle.style.background = 'radial-gradient(circle, #60a5fa, #3b82f6)';
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '9999';
    particle.style.opacity = '1';
    particle.style.boxShadow = '0 0 10px rgba(96, 165, 250, 0.8)';
    
    document.body.appendChild(particle);
    
    // Animate particle
    const angle = Math.random() * Math.PI * 2;
    const velocity = 2 + Math.random() * 3;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity;
    
    let posX = x;
    let posY = y;
    let opacity = 1;
    
    function animate() {
        posX += vx;
        posY += vy;
        opacity -= 0.02;
        
        particle.style.left = posX + 'px';
        particle.style.top = posY + 'px';
        particle.style.opacity = opacity;
        
        if (opacity > 0) {
            requestAnimationFrame(animate);
        } else {
            particle.remove();
        }
    }
    
    animate();
}

// Add parallax effect to orbs
document.addEventListener('mousemove', (e) => {
    const orbs = document.querySelectorAll('.gradient-orb');
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    
    orbs.forEach((orb, index) => {
        const speed = (index + 1) * 10;
        const xMove = (x - 0.5) * speed;
        const yMove = (y - 0.5) * speed;
        
        orb.style.transform = `translate(${xMove}px, ${yMove}px)`;
    });
});

// Add smooth hover effect to cards
const cards = document.querySelectorAll('.glass-card');

cards.forEach(card => {
    card.addEventListener('mouseenter', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        card.style.setProperty('--mouse-x', x + 'px');
        card.style.setProperty('--mouse-y', y + 'px');
    });
});

// Easter egg: Konami code
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-10);
    
    if (konamiCode.join('') === konamiSequence.join('')) {
        activateEasterEgg();
    }
});

function activateEasterEgg() {
    // Create a burst of particles
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            createParticle(
                centerX + (Math.random() - 0.5) * 200,
                centerY + (Math.random() - 0.5) * 200
            );
        }, i * 20);
    }
    
    // Add temporary rainbow effect to title
    const title = document.querySelector('.gradient-text');
    const originalBg = title.style.background;
    title.style.background = 'linear-gradient(135deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)';
    title.style.backgroundSize = '400% 400%';
    title.style.animation = 'gradientShift 1s ease infinite';
    
    setTimeout(() => {
        title.style.background = originalBg;
    }, 3000);
}

// Add custom cursor trail effect (subtle)
const cursorTrail = [];
const trailLength = 10;

function createCursorDot(x, y) {
    const dot = document.createElement('div');
    dot.style.position = 'fixed';
    dot.style.left = x + 'px';
    dot.style.top = y + 'px';
    dot.style.width = '4px';
    dot.style.height = '4px';
    dot.style.borderRadius = '50%';
    dot.style.background = 'rgba(96, 165, 250, 0.3)';
    dot.style.pointerEvents = 'none';
    dot.style.zIndex = '9998';
    dot.style.transition = 'all 0.3s ease';
    
    document.body.appendChild(dot);
    cursorTrail.push(dot);
    
    if (cursorTrail.length > trailLength) {
        const oldDot = cursorTrail.shift();
        oldDot.remove();
    }
    
    setTimeout(() => {
        dot.style.opacity = '0';
        dot.style.transform = 'scale(0)';
    }, 10);
}

let lastTrailTime = 0;
document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastTrailTime > 50) {
        createCursorDot(e.clientX, e.clientY);
        lastTrailTime = now;
    }
});

// Service link copy functionality
document.querySelectorAll('.service-link:not(.disabled)').forEach(link => {
    link.addEventListener('click', (e) => {
        // If it's not an actual external link, prevent default and copy to clipboard
        if (!link.getAttribute('href').startsWith('http')) {
            e.preventDefault();
            
            // 1. Grab just the text (ignoring the SVG icon)
            const textToCopy = link.childNodes[0].textContent.trim();
            
            // 2. Write it to the system clipboard
            navigator.clipboard.writeText(textToCopy).then(() => {
                
                // 3. Create copy notification only after successful copy
                const notification = document.createElement('div');
                notification.textContent = 'Address copied!';
                notification.style.position = 'fixed';
                notification.style.top = '20px';
                notification.style.right = '20px';
                notification.style.background = 'rgba(96, 165, 250, 0.9)';
                notification.style.color = 'white';
                notification.style.padding = '1rem 2rem';
                notification.style.borderRadius = '10px';
                notification.style.zIndex = '10000';
                notification.style.animation = 'fadeInUp 0.3s ease';
                
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    notification.style.opacity = '0';
                    setTimeout(() => notification.remove(), 300);
                }, 2000);
                
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        }
    });
});

console.log('%c⚡ NovaLabs ', 'background: linear-gradient(135deg, #38bdf8, #6366f1); color: white; font-size: 24px; padding: 10px 20px; border-radius: 8px;');
console.log('%cBuilt by dash · novalabs.app', 'color: #38bdf8; font-size: 14px;');
