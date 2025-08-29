class GeminiImageGenerator {
    constructor() {
        this.apiKeyInput = document.getElementById('api-key');
        this.imageUpload = document.getElementById('image-upload');
        this.promptInput = document.getElementById('prompt');
        this.generateBtn = document.getElementById('generate-btn');
        this.imagePreview = document.getElementById('image-preview');
        this.responseArea = document.getElementById('response');
        this.loading = document.getElementById('loading');
        
        this.uploadedImage = null;
        this.uploadedImageBase64 = null;
        
        this.initEventListeners();
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
    }
    
    validateForm() {
        const hasApiKey = this.apiKeyInput.value.trim().length > 0;
        const hasImage = this.uploadedImage !== null;
        const hasPrompt = this.promptInput.value.trim().length > 0;
        const isValid = hasApiKey && hasImage && hasPrompt;
        
        this.generateBtn.disabled = !isValid;
        return isValid;
    }
    
    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Check if file is an image
        if (!file.type.startsWith('image/')) {
            this.showError('Please upload an image file');
            return;
        }
        
        // Preview image
        const reader = new FileReader();
        reader.onload = (e) => {
            this.uploadedImage = file;
            this.imagePreview.style.display = 'flex';
            this.imagePreview.innerHTML = `<img src="${e.target.result}" alt="Uploaded image">`;
            
            // Convert to base64 for API
            this.convertImageToBase64(file);
        };
        reader.readAsDataURL(file);
        
        this.validateForm();
    }
    
    convertImageToBase64(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            // Remove data:image/...;base64, prefix
            const base64 = e.target.result.split(',')[1];
            this.uploadedImageBase64 = base64;
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
            const mimeType = this.uploadedImage.type;
            
            const response = await this.callGeminiAPI(apiKey, prompt, mimeType);
            this.handleAPIResponse(response);
            
        } catch (error) {
            console.error('Error:', error);
            this.showError(`Error: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }
    
    async callGeminiAPI(apiKey, prompt, mimeType) {
        const requestBody = {
            model: "google/gemini-2.5-flash-image-preview",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: prompt
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${mimeType};base64,${this.uploadedImageBase64}`
                            }
                        }
                    ]
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
