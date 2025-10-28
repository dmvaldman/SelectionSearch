const API_KEY_STORAGE_KEY = 'exa_api_key';

let apiKey = '';
let isVisible = false;

// Elements
const keyInputSection = document.getElementById('key-input-section');
const keyDisplaySection = document.getElementById('key-display-section');
const apiKeyInput = document.getElementById('api-key-input');
const apiKeyDisplay = document.getElementById('api-key-display');
const toggleVisibilityBtn = document.getElementById('toggle-visibility');
const toggleDisplayVisibilityBtn = document.getElementById('toggle-display-visibility');
const saveKeyBtn = document.getElementById('save-key');
const deleteKeyBtn = document.getElementById('delete-key');

// Load saved API key on popup open
async function loadApiKey() {
    try {
        const result = await chrome.storage.local.get([API_KEY_STORAGE_KEY]);
        if (result[API_KEY_STORAGE_KEY]) {
            apiKey = result[API_KEY_STORAGE_KEY];
            showKeyDisplay();
        } else {
            showKeyInput();
        }
    } catch (error) {
        console.error('Error loading API key:', error);
        showKeyInput();
    }
}

function showKeyInput() {
    keyInputSection.classList.remove('hidden');
    keyDisplaySection.classList.add('hidden');
    apiKeyInput.value = '';
    apiKeyInput.focus();
}

function showKeyDisplay() {
    keyInputSection.classList.add('hidden');
    keyDisplaySection.classList.remove('hidden');
    apiKeyDisplay.value = '●'.repeat(apiKey.length);
    isVisible = false;
    apiKeyDisplay.type = 'password';
}

function toggleVisibility(inputElement, isInputSection = true) {
    isVisible = !isVisible;
    inputElement.type = isVisible ? 'text' : 'password';

    // Toggle icon visibility
    if (isInputSection) {
        const eyeIcon = document.getElementById('eye-icon');
        const eyeSlashIcon = document.getElementById('eye-slash-icon');
        eyeIcon.style.display = isVisible ? 'none' : 'block';
        eyeSlashIcon.style.display = isVisible ? 'block' : 'none';
        // For input section, just toggle type - don't change value
    } else {
        const eyeIcon = document.getElementById('eye-display-icon');
        const eyeSlashIcon = document.getElementById('eye-slash-display-icon');
        eyeIcon.style.display = isVisible ? 'none' : 'block';
        eyeSlashIcon.style.display = isVisible ? 'block' : 'none';
        // For display section, show/hide the actual key
        if (isVisible) {
            inputElement.value = apiKey;
        } else {
            inputElement.value = '●'.repeat(apiKey.length);
        }
    }
}

async function saveApiKey() {
    const key = apiKeyInput.value.trim();

    if (!key) {
        alert('Please enter an API key');
        return;
    }

    try {
        await chrome.storage.local.set({ [API_KEY_STORAGE_KEY]: key });
        apiKey = key;
        showKeyDisplay();
    } catch (error) {
        console.error('Error saving API key:', error);
        alert('Failed to save API key. Please try again.');
    }
}

async function deleteApiKey() {
    if (!confirm('Are you sure you want to delete your API key?')) {
        return;
    }

    try {
        await chrome.storage.local.remove([API_KEY_STORAGE_KEY]);
        apiKey = '';
        showKeyInput();
    } catch (error) {
        console.error('Error deleting API key:', error);
    }
}

// Event listeners
toggleVisibilityBtn.addEventListener('click', () => {
    toggleVisibility(apiKeyInput, true);
});

toggleDisplayVisibilityBtn.addEventListener('click', () => {
    toggleVisibility(apiKeyDisplay, false);
});

saveKeyBtn.addEventListener('click', saveApiKey);

deleteKeyBtn.addEventListener('click', deleteApiKey);

apiKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        saveApiKey();
    }
});

// Initialize
loadApiKey();

