//----------ADD SAVINGS OR SAVING GOALS----------
// Fungsi untuk menampilkan notifikasi
function showNotification(message, type = 'success') {
    // Hapus notifikasi yang sudah ada
    const existingNotification = document.getElementById('notification-addSave');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Buat elemen notifikasi baru
    const notification = document.createElement('div');
    notification.id = 'notification-addSave';
    notification.className = 'notification-addSave';

    // Set styles langsung dengan JavaScript
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        max-width: 400px;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
        color: white;
        font-family: 'Poppins', sans-serif;
        font-size: 0.9rem;
        font-weight: 500;
        transform: translateX(100%);
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        opacity: 0;
        pointer-events: none;
    `;

    // Set warna background berdasarkan tipe
    let backgroundColor, iconText;
    switch (type) {
        case 'success':
            backgroundColor = '#4CAF50';
            iconText = '✓';
            break;
        case 'error':
            backgroundColor = '#f44336';
            iconText = '✗';
            break;
        case 'warning':
            backgroundColor = '#ff9800';
            iconText = '⚠';
            break;
        default:
            backgroundColor = '#4CAF50';
            iconText = '✓';
    }

    notification.style.background = backgroundColor;

    // Set konten notifikasi
    notification.innerHTML = `
        <div class="notification-content-addSave" style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="notification-icon-addSave" style="font-size: 1.2rem; font-weight: bold;">${iconText}</span>
            <span class="notification-message-addSave">${message}</span>
        </div>
    `;

    // Tambahkan ke body
    document.body.appendChild(notification);

    // Trigger animasi masuk dengan delay kecil
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
        notification.style.pointerEvents = 'auto';
    }, 50);

    // Animasi keluar setelah 4 detik
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        notification.style.pointerEvents = 'none';

        // Hapus elemen setelah animasi selesai
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 400);
    }, 4000);
}

// Fungsi untuk format angka dengan titik sebagai pemisah ribuan
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Fungsi untuk menghapus format dan mendapatkan angka asli
function unformatNumber(str) {
    return str.replace(/\./g, '');
}

// Fungsi untuk format mata uang Indonesia
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Validate the saving goal form. A new goal needs a future target date;
// an edited goal only needs a target date after the day it started.
function validateForm(formData, startDate) {
    const errors = [];

    // Validasi nama savings (tidak boleh kosong dan minimal 3 karakter)
    if (!formData.savingsName.trim()) {
        errors.push('Please enter a name for your saving goal.');
    } else if (formData.savingsName.trim().length < 3) {
        errors.push('The name must be at least 3 characters.');
    }

    // Validasi deskripsi (tidak boleh kosong dan minimal 5 karakter)
    if (!formData.savingsDescription.trim()) {
        errors.push('Please enter a short description.');
    } else if (formData.savingsDescription.trim().length < 5) {
        errors.push('The description must be at least 5 characters.');
    }

    // Validasi goal savings (harus angka positif dan minimal 10000)
    const goalString = unformatNumber(formData.savingsGoal);
    const goal = parseFloat(goalString);
    if (!goalString || isNaN(goal)) {
        errors.push('The savings goal must be a number.');
    } else if (goal <= 0) {
        errors.push('The savings goal must be more than Rp 0.');
    } else if (goal < 10000) {
        errors.push('The savings goal must be at least Rp 10.000.');
    }

    // Validasi periode (tidak boleh kosong dan tidak boleh tanggal masa lalu)
    if (!formData.savingsPeriod) {
        errors.push('Please choose a target date.');
    } else {
        if (startDate) {
            if (formData.savingsPeriod <= startDate) {
                errors.push('The target date must be after the start date (' + Moneyst.formatDate(startDate) + ').');
            }
        } else {
            const selectedDate = new Date(formData.savingsPeriod);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate <= today) {
                errors.push('The target date must be after today.');
            }
        }
    }

    return errors;
}

// Save the goal to the shared store (data.js); returns the saved goal or null
function saveSavingsData(formData) {
    try {
        return Moneyst.add('goal', {
            name: formData.savingsName.trim(),
            description: formData.savingsDescription.trim(),
            target: parseFloat(unformatNumber(formData.savingsGoal)),
            startDate: Moneyst.todayISO(),
            targetDate: formData.savingsPeriod
        });
    } catch (error) {
        console.error('Error saving data:', error);
        return null;
    }
}

// Event listener utama
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('savingsForm-addSave');
    const goalInput = document.getElementById('savingsGoal');

    // PENTING: Ubah type input dari number ke text
    if (goalInput) {
        goalInput.type = 'text';
        goalInput.inputMode = 'numeric';
        goalInput.pattern = '[0-9.]*';
    }

    // Setup input formatting untuk goal
    if (goalInput) {
        // Simpan posisi cursor
        let cursorPosition = 0;

        // Event untuk input real-time
        goalInput.addEventListener('input', function(e) {
            // Simpan posisi cursor sebelum formatting
            cursorPosition = e.target.selectionStart;

            let value = e.target.value;
            let originalLength = value.length;

            // Hapus semua karakter non-digit
            let cleanValue = value.replace(/[^\d]/g, '');

            // Jika tidak ada angka, kosongkan input
            if (!cleanValue) {
                e.target.value = '';
                // Hapus preview
                const existingPreview = goalInput.parentNode.querySelector('.currency-preview');
                if (existingPreview) {
                    existingPreview.remove();
                }
                return;
            }

            // Format dengan titik sebagai pemisah ribuan
            const formatted = formatNumber(cleanValue);
            e.target.value = formatted;

            // Hitung perubahan panjang untuk adjust cursor
            let newLength = formatted.length;
            let lengthDiff = newLength - originalLength;

            // Adjust posisi cursor
            let newCursorPos = cursorPosition + lengthDiff;

            // Pastikan cursor tidak keluar batas
            if (newCursorPos < 0) newCursorPos = 0;
            if (newCursorPos > formatted.length) newCursorPos = formatted.length;

            // Set posisi cursor yang baru
            setTimeout(() => {
                e.target.setSelectionRange(newCursorPos, newCursorPos);
            }, 0);

            // Hapus preview lama jika ada
            const existingPreview = goalInput.parentNode.querySelector('.currency-preview');
            if (existingPreview) {
                existingPreview.remove();
            }

            // Tampilkan preview mata uang
            if (cleanValue && parseInt(cleanValue) > 0) {
                const preview = document.createElement('small');
                preview.className = 'currency-preview';
                preview.style.cssText = `
                    display: block;
                    color: #666;
                    font-size: 0.8rem;
                    margin-top: 0.25rem;
                    font-style: italic;
                `;
                preview.textContent = `≈ ${formatCurrency(parseInt(cleanValue))}`;
                goalInput.parentNode.appendChild(preview);
            }
        });

        // Event untuk keydown - handle special keys
        goalInput.addEventListener('keydown', function(e) {
            // Allow: backspace, delete, tab, escape, enter
            if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
                // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                (e.keyCode === 65 && e.ctrlKey === true) ||
                (e.keyCode === 67 && e.ctrlKey === true) ||
                (e.keyCode === 86 && e.ctrlKey === true) ||
                (e.keyCode === 88 && e.ctrlKey === true) ||
                // Allow: home, end, left, right
                (e.keyCode >= 35 && e.keyCode <= 39)) {
                return;
            }
            // Ensure that it is a number and stop the keypress
            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
            }
        });

        // Event untuk paste
        goalInput.addEventListener('paste', function(e) {
            e.preventDefault();

            // Ambil data dari clipboard
            let paste = (e.clipboardData || window.clipboardData).getData('text');

            // Hapus semua karakter non-digit dari paste
            let cleanPaste = paste.replace(/[^\d]/g, '');

            if (cleanPaste) {
                // Set nilai yang sudah dibersihkan
                let currentValue = unformatNumber(e.target.value);
                let newValue = currentValue + cleanPaste;

                // Format dan set ke input
                e.target.value = formatNumber(newValue);

                // Trigger input event untuk update preview
                e.target.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        // Pastikan cursor berada di akhir saat focus pertama kali
        goalInput.addEventListener('focus', function(e) {
            if (!e.target.value) return;

            setTimeout(() => {
                e.target.setSelectionRange(e.target.value.length, e.target.value.length);
            }, 10);
        });
    }

    // Edit mode: addSavings.html?edit=<goal id> fills the form with that goal
    const editId = new URLSearchParams(window.location.search).get('edit');
    const editingGoal = form && editId && window.Moneyst ? Moneyst.find('goal', editId) : null;
    if (editingGoal) {
        document.title = "Money'st - Edit Saving Goal";
        const heading = document.querySelector('.section-header-addSave h2');
        if (heading) heading.textContent = 'Edit Saving Goal';
        document.getElementById('savingsName').value = editingGoal.name;
        document.getElementById('savingsDescription').value = editingGoal.description || '';
        goalInput.value = formatNumber(editingGoal.target);
        document.getElementById('savingsPeriod').value = editingGoal.targetDate || '';
        const saveButton = form.querySelector('.save-btn');
        saveButton.textContent = 'Save Changes';
        const cancel = document.createElement('a');
        cancel.href = 'viewSavings.html#' + editingGoal.id;
        cancel.className = 'mst-cancel-edit';
        cancel.textContent = 'Cancel';
        saveButton.after(cancel);
    }

    // Event listener untuk form submission
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            // Ambil data dari form
            const formData = {
                savingsName: document.getElementById('savingsName').value,
                savingsDescription: document.getElementById('savingsDescription').value,
                savingsGoal: document.getElementById('savingsGoal').value,
                savingsPeriod: document.getElementById('savingsPeriod').value
            };

            // Validasi form
            const validationErrors = validateForm(formData, editingGoal ? editingGoal.startDate : null);

            if (validationErrors.length > 0) {
                showNotification(validationErrors[0], 'error');
                return;
            }

            // Editing: update the goal, then show it in View Savings with Undo
            if (editingGoal) {
                const before = Moneyst.update('goal', editingGoal.id, {
                    name: formData.savingsName.trim(),
                    description: formData.savingsDescription.trim(),
                    target: parseFloat(unformatNumber(formData.savingsGoal)),
                    targetDate: formData.savingsPeriod
                });
                Moneyst.setFlash({
                    message: `Changes to "${formData.savingsName.trim()}" saved.`,
                    undo: { type: 'goal', id: editingGoal.id, restore: before }
                });
                window.location.href = `viewSavings.html?new=${encodeURIComponent(editingGoal.id)}`;
                return;
            }

            // Save, then show the new goal in View Savings
            const savedGoal = saveSavingsData(formData);

            if (savedGoal) {
                Moneyst.setFlash({
                    message: `Saving goal "${savedGoal.name}" with a target of ${Moneyst.formatRupiah(savedGoal.target)} created.`,
                    undo: { type: 'goal', id: savedGoal.id }
                });
                window.location.href = `viewSavings.html?new=${encodeURIComponent(savedGoal.id)}`;
            } else {
                showNotification('Your saving goal could not be saved. Please try again.', 'error');
            }
        });
    }
});

// Fungsi untuk membersihkan preview
function clearFormPreviews() {
    const previews = document.querySelectorAll('.currency-preview');
    previews.forEach(preview => preview.remove());
}

// Override form reset untuk membersihkan preview
const originalReset = HTMLFormElement.prototype.reset;
HTMLFormElement.prototype.reset = function() {
    originalReset.call(this);
    clearFormPreviews();
};




//----------HELP PAGE---------
// FAQ Toggle Functionality
function toggleFAQ(id) {
    const answer = document.getElementById(`answer-${id}`);
    const icon = document.getElementById(`icon-${id}`);

    // Toggle the active class on the answer
    answer.classList.toggle('active');

    // Toggle the rotation of the icon
    icon.classList.toggle('rotated');

    // Optional: Close other FAQ items when one is opened (accordion behavior)
    // Uncomment the lines below if you want only one FAQ to be open at a time
    /*
    for (let i = 1; i <= 6; i++) {
        if (i !== id) {
            const otherAnswer = document.getElementById(`answer-${i}`);
            const otherIcon = document.getElementById(`icon-${i}`);
            otherAnswer.classList.remove('active');
            otherIcon.classList.remove('rotated');
        }
    }
    */
}

// Smooth scrolling for navigation links (if needed)
document.addEventListener('DOMContentLoaded', function() {
    // Add smooth scrolling to all links
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add loading animation to FAQ items
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';

        setTimeout(() => {
            item.style.transition = 'all 0.6s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 100);
    });
});

// Add keyboard navigation for accessibility
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        const focusedElement = document.activeElement;

        if (focusedElement.classList.contains('faq-question')) {
            e.preventDefault();
            focusedElement.click();
        }
    }
});

// Make FAQ questions focusable for keyboard navigation
document.addEventListener('DOMContentLoaded', function() {
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.setAttribute('tabindex', '0');
        question.setAttribute('role', 'button');
        question.setAttribute('aria-expanded', 'false');

        // Update aria-expanded when FAQ is toggled
        question.addEventListener('click', function() {
            const isExpanded = this.nextElementSibling.classList.contains('active');
            this.setAttribute('aria-expanded', isExpanded);
        });
    });
});


function toggleHelp(section) {
    const answer = document.getElementById(`answer-${section}`);
    const arrow = document.getElementById(`arrow-${section}`);

    // Close all other sections
    const allAnswers = document.querySelectorAll('.help-answer');
    const allArrows = document.querySelectorAll('.dropdown-arrow');

    allAnswers.forEach(item => {
        if (item !== answer) {
            item.classList.remove('active');
        }
    });

    allArrows.forEach(item => {
        if (item !== arrow) {
            item.classList.remove('rotated');
        }
    });

    // Toggle current section
    answer.classList.toggle('active');
    arrow.classList.toggle('rotated');
}

// Add smooth scrolling effect when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Add fade-in animation to help cards
    const cards = document.querySelectorAll('.help-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';

        setTimeout(() => {
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
});

// Add keyboard navigation support
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // Close all open sections when ESC is pressed
        const allAnswers = document.querySelectorAll('.help-answer');
        const allArrows = document.querySelectorAll('.dropdown-arrow');

        allAnswers.forEach(item => {
            item.classList.remove('active');
        });

        allArrows.forEach(item => {
            item.classList.remove('rotated');
        });
    }
});

// Add click outside to close functionality
document.addEventListener('click', function(e) {
    if (!e.target.closest('.help-card')) {
        // Close all sections if clicking outside
        const allAnswers = document.querySelectorAll('.help-answer');
        const allArrows = document.querySelectorAll('.dropdown-arrow');

        allAnswers.forEach(item => {
            item.classList.remove('active');
        });

        allArrows.forEach(item => {
            item.classList.remove('rotated');
        });
    }
});