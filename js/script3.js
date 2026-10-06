//----------ADD EXPENSES----------
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
    const notification = document.getElementById('notification-addExp');
    const notificationText = document.getElementById('notificationText-addExp');
    
    // Remove any existing type classes
    notification.classList.remove('success', 'error', 'warning', 'info');
    
    // Add the new type class
    notification.classList.add(type);
    
    // Set the message
    notificationText.textContent = message;
    
    // Show notification
    notification.classList.add('show');
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

// Hide notification
function hideNotification() {
    const notification = document.getElementById('notification-addExp');
    notification.classList.remove('show');
}

// Show loading overlay
function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay-addExp');
    loadingOverlay.classList.add('show');
}

// Hide loading overlay
function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay-addExp');
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

// Get category display name
function getCategoryDisplayName(category) {
    const categoryNames = {
        'food': 'Food',
        'transport': 'Transport',
        'shopping': 'Shopping',  
        'entertainment': 'Entertainment',
        'bills': 'Bills',
        'health': 'Health',
        'education': 'Education',
        'travel': 'Travel',
        'other': 'Other'
    };
    return categoryNames[category] || category;
}

// Save expense to the shared store (data.js)
function saveExpenseData(data) {
    return Moneyst.add('expense', data);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('expenseForm');
    if (!form) return; // only runs on the add form page
    const amountInput = document.getElementById('amount');
    const dateInput = document.getElementById('date');
    const categorySelect = document.getElementById('category');
    const notification = document.getElementById('notification-addExp');
    
    // Set today's date as default
    const today = Moneyst.todayISO();
    dateInput.value = today;
    
    // Format amount input as user types
    amountInput.addEventListener('input', function(e) {
        let value = cleanNumber(e.target.value);
        if (value) {
            e.target.value = formatNumber(value);
        }
    });
    
    // Add visual feedback for category selection
    categorySelect.addEventListener('change', function(e) {
        if (e.target.value) {
            e.target.style.color = '#333';
            e.target.style.fontWeight = '600';
        } else {
            e.target.style.color = '#999';
            e.target.style.fontWeight = '500';
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
        const saved = saveExpenseData({
            amount: parseFloat(cleanNumber(formData.get('amount'))),
            date: formData.get('date'),
            category: formData.get('category')
        });

        const categoryName = getCategoryDisplayName(saved.category);
        Moneyst.setFlash({
            message: `${categoryName} expense of ${Moneyst.formatRupiah(saved.amount)} added.`,
            undo: { type: 'expense', id: saved.id }
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
        hideNotification,
        getCategoryDisplayName
    };
}

//----------LOGIN PAGE----------
//---------- LOGIN PAGE -----------
// Login Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Get form elements
    const loginForm = document.getElementById('LoginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('remember');
    const loginBtn = document.querySelector('.login-btn');
    const notification = document.getElementById('notification-Login');
    const notificationText = document.getElementById('notificationText');
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (!loginForm) return; // only runs on the login page

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

    // Load remembered email on page load
    function loadRememberedData() {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        const wasRemembered = localStorage.getItem('rememberMe') === 'true';
        
        if (rememberedEmail && wasRemembered) {
            emailInput.value = rememberedEmail;
            rememberCheckbox.checked = true;
            emailInput.classList.add('valid');
        }
    }

    // Load remembered data
    loadRememberedData();

    // Notification functions
    function showNotification(message, type = 'info') {
        notificationText.textContent = message;
        notification.className = `notification-Login ${type}`;
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
        return password.length >= 8; // Minimum 8 characters for login
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
            loginBtn.classList.add('loading');
            loginBtn.disabled = true;
        } else {
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        }
    }

    // Handle remember me functionality
    function handleRememberMe(email, remember) {
        if (remember) {
            localStorage.setItem('rememberedEmail', email);
            localStorage.setItem('rememberMe', 'true');
        } else {
            localStorage.removeItem('rememberedEmail');
            localStorage.removeItem('rememberMe');
        }
    }

    // Form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const remember = rememberCheckbox.checked;

        // Validate inputs
        let isValid = true;

        if (!email) {
            emailInput.classList.add('error');
            showNotification('Please enter your email.', 'error');
            isValid = false;
        } else if (!validateEmail(email)) {
            emailInput.classList.add('error');
            showNotification('Please enter a valid email address.', 'error');
            isValid = false;
        }

        if (!password) {
            passwordInput.classList.add('error');
            showNotification('Please enter your password.', 'error');
            isValid = false;
        } else if (!validatePassword(password)) {
            passwordInput.classList.add('error');
            showNotification('Password must be at least 8 characters.', 'error');
            isValid = false;
        }

        if (!isValid) {
            return;
        }

        // Show loading state
        setButtonLoading(true);
        showNotification('Logging you in...', 'info');

        try {
            // Simulate API call (replace with actual API endpoint)
            await simulateLogin(email, password);
            
            // Handle remember me
            handleRememberMe(email, remember);
            
            // Success
            showNotification('Logged in! Welcome back!', 'success');
            
            // Reset form
            loginForm.reset();
            emailInput.classList.remove('valid', 'error');
            passwordInput.classList.remove('valid', 'error');
            
            // Redirect to dashboard after 1.5 seconds
            setTimeout(() => {
                window.location.href = 'home.html'; // Replace with your dashboard page
            }, 1500);
            
        } catch (error) {
            // Error handling
            if (error.message === 'INVALID_CREDENTIALS') {
                showNotification('Wrong email or password. Please try again.', 'error');
            } else if (error.message === 'ACCOUNT_LOCKED') {
                showNotification('Your account is locked. Please contact customer service.', 'error');
            } else if (error.message === 'NETWORK_ERROR') {
                showNotification('Network error. Please try again.', 'error');
            } else {
                showNotification('Login failed. Please try again.', 'error');
            }
        } finally {
            // Hide loading state
            setButtonLoading(false);
        }
    });

    // Simulated login: valid input always succeeds in this prototype
    async function simulateLogin(email, password) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    user: {
                        email: email,
                        id: email === 'demo@money.st' ? 'demo_user' : Date.now(),
                        name: email === 'demo@money.st' ? 'Demo User' : email.split('@')[0]
                    },
                    token: 'auth_token_' + Date.now()
                });
            }, 800);
        });
    }

    // Forgot password handler
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        
        if (email && validateEmail(email)) {
            showNotification(`A password reset link has been sent to ${email}`, 'info');
        } else {
            showNotification('Enter a valid email address first.', 'warning');
            emailInput.focus();
        }
    });

    // Social login handlers
    const socialButtons = document.querySelectorAll('.social-btn');
    
    socialButtons.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            const providers = ['Facebook', 'Google', 'Apple'];
            const provider = providers[index];
            
            showNotification(`Sign-in with ${provider} is coming soon.`, 'warning');
            
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
            loginForm.dispatchEvent(new Event('submit'));
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

    // Demo credentials hint
    function showDemoHint() {
        if (emailInput.value === '' && passwordInput.value === '') {
            showNotification('Demo: use email "demo@money.st" and password "demo1234"', 'info');
        }
    }

    // Show demo hint after 3 seconds if no interaction
    setTimeout(showDemoHint, 3000);

    console.log('Login page initialized successfully');
});

//----------CONTACT PAGE-----------

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contactForm');
    const modal = document.getElementById('successModal');
    if (!form) return; // only runs on the contact page
    
    // Form field elements
    const firstName = document.getElementById('firstName');
    const lastName = document.getElementById('lastName');
    const email = document.getElementById('email');
    const phone = document.getElementById('phone');
    const message = document.getElementById('message');
    
    // Error message elements
    const firstNameError = document.getElementById('firstNameError');
    const lastNameError = document.getElementById('lastNameError');
    const emailError = document.getElementById('emailError');
    const phoneError = document.getElementById('phoneError');
    const messageError = document.getElementById('messageError');
    
    // Submit button
    const submitBtn = document.querySelector('.submit-btn-contact');

    // Validation patterns
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^[0-9]{8,13}$/;
    const namePattern = /^[a-zA-Z\s]{2,50}$/;

    // Real-time validation functions
    function validateFirstName() {
        const value = firstName.value.trim();
        if (value === '') {
            showError(firstName, firstNameError, 'First name is required');
            return false;
        } else if (!namePattern.test(value)) {
            showError(firstName, firstNameError, 'First name must be 2-50 characters and contain only letters');
            return false;
        } else {
            clearError(firstName, firstNameError);
            return true;
        }
    }

    function validateLastName() {
        const value = lastName.value.trim();
        if (value === '') {
            showError(lastName, lastNameError, 'Last name is required');
            return false;
        } else if (!namePattern.test(value)) {
            showError(lastName, lastNameError, 'Last name must be 2-50 characters and contain only letters');
            return false;
        } else {
            clearError(lastName, lastNameError);
            return true;
        }
    }

    function validateEmail() {
        const value = email.value.trim();
        if (value === '') {
            showError(email, emailError, 'Email is required');
            return false;
        } else if (!emailPattern.test(value)) {
            showError(email, emailError, 'Please enter a valid email address');
            return false;
        } else {
            clearError(email, emailError);
            return true;
        }
    }

    function validatePhone() {
        const value = phone.value.trim();
        if (value === '') {
            showError(phone, phoneError, 'Phone number is required');
            return false;
        } else if (!phonePattern.test(value)) {
            showError(phone, phoneError, 'Phone number must be 8-13 digits');
            return false;
        } else {
            clearError(phone, phoneError);
            return true;
        }
    }

    function validateMessage() {
        const value = message.value.trim();
        if (value === '') {
            showError(message, messageError, 'Message is required');
            return false;
        } else if (value.length < 10) {
            showError(message, messageError, 'Message must be at least 10 characters long');
            return false;
        } else if (value.length > 500) {
            showError(message, messageError, 'Message must not exceed 500 characters');
            return false;
        } else {
            clearError(message, messageError);
            return true;
        }
    }

    // Helper functions for error handling
    function showError(field, errorElement, errorMessage) {
        field.classList.add('error');
        errorElement.textContent = errorMessage;
        errorElement.style.display = 'block';
    }

    function clearError(field, errorElement) {
        field.classList.remove('error');
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }

    // Real-time validation event listeners
    firstName.addEventListener('blur', validateFirstName);
    firstName.addEventListener('input', function() {
        if (firstName.classList.contains('error')) {
            validateFirstName();
        }
    });

    lastName.addEventListener('blur', validateLastName);
    lastName.addEventListener('input', function() {
        if (lastName.classList.contains('error')) {
            validateLastName();
        }
    });

    email.addEventListener('blur', validateEmail);
    email.addEventListener('input', function() {
        if (email.classList.contains('error')) {
            validateEmail();
        }
    });

    phone.addEventListener('blur', validatePhone);
    phone.addEventListener('input', function() {
        // Only allow numbers
        this.value = this.value.replace(/[^0-9]/g, '');
        if (phone.classList.contains('error')) {
            validatePhone();
        }
    });

    message.addEventListener('blur', validateMessage);
    message.addEventListener('input', function() {
        if (message.classList.contains('error')) {
            validateMessage();
        }
        // Character counter - only show when approaching limit
        const currentLength = this.value.length;
        const maxLength = 500;
    
        if (currentLength > maxLength - 50) {
            messageError.textContent = `${currentLength}/${maxLength} characters`;
            messageError.style.color = currentLength > maxLength ? '#e74c3c' : '#7f8c8d';
            messageError.style.display = 'block';
        } else if (!message.classList.contains('error')) {
            // Only hide counter if there's no validation error
            messageError.style.display = 'none';
        }
    });

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
    
        // Validate all fields
        const isFirstNameValid = validateFirstName();
        const isLastNameValid = validateLastName();
        const isEmailValid = validateEmail();
        const isPhoneValid = validatePhone();
        const isMessageValid = validateMessage();
    
        // Check if all validations pass
        if (isFirstNameValid && isLastNameValid && isEmailValid && isPhoneValid && isMessageValid) {
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
        
            // Simulate form submission (replace with actual API call)
            setTimeout(() => {
                // Clear all error states before reset
                [firstName, lastName, email, phone, message].forEach(field => {
                    field.classList.remove('error');
                });
            
                // Clear all error messages
                [firstNameError, lastNameError, emailError, phoneError, messageError].forEach(errorElement => {
                    errorElement.textContent = '';
                    errorElement.style.display = 'none';
                });
            
                // Reset form
                form.reset();
            
                // Reset button
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit';
            
                // Clear saved form data
                try {
                    sessionStorage.removeItem('contactFormData');
                } catch (e) {
                    console.log('Could not clear form data');
                }
            
                // Show success modal
                showSuccessModal();
            
                // Show success notification
                showNotification('Message sent successfully! We\'ll contact you within 24 hours.', 'success');
            
            }, 1500);
        } else {
            // Show error notification
            showNotification('Please fix the errors in the form before submitting.', 'error');
        }
    });

    // Modal functions
    function showSuccessModal() {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    function closeModal() {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto'; // Restore scrolling
    }

    // Make closeModal function global so it can be called from HTML
    window.closeModal = closeModal;

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });

    // Notification system
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add notification styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            min-width: 300px;
            max-width: 400px;
            background: ${getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            transform: translateX(100%);
            transition: all 0.3s ease;
            font-family: 'Poppins', sans-serif;
        `;

        notification.querySelector('.notification-content').style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
        `;

        notification.querySelector('.notification-icon').style.cssText = `
            font-size: 1.2rem;
            font-weight: bold;
        `;

        notification.querySelector('.notification-message').style.cssText = `
            flex: 1;
            font-size: 0.9rem;
            font-family: 'poppins', sans-serif;
        `;

        notification.querySelector('.notification-close').style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Add to document
        document.body.appendChild(notification);

        // Trigger animation
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    function getNotificationIcon(type) {
        switch (type) {
            case 'success': return '✓';
            case 'error': return '✕';
            case 'warning': return '⚠';
            default: return 'ℹ';
        }
    }

    function getNotificationColor(type) {
        switch (type) {
            case 'success': return 'linear-gradient(135deg, #52c41a, #73d13d)';
            case 'error': return 'linear-gradient(135deg, #ff4d4f, #ff7875)';
            case 'warning': return 'linear-gradient(135deg, #faad14, #ffc53d)';
            default: return 'linear-gradient(135deg, #1890ff, #40a9ff)';
        }
    }

    // Form auto-save (optional feature)
    function saveFormData() {
        const formData = {
            firstName: firstName.value,
            lastName: lastName.value,
            email: email.value,
            phone: phone.value,
            message: message.value,
            timestamp: new Date().getTime()
        };
        
        // Save to sessionStorage (temporary storage)
        try {
            sessionStorage.setItem('contactFormData', JSON.stringify(formData));
        } catch (e) {
            console.log('SessionStorage not available');
        }
    }

    function loadFormData() {
        try {
            const savedData = sessionStorage.getItem('contactFormData');
            if (savedData) {
                const formData = JSON.parse(savedData);
                const currentTime = new Date().getTime();
                
                // Only restore data if it's less than 1 hour old
                if (currentTime - formData.timestamp < 3600000) {
                    firstName.value = formData.firstName || '';
                    lastName.value = formData.lastName || '';
                    email.value = formData.email || '';
                    phone.value = formData.phone || '';
                    message.value = formData.message || '';
                    
                    if (formData.firstName || formData.lastName || formData.email || formData.phone || formData.message) {
                        showNotification('Previous form data has been restored.', 'info');
                    }
                }
            }
        } catch (e) {
            console.log('Could not load form data');
        }
    }

    // Auto-save form data on input
    [firstName, lastName, email, phone, message].forEach(field => {
        field.addEventListener('input', saveFormData);
    });

    // Load saved form data on page load
    loadFormData();

    // Clear saved data when form is successfully submitted
    form.addEventListener('submit', function(e) {
        if (e.defaultPrevented === false) {
            try {
                sessionStorage.removeItem('contactFormData');
            } catch (e) {
                console.log('Could not clear form data');
            }
        }
    });
});