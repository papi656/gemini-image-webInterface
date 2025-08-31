class GeminiImageGenerator {
    constructor() {
        this.apiKeyInput = document.getElementById('api-key');
        this.imageUpload = document.getElementById('image-upload');
        this.promptInput = document.getElementById('prompt');
        this.generateBtn = document.getElementById('generate-btn');
        this.imagePreviews = document.getElementById('image-previews');
        this.responseArea = document.getElementById('response');
        this.loading = document.getElementById('loading');
        this.promptHistory = document.getElementById('prompt-history');
        this.themeToggle = document.getElementById('theme-toggle');
        this.themeIcon = this.themeToggle.querySelector('.theme-icon');
        
        this.uploadedImages = [];
        this.uploadedImagesBase64 = [];
        
        this.initEventListeners();
        this.loadPromptHistory();
        this.initTheme();
    }
    
    initEventListeners() {
        // API key input validation
        this.apiKeyInput.addEventListener('input', () => {
            this.validateForm();
        });
        
        // Image upload handling
        this.imageUpload.addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });
        
        // Prompt input validation
        this.promptInput.addEventListener('input', () => {
            this.validateForm();
        });
        
        // Generate button click
        this.generateBtn.addEventListener('click', () => {
            this.generateResponse();
        });
        
        // Theme toggle
        this.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });
    }
    
    initTheme() {
        const savedTheme = localStorage.getItem('gemini-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Use saved theme, or system preference, or default to light
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        this.setTheme(theme);
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        localStorage.setItem('gemini-theme', newTheme);
    }
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    
    validateForm() {
        const hasApiKey = this.apiKeyInput.value.trim().length > 0;
        const hasImages = this.uploadedImages.length > 0;
        const hasPrompt = this.promptInput.value.trim().length > 0;
        const isValid = hasApiKey && hasImages && hasPrompt;
        
        this.generateBtn.disabled = !isValid;
        return isValid;
    }
    
    handleImageUpload(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;
        
        // Clear previous uploads
        this.uploadedImages = [];
        this.uploadedImagesBase64 = [];
        this.imagePreviews.innerHTML = '';
        
        files.forEach((file, index) => {
            // Check if file is an image
            if (!file.type.startsWith('image/')) {
                this.showError('Please upload only image files');
                return;
            }
            
            // Preview image
            const reader = new FileReader();
            reader.onload = (e) => {
                this.uploadedImages.push(file);
                
                // Create preview item
                const previewItem = document.createElement('div');
                previewItem.className = 'image-preview-item';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="Uploaded image ${index + 1}">
                    <button class="remove-btn" data-index="${index}">×</button>
                    <span class="image-number">${index + 1}</span>
                `;
                this.imagePreviews.appendChild(previewItem);
                
                // Add remove button listener
                previewItem.querySelector('.remove-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeImage(index);
                });
                
                // Convert to base64 for API
                this.convertImageToBase64(file, index);
            };
            reader.readAsDataURL(file);
        });
        
        this.validateForm();
    }
    
    removeImage(index) {
        this.uploadedImages.splice(index, 1);
        this.uploadedImagesBase64.splice(index, 1);
        this.updateImagePreviews();
        this.validateForm();
    }
    
    updateImagePreviews() {
        this.imagePreviews.innerHTML = '';
        this.uploadedImages.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewItem = document.createElement('div');
                previewItem.className = 'image-preview-item';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="Uploaded image ${index + 1}">
                    <button class="remove-btn" data-index="${index}">×</button>
                    <span class="image-number">${index + 1}</span>
                `;
                this.imagePreviews.appendChild(previewItem);
                
                // Add remove button listener
                previewItem.querySelector('.remove-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeImage(index);
                });
            };
            reader.readAsDataURL(file);
        });
    }
    
    convertImageToBase64(file, index) {
        const reader = new FileReader();
        reader.onload = (e) => {
            // Remove data:image/...;base64, prefix
            const base64 = e.target.result.split(',')[1];
            this.uploadedImagesBase64[index] = base64;
        };
        reader.readAsDataURL(file);
    }
    
    async generateResponse() {
        if (!this.validateForm()) return;
        
        this.showLoading(true);
        this.clearResponse();
        
        try {
            const apiKey = this.apiKeyInput.value.trim();
            const prompt = this.promptInput.value.trim();
            
            // Save prompt to history
            this.savePromptToHistory(prompt);
            
            const response = await this.callGeminiAPI(apiKey, prompt);
            this.handleAPIResponse(response);
            
        } catch (error) {
            console.error('Error:', error);
            this.showError(`Error: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }
    
    async callGeminiAPI(apiKey, prompt) {
        // Build content array with text and all images
        const content = [
            {
                type: "text",
                text: prompt
            }
        ];
        
        // Add all uploaded images to content
        this.uploadedImages.forEach((file, index) => {
            const base64 = this.uploadedImagesBase64[index];
            if (base64) {
                content.push({
                    type: "image_url",
                    image_url: {
                        url: `data:${file.type};base64,${base64}`
                    }
                });
            }
        });
        
        const requestBody = {
            model: "google/gemini-2.5-flash-image-preview",
            messages: [
                {
                    role: "user",
                    content: content
                }
            ]
        };
        
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": window.location.href,
                "X-Title": "Gemini Image Generator",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }
    
    handleAPIResponse(response) {
        if (!response.choices || response.choices.length === 0) {
            this.showError('No response from API');
            return;
        }
        
        const message = response.choices[0].message;
        if (!message) {
            this.showError('Invalid response format');
            return;
        }
        
        let responseHTML = '';
        
        // Handle text content if available
        if (message.content) {
            responseHTML += `<div class="response-text">${this.escapeHtml(message.content)}</div>`;
        }
        
        // Handle images if available
        if (message.images && message.images.length > 0) {
            for (const image of message.images) {
                if (image.type === 'image_url' && image.image_url && image.image_url.url) {
                    const imageUrl = image.image_url.url;
                    const timestamp = new Date().getTime();
                    const filename = `generated-image-${timestamp}.png`;
                    
                    responseHTML += `
                        <div class="image-container">
                            <img src="${imageUrl}" alt="Generated image" class="response-image">
                            <button class="download-btn" data-image="${imageUrl}" data-filename="${filename}">
                                Download Image
                            </button>
                        </div>
                    `;
                }
            }
        }
        
        if (responseHTML) {
            this.responseArea.innerHTML = responseHTML;
            
            // Add event listeners to download buttons
            this.addDownloadListeners();
        } else {
            this.showError('No readable content in response');
        }
    }
    
    addDownloadListeners() {
        const downloadButtons = this.responseArea.querySelectorAll('.download-btn');
        downloadButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const imageUrl = button.getAttribute('data-image');
                const filename = button.getAttribute('data-filename');
                this.downloadImage(imageUrl, filename);
            });
        });
    }
    
    downloadImage(url, filename) {
        fetch(url)
            .then(response => response.blob())
            .then(blob => {
                const blobUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = blobUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(blobUrl);
                document.body.removeChild(a);
            })
            .catch(error => {
                console.error('Download error:', error);
                this.showError('Failed to download image');
            });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showLoading(show) {
        this.loading.style.display = show ? 'flex' : 'none';
        this.generateBtn.disabled = show;
    }
    
    clearResponse() {
        this.responseArea.innerHTML = '<p class="placeholder">Your response will appear here...</p>';
    }
    
    showError(message) {
        this.responseArea.innerHTML = `<div class="error">${this.escapeHtml(message)}</div>`;
    }
    
    showSuccess(message) {
        this.responseArea.innerHTML = `<div class="success">${this.escapeHtml(message)}</div>`;
    }
    
    // Prompt history methods
    savePromptToHistory(promptText) {
        const timestamp = new Date().getTime();
        const promptData = {
            text: promptText,
            timestamp: timestamp
        };
        
        let history = this.getPromptHistory();
        
        // Remove duplicates and keep only unique prompts
        history = history.filter(item => item.text !== promptText);
        
        // Add new prompt to the beginning
        history.unshift(promptData);
        
        // Keep only the latest 5 prompts
        history = history.slice(0, 5);
        
        localStorage.setItem('gemini-prompt-history', JSON.stringify(history));
        this.displayPromptHistory(history);
    }
    
    getPromptHistory() {
        const history = localStorage.getItem('gemini-prompt-history');
        return history ? JSON.parse(history) : [];
    }
    
    loadPromptHistory() {
        const history = this.getPromptHistory();
        this.displayPromptHistory(history);
    }
    
    displayPromptHistory(history) {
        if (history.length === 0) {
            this.promptHistory.innerHTML = '<p class="placeholder">No recent prompts yet...</p>';
            return;
        }
        
        const historyHTML = history.map(prompt => `
            <div class="prompt-item" data-prompt="${this.escapeHtml(prompt.text)}">
                <div class="prompt-text">${this.escapeHtml(prompt.text)}</div>
                <div class="prompt-time">${this.formatTime(prompt.timestamp)}</div>
            </div>
        `).join('');
        
        this.promptHistory.innerHTML = historyHTML;
        this.addPromptClickListeners();
    }
    
    addPromptClickListeners() {
        const promptItems = this.promptHistory.querySelectorAll('.prompt-item');
        promptItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const prompt = item.getAttribute('data-prompt');
                this.promptInput.value = prompt;
                this.promptInput.focus();
                this.validateForm();
            });
        });
    }
    
    formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return new Date(timestamp).toLocaleDateString();
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GeminiImageGenerator();
});

// Store API key in localStorage for convenience
document.getElementById('api-key').addEventListener('blur', function() {
    if (this.value.trim()) {
        localStorage.setItem('gemini-api-key', this.value.trim());
    }
});

// Load API key from localStorage if available
document.addEventListener('DOMContentLoaded', function() {
    const savedApiKey = localStorage.getItem('gemini-api-key');
    if (savedApiKey) {
        document.getElementById('api-key').value = savedApiKey;
    }
});
