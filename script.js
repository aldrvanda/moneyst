//----------SIGN UP PAGE-----------
// Sign Up Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Get form elements
    const signUpForm = document.getElementById('SignUpForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const signUpBtn = document.querySelector('.signup-btn');
    const notification = document.getElementById('notification-SignUp');
    const notificationText = document.getElementById('notificationText');

    // Create and add password toggle button
    function createPasswordToggle() {
        const passwordGroup = document.querySelector('.password-group');
        const inputWrapper = passwordGroup.querySelector('.input-wrapper');
        
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'password-toggle';
        toggleBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
        `;
        toggleBtn.setAttribute('aria-label', 'Toggle password visibility');
        
        inputWrapper.appendChild(toggleBtn);
        
        // Toggle password visibility
        toggleBtn.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            if (type === 'text') {
                // Show eye with slash (password visible)
                toggleBtn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                `;
            } else {
                // Show normal eye (password hidden)
                toggleBtn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                `;
            }
        });
    }

    // Initialize password toggle
    createPasswordToggle();

    // Notification functions
    function showNotification(message, type = 'info') {
        notificationText.textContent = message;
        notification.className = `notification-SignUp ${type}`;
        notification.classList.add('show');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            hideNotification();
        }, 5000);
    }

    function hideNotification() {
        notification.classList.remove('show');
    }

    // Click to hide notification
    notification.addEventListener('click', hideNotification);

    // Email validation
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Password validation
    function validatePassword(password) {
        return password.length >= 8;
    }

    // Real-time validation
    emailInput.addEventListener('input', function() {
        const email = this.value.trim();
        
        if (email === '') {
            this.classList.remove('valid', 'error');
        } else if (validateEmail(email)) {
            this.classList.remove('error');
            this.classList.add('valid');
        } else {
            this.classList.remove('valid');
            this.classList.add('error');
        }
    });

    passwordInput.addEventListener('input', function() {
        const password = this.value;
        
        if (password === '') {
            this.classList.remove('valid', 'error');
        } else if (validatePassword(password)) {
            this.classList.remove('error');
            this.classList.add('valid');
        } else {
            this.classList.remove('valid');
            this.classList.add('error');
        }
    });

    // Loading state for button
    function setButtonLoading(loading) {
        if (loading) {
            signUpBtn.classList.add('loading');
            signUpBtn.disabled = true;
        } else {
            signUpBtn.classList.remove('loading');
            signUpBtn.disabled = false;
        }
    }

    // Form submission
    signUpForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Validate inputs
        let isValid = true;

        if (!email) {
            emailInput.classList.add('error');
            showNotification('Email tidak boleh kosong!', 'error');
            isValid = false;
        } else if (!validateEmail(email)) {
            emailInput.classList.add('error');
            showNotification('Format email tidak valid!', 'error');
            isValid = false;
        }

        if (!password) {
            passwordInput.classList.add('error');
            showNotification('Password tidak boleh kosong!', 'error');
            isValid = false;
        } else if (!validatePassword(password)) {
            passwordInput.classList.add('error');
            showNotification('Password minimal 8 karakter!', 'error');
            isValid = false;
        }

        if (!isValid) {
            return;
        }

        // Show loading state
        setButtonLoading(true);
        showNotification('Sedang memproses pendaftaran...', 'info');

        try {
            // Simulate API call (replace with actual API endpoint)
            await simulateSignUp(email, password);
            
            // Success
            showNotification('Pendaftaran berhasil! Selamat datang di Money\'st!', 'success');
            
            // Reset form
            signUpForm.reset();
            emailInput.classList.remove('valid', 'error');
            passwordInput.classList.remove('valid', 'error');
            
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                window.location.href = 'home.html'; // Replace with your dashboard page
            }, 1500);
            
        } catch (error) {
            // Error handling
            if (error.message === 'EMAIL_EXISTS') {
                showNotification('Email sudah terdaftar. Silakan gunakan email lain atau login.', 'error');
            } else if (error.message === 'NETWORK_ERROR') {
                showNotification('Terjadi kesalahan jaringan. Silakan coba lagi.', 'error');
            } else {
                showNotification('Pendaftaran gagal. Silakan coba lagi.', 'error');
            }
        } finally {
            // Hide loading state
            setButtonLoading(false);
        }
    });

    async function simulateSignUp(email, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const random = Math.random();
                
                if (random < 0.1) {
                    // 10% chance of email already exists
                    reject(new Error('EMAIL_EXISTS'));
                } else if (random < 0.15) {
                    // 5% chance of network error
                    reject(new Error('NETWORK_ERROR'));
                } else if (random < 0.2) {
                    // 5% chance of general error
                    reject(new Error('GENERAL_ERROR'));
                } else {
                    // 80% chance of success
                    resolve({
                        success: true,
                        user: {
                            email: email,
                            id: Date.now()
                        }
                    });
                }
            }, 1500); 
        });
    }

    // Social login handlers
    const socialButtons = document.querySelectorAll('.social-btn');
    
    socialButtons.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            const providers = ['Facebook', 'Google', 'Apple'];
            const provider = providers[index];
            
            showNotification(`Login dengan ${provider} sedang dalam pengembangan.`, 'warning');
            
            // Add click animation
            this.style.transform = 'translateY(-3px) scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });

    // Add keyboard navigation for social buttons
    socialButtons.forEach(btn => {
        btn.setAttribute('tabindex', '0');
        btn.setAttribute('role', 'button');
        
        btn.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });

    // Focus management
    emailInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            passwordInput.focus();
        }
    });

    passwordInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            signUpForm.dispatchEvent(new Event('submit'));
        }
    });

    // Add smooth transitions for better UX
    const inputs = [emailInput, passwordInput];
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateY(-2px)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = '';
        });
    });

    console.log('Sign Up page initialized successfully');
});











//----------FINANCE RECORD----------
// Income and expense rows, totals and delete/undo are rendered from the shared
// store in data.js by pages.js, so every page shows the same numbers.

// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(button => {
    button.addEventListener('click', function() {
        // Remove active class from all buttons
        navButtons.forEach(btn => btn.classList.remove('active'));

        // Add active class to clicked button
        this.classList.add('active');

    });
});

});

// Smooth hover effects for cards
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.finance-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.transition = 'all 0.3s ease';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});

// Profile button functionality
document.addEventListener('DOMContentLoaded', function() {
    const profileBtn = document.querySelector('.profile-btn');
    
    if (profileBtn) {
        profileBtn.addEventListener('click', function() {
            // Add ripple effect
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            console.log('Profile clicked');
            // Here you could show profile menu or navigate to profile page
        });
    }
});

// Add some interactive feedback
document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.add-btn');
    
    buttons.forEach(button => {
        button.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.9)';
        });
        
        button.addEventListener('mouseup', function() {
            this.style.transform = 'scale(1.1)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });
});



//----------ADD INCOME----------
// Format number with thousand separators
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Remove formatting and return clean number
function cleanNumber(str) {
    return str.replace(/[^\d]/g, "");
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification-addInc');
    const notificationText = document.getElementById('notificationText-addInc');
    
    // Remove any existing type classes
    notification.classList.remove('success', 'error', 'warning', 'info');
    
    // Add the new type class
    notification.classList.add(type);
    
    // Set the message
    notificationText.textContent = message;
    
    // Show notification
    notification.classList.add('show');
    
    // Auto hide after 4 seconds
    setTimeout(() => {
        hideNotification();
    }, 4000);
}

// Hide notification
function hideNotification() {
    const notification = document.getElementById('notification-addInc');
    notification.classList.remove('show');
}

// Show loading overlay
function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay-addInc');
    loadingOverlay.classList.add('show');
}

// Hide loading overlay
function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay-addInc');
    loadingOverlay.classList.remove('show');
}

// Validate form data
function validateForm(formData) {
    const amount = cleanNumber(formData.get('amount'));
    const date = formData.get('date');
    const category = formData.get('category');
    
    if (!amount || amount === '0') {
        return { isValid: false, message: 'Please enter a valid amount' };
    }
    
    if (!date) {
        return { isValid: false, message: 'Please select a date' };
    }
    
    // Check if date is not in the future
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of day
    
    if (selectedDate > today) {
        return { isValid: false, message: 'Date cannot be in the future' };
    }
    
    if (!category) {
        return { isValid: false, message: 'Please select a category' };
    }
    
    return { isValid: true };
}

// Save income to the shared store (data.js)
function saveIncomeData(data) {
    return Moneyst.add('income', data);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('incomeForm');
    const amountInput = document.getElementById('amount');
    const dateInput = document.getElementById('date');
    const notification = document.getElementById('notification-addInc');
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    
    // Format amount input as user types
    amountInput.addEventListener('input', function(e) {
        let value = cleanNumber(e.target.value);
        if (value) {
            e.target.value = formatNumber(value);
        }
    });
    
    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        
        // Validate form
        const validation = validateForm(formData);
        if (!validation.isValid) {
            showNotification(validation.message, 'error');
            return;
        }
        
        // Save, then show the new row in the finance record
        const saved = saveIncomeData({
            amount: parseFloat(cleanNumber(formData.get('amount'))),
            date: formData.get('date'),
            method: formData.get('category')
        });

        Moneyst.setFlash({
            message: `Income of ${Moneyst.formatRupiah(saved.amount)} added.`,
            undo: { type: 'income', id: saved.id }
        });
        window.location.href = `financeRecord.html?new=${encodeURIComponent(saved.id)}`;
    });
    
    // Click notification to dismiss
    notification.addEventListener('click', hideNotification);
    
    // Focus amount input on page load
    amountInput.focus();
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Escape key to hide notification
        if (e.key === 'Escape') {
            hideNotification();
        }
        
        // Ctrl+S to save (prevent default browser save)
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });
});

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatNumber,
        cleanNumber,
        validateForm,
        showNotification,
        hideNotification
    };
}
