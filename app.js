// DOM Elements
const loadingScreen = document.getElementById('loadingScreen');
const noteFormContainer = document.getElementById('noteFormContainer');
const noteForm = document.getElementById('noteForm');
const noteIdInput = document.getElementById('noteId');
const noteTitleInput = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');
const createNewNoteBtn = document.getElementById('createNewNoteBtn');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const saveSecretNoteBtn = document.getElementById('saveSecretNoteBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const notesList = document.getElementById('notesList');
const emptyState = document.getElementById('emptyState');
const deleteAllBtn = document.getElementById('deleteAllBtn');

// Settings Elements
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const themeToggle = document.getElementById('themeToggle');
const decreaseFontBtn = document.getElementById('decreaseFontBtn');
const increaseFontBtn = document.getElementById('increaseFontBtn');
const currentFontSize = document.getElementById('currentFontSize');
const fontFamilySelect = document.getElementById('fontFamilySelect');
const autosaveToggle = document.getElementById('autosaveToggle');

// Delete Modal Elements
const deleteModal = document.getElementById('deleteModal');
const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// Delete All Modal Elements
const deleteAllModal = document.getElementById('deleteAllModal');
const closeDeleteAllModalBtn = document.getElementById('closeDeleteAllModalBtn');
const cancelDeleteAllBtn = document.getElementById('cancelDeleteAllBtn');
const confirmDeleteAllBtn = document.getElementById('confirmDeleteAllBtn');

// PIN Modal Elements
const pinModal = document.getElementById('pinModal');
const closePinModalBtn = document.getElementById('closePinModalBtn');
const pinInput = document.getElementById('pinInput');
const cancelPinBtn = document.getElementById('cancelPinBtn');
const verifyPinBtn = document.getElementById('verifyPinBtn');

// Notification Element
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notificationMessage');

// Global Variables
let notes = [];
let noteToDelete = null;
let secretNoteToEdit = null;
const correctPin = '1234'; // Default PIN for secret notes

// Default settings
let settings = {
    darkMode: true, // Default to dark mode
    fontSize: 'medium',
    fontSizeValue: 16,
    fontFamily: 'Arial, sans-serif',
    autoSave: false
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Show loading screen for 3 seconds
    showLoadingScreen();
    
    // Load notes and settings from localStorage
    loadNotesFromStorage();
    loadSettingsFromStorage();
    
    // Apply settings
    applySettings();
    
    // Create New Note Button
    createNewNoteBtn.addEventListener('click', showNoteForm);
    
    // Event Listeners for Note Form
    saveNoteBtn.addEventListener('click', saveNote);
    saveSecretNoteBtn.addEventListener('click', saveSecretNote);
    cancelEditBtn.addEventListener('click', cancelEdit);
    
    // Auto-save functionality
    if (settings.autoSave) {
        noteContent.addEventListener('input', debounce(() => {
            if (noteTitleInput.value.trim() || noteContent.innerHTML.trim()) {
                saveNote();
            }
        }, 2000));
        
        noteTitleInput.addEventListener('input', debounce(() => {
            if (noteTitleInput.value.trim() || noteContent.innerHTML.trim()) {
                saveNote();
            }
        }, 2000));
    }
    
    // Event Listeners for Modals
    settingsBtn.addEventListener('click', openSettingsModal);
    closeSettingsBtn.addEventListener('click', closeSettingsModal);
    
    closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    confirmDeleteBtn.addEventListener('click', confirmDelete);
    
    deleteAllBtn.addEventListener('click', openDeleteAllModal);
    closeDeleteAllModalBtn.addEventListener('click', closeDeleteAllModal);
    cancelDeleteAllBtn.addEventListener('click', closeDeleteAllModal);
    confirmDeleteAllBtn.addEventListener('click', confirmDeleteAll);
    
    closePinModalBtn.addEventListener('click', closePinModal);
    cancelPinBtn.addEventListener('click', closePinModal);
    verifyPinBtn.addEventListener('click', verifyPin);
    
    // Settings Event Listeners
    themeToggle.addEventListener('change', toggleDarkMode);
    decreaseFontBtn.addEventListener('click', decreaseFontSize);
    increaseFontBtn.addEventListener('click', increaseFontSize);
    fontFamilySelect.addEventListener('change', changeFontFamily);
    autosaveToggle.addEventListener('change', toggleAutoSave);
    
    // PIN Modal - Enter key for submission
    pinInput.addEventListener('keyup', e => {
        if (e.key === 'Enter') {
            verifyPin();
        }
    });
});

/**
 * Show a custom notification
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, error, warning, info)
 * @param {number} duration - The duration in milliseconds
 */
function showNotification(message, type = 'info', duration = 2000) {
    notificationMessage.textContent = message;
    notification.className = 'notification ' + type;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - The function to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} - The debounced function
 */
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

/**
 * Load notes from localStorage
 */
function loadNotesFromStorage() {
    const storedNotes = localStorage.getItem('simple-notes');
    if (storedNotes) {
        try {
            notes = JSON.parse(storedNotes);
            renderNotes();
        } catch (error) {
            console.error('Error parsing notes from localStorage:', error);
            notes = [];
        }
    }
    
    // Show empty state if no notes
    updateEmptyState();
}

/**
 * Save notes to localStorage
 */
function saveNotesToStorage() {
    localStorage.setItem('simple-notes', JSON.stringify(notes));
    updateEmptyState();
}

/**
 * Update the empty state visibility
 */
function updateEmptyState() {
    if (notes.length === 0) {
        notesList.classList.add('hidden');
        emptyState.classList.remove('hidden');
    } else {
        notesList.classList.remove('hidden');
        emptyState.classList.add('hidden');
    }
}

/**
 * Render all notes
 */
function renderNotes() {
    // Clear notes list
    notesList.innerHTML = '';
    
    // Sort notes by timestamp (newest first)
    const sortedNotes = [...notes].sort((a, b) => b.timestamp - a.timestamp);
    
    // Create and append note elements
    sortedNotes.forEach(note => {
        const noteElement = createNoteElement(note);
        notesList.appendChild(noteElement);
    });
    
    updateEmptyState();
}

/**
 * Save a new note or update an existing one
 */
async function saveNote() {
    const title = noteTitleInput.value.trim();
    const content = noteContent.innerHTML.trim();
    
    // Validate input
    if (title === '' && content === '') {
        showNotification('Please enter a title or content for your note.', 'error');
        return;
    }
    
    const timestamp = Date.now();
    const noteId = noteIdInput.value;
    
    if (noteId) {
        // Update existing note
        const index = notes.findIndex(note => note.id === noteId);
        if (index !== -1) {
            notes[index] = {
                ...notes[index],
                title,
                content,
                timestamp
            };
        }
    } else {
        // Create new note
        const newNote = {
            id: generateNoteId(),
            title,
            content,
            timestamp,
            isSecret: false
        };
        notes.push(newNote);
    }
    
    // Save to localStorage
    saveNotesToStorage();
    
    // Reset form
    resetForm();
    
    // Hide the form container
    noteFormContainer.classList.add('hidden');
    
    // Re-render notes
    renderNotes();
    
    // Show notification
    showNotification('Note saved successfully!', 'success');
}

/**
 * Generate a unique ID for a new note
 * @returns {string} - A unique ID
 */
function generateNoteId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Set up form for editing a note
 * @param {string} id - The ID of the note to edit
 */
function editNote(id) {
    const note = notes.find(note => note.id === id);
    if (note) {
        // Show the form container first
        noteFormContainer.classList.remove('hidden');
        
        noteIdInput.value = note.id;
        noteTitleInput.value = note.title;
        
        // Set the HTML content
        noteContent.innerHTML = note.content;
        
        // Focus on title
        noteTitleInput.focus();
        
        // Scroll to the form
        noteFormContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Cancel the edit operation and reset the form
 */
function cancelEdit() {
    resetForm();
    // Hide the form container
    noteFormContainer.classList.add('hidden');
}

/**
 * Reset the note form
 */
function resetForm() {
    noteIdInput.value = '';
    noteTitleInput.value = '';
    noteContent.innerHTML = '';
}

/**
 * Open the delete confirmation modal
 * @param {string} id - The ID of the note to delete
 */
function openDeleteModal(id) {
    noteToDelete = id;
    deleteModal.style.display = 'flex';
}

/**
 * Close the delete confirmation modal
 */
function closeDeleteModal() {
    deleteModal.style.display = 'none';
    noteToDelete = null;
}

/**
 * Confirm deletion of a note
 */
function confirmDelete() {
    if (noteToDelete) {
        // Remove note from array
        notes = notes.filter(note => note.id !== noteToDelete);
        
        // Save updated notes array to localStorage
        saveNotesToStorage();
        
        // Re-render notes
        renderNotes();
        
        // Close modal
        closeDeleteModal();
        
        // Reset form if we were editing the deleted note
        if (noteIdInput.value === noteToDelete) {
            resetForm();
        }
        
        // Show notification
        showNotification('Note deleted successfully', 'info');
    }
}

/**
 * Open the delete all notes confirmation modal
 */
function openDeleteAllModal() {
    deleteAllModal.style.display = 'flex';
}

/**
 * Close the delete all notes confirmation modal
 */
function closeDeleteAllModal() {
    deleteAllModal.style.display = 'none';
}

/**
 * Confirm deletion of all notes
 */
function confirmDeleteAll() {
    // Clear notes array
    notes = [];
    
    // Clear localStorage 
    saveNotesToStorage();
    
    // Re-render notes (will show empty state)
    renderNotes();
    
    // Close modal
    closeDeleteAllModal();
    
    // Reset form
    resetForm();
    
    // Show notification
    showNotification('All notes deleted!', 'warning');
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - The text to escape
 * @returns {string} - The escaped text
 */
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Settings Functions
 */

/**
 * Load settings from localStorage
 */
function loadSettingsFromStorage() {
    const storedSettings = localStorage.getItem('simple-note-settings');
    if (storedSettings) {
        try {
            const parsedSettings = JSON.parse(storedSettings);
            settings = { ...settings, ...parsedSettings };
        } catch (error) {
            console.error('Error parsing settings from localStorage:', error);
        }
    }
}

/**
 * Save settings to localStorage
 */
function saveSettingsToStorage() {
    localStorage.setItem('simple-note-settings', JSON.stringify(settings));
}

/**
 * Apply current settings to the UI
 */
function applySettings() {
    // Apply theme
    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
        themeToggle.checked = true;
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.checked = false;
    }
    
    // Apply font size
    document.documentElement.style.setProperty('--font-size-base', `${settings.fontSizeValue}px`);
    currentFontSize.textContent = settings.fontSize.charAt(0).toUpperCase() + settings.fontSize.slice(1);
    
    // Apply font family
    document.body.style.fontFamily = settings.fontFamily;
    fontFamilySelect.value = settings.fontFamily;
    
    // Apply auto-save
    autosaveToggle.checked = settings.autoSave;
}

/**
 * Open the settings modal
 */
function openSettingsModal() {
    settingsModal.style.display = 'flex';
}

/**
 * Close the settings modal
 */
function closeSettingsModal() {
    settingsModal.style.display = 'none';
}

/**
 * Toggle dark mode
 */
function toggleDarkMode() {
    settings.darkMode = themeToggle.checked;
    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
        showNotification('Dark mode enabled', 'info');
    } else {
        document.body.classList.remove('dark-mode');
        showNotification('Light mode enabled', 'info');
    }
    saveSettingsToStorage();
}

/**
 * Decrease font size
 */
function decreaseFontSize() {
    if (settings.fontSizeValue > 12) {
        settings.fontSizeValue -= 2;
        updateFontSizeDisplay();
        saveSettingsToStorage();
    }
}

/**
 * Increase font size
 */
function increaseFontSize() {
    if (settings.fontSizeValue < 24) {
        settings.fontSizeValue += 2;
        updateFontSizeDisplay();
        saveSettingsToStorage();
    }
}

/**
 * Update font size display and apply the change
 */
function updateFontSizeDisplay() {
    if (settings.fontSizeValue <= 14) {
        settings.fontSize = 'small';
    } else if (settings.fontSizeValue <= 18) {
        settings.fontSize = 'medium';
    } else {
        settings.fontSize = 'large';
    }
    
    document.documentElement.style.setProperty('--font-size-base', `${settings.fontSizeValue}px`);
    currentFontSize.textContent = settings.fontSize.charAt(0).toUpperCase() + settings.fontSize.slice(1);
    
    // Show notification about font size change
    showNotification(`Font size changed to ${settings.fontSize}`, 'info');
}

/**
 * Change font family
 */
function changeFontFamily() {
    settings.fontFamily = fontFamilySelect.value;
    document.body.style.fontFamily = settings.fontFamily;
    saveSettingsToStorage();
    showNotification(`Font changed to ${settings.fontFamily.split(',')[0]}`, 'info');
}

/**
 * Toggle auto-save feature
 */
function toggleAutoSave() {
    settings.autoSave = autosaveToggle.checked;
    saveSettingsToStorage();
    
    if (settings.autoSave) {
        showNotification('Auto-save enabled', 'info');
        // Add event listeners for auto-save
        noteContent.addEventListener('input', debounce(() => {
            if (noteTitleInput.value.trim() || noteContent.innerHTML.trim()) {
                saveNote();
            }
        }, 2000));
        
        noteTitleInput.addEventListener('input', debounce(() => {
            if (noteTitleInput.value.trim() || noteContent.innerHTML.trim()) {
                saveNote();
            }
        }, 2000));
    } else {
        showNotification('Auto-save disabled', 'info');
        // Remove event listeners for auto-save
        noteContent.removeEventListener('input', debounce);
        noteTitleInput.removeEventListener('input', debounce);
    }
}

/**
 * Save a new secret note or update an existing one
 */
function saveSecretNote() {
    const title = noteTitleInput.value.trim();
    const content = noteContent.innerHTML.trim();
    
    // Validate input
    if (title === '' && content === '') {
        showNotification('Please enter a title or content for your note.', 'error');
        return;
    }
    
    const timestamp = Date.now();
    const noteId = noteIdInput.value;
    
    if (noteId) {
        // Update existing note
        const index = notes.findIndex(note => note.id === noteId);
        if (index !== -1) {
            notes[index] = {
                ...notes[index],
                title,
                content,
                timestamp,
                isSecret: true
            };
        }
    } else {
        // Create new secret note
        const newNote = {
            id: generateNoteId(),
            title,
            content,
            timestamp,
            isSecret: true
        };
        notes.push(newNote);
    }
    
    // Save to localStorage
    saveNotesToStorage();
    
    // Reset form
    resetForm();
    
    // Hide the form container
    noteFormContainer.classList.add('hidden');
    
    // Re-render notes
    renderNotes();
    
    // Show notification
    showNotification('Secret Note Saved!', 'success');
}

/**
 * Create a DOM element for a note
 * @param {Object} note - The note object
 * @returns {HTMLElement} - The note DOM element
 */
function createNoteElement(note) {
    const noteElement = document.createElement('div');
    noteElement.classList.add('note');
    noteElement.dataset.id = note.id;
    
    // Add secret note class if it's a secret note
    if (note.isSecret) {
        noteElement.classList.add('secret-note');
    }
    
    // Format timestamp
    const date = new Date(note.timestamp);
    const formattedDate = date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Create the HTML structure
    noteElement.innerHTML = `
        <h3 class="note-title">${note.isSecret ? '[unlock to view]' : escapeHTML(note.title)}</h3>
        <div class="note-timestamp">Last modified: ${formattedDate}</div>
        ${note.isSecret ? 
            `<div class="note-content">[Protected Content]</div>` : 
            `<div class="note-content">${note.content}</div>`}
        <div class="note-actions">
            <button class="edit-btn" aria-label="Edit note">
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete-btn" aria-label="Delete note">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;
    
    // Add event listeners to buttons
    const editBtn = noteElement.querySelector('.edit-btn');
    const deleteBtn = noteElement.querySelector('.delete-btn');
    
    // For secret notes, we need PIN verification before editing
    if (note.isSecret) {
        editBtn.addEventListener('click', () => openPinModalForEdit(note.id));
    } else {
        editBtn.addEventListener('click', () => editNote(note.id));
    }
    
    deleteBtn.addEventListener('click', () => openDeleteModal(note.id));
    
    return noteElement;
}

/**
 * Open PIN verification modal to edit a secret note
 * @param {string} id - The ID of the note to edit
 */
function openPinModalForEdit(id) {
    secretNoteToEdit = id;
    pinInput.value = '';
    pinModal.style.display = 'flex';
    pinInput.focus();
}

/**
 * Close the PIN verification modal
 */
function closePinModal() {
    pinModal.style.display = 'none';
    secretNoteToEdit = null;
    pinInput.value = '';
}

/**
 * Verify the PIN and edit the note if correct
 */
function verifyPin() {
    const enteredPin = pinInput.value.trim();
    
    if (enteredPin === correctPin) {
        const noteId = secretNoteToEdit;
        closePinModal();
        
        if (noteId) {
            editNote(noteId);
        }
    } else {
        // Show error message
        showNotification('Incorrect PIN! Please try again.', 'error');
        pinInput.value = '';
        pinInput.focus();
    }
}

/**
 * Show loading screen for a specified duration
 * @param {number} duration - Duration in milliseconds
 */
function showLoadingScreen(duration = 3000) {
    // Make sure loading screen is visible
    loadingScreen.classList.remove('hidden');
    
    // Apply dark mode to loading screen if setting is enabled
    if (settings.darkMode) {
        loadingScreen.classList.add('dark-mode');
    }
    
    // Hide loading screen after the specified duration
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
    }, duration);
}

/**
 * Show the note form when creating a new note
 */
function showNoteForm() {
    // Show the form container
    noteFormContainer.classList.remove('hidden');
    
    // Reset form fields
    resetForm();
    
    // Focus on the title input
    noteTitleInput.focus();
    
    // Scroll to the form
    noteFormContainer.scrollIntoView({ behavior: 'smooth' });
}