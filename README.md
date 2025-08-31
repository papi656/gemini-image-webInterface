# Gemini Image Generator

A simple web-based interface to interact with Google's Gemini image generation model through OpenRouter.

## Features

- Upload images directly from your device
- Enter custom prompts for image analysis/generation
- View both text and image responses from Gemini
- API key persistence using localStorage

## Setup

1. **Get an OpenRouter API Key**:
   - Visit [OpenRouter](https://openrouter.ai/) and create an account
   - Obtain your API key from the dashboard

2. **Configure the Application**:
   - Open `index.html` in a web browser
   - Enter your OpenRouter API key in the provided field
   - The API key will be saved in your browser's localStorage for future use


## Usage

1. **Enter API Key**: Provide your OpenRouter API key (saved automatically)
2. **Upload Image**: Click "Choose File" to select an image from your device
3. **Enter Prompt**: Type your question or instruction for the image
4. **Generate**: Click the "Generate" button to send the request to Gemini
5. **View Results**: See the response in the output area (text or images)

## Technical Details

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **API**: OpenRouter with Gemini 2.5 Flash Image Preview model
- **Image Handling**: File API for uploads and base64 conversion
- **Storage**: localStorage for API key persistence
- **Security**: API keys are stored client-side only (consider security implications)

## Security Note

This application runs entirely in the browser. Your API key is stored in localStorage and sent directly to OpenRouter. Be cautious about sharing the application or your API key, as anyone with access to the page can see and use your API key.

## File Structure

```
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
└── README.md           # This file
```

## API Reference

The application uses the OpenRouter API with the following endpoint:
- `POST https://openrouter.ai/api/v1/chat/completions`
- Model: `google/gemini-2.5-flash-image-preview`

## Limitations

- Client-side only - no server component
- API keys are exposed in client code
- Limited to OpenRouter's Gemini model capabilities
- File size limits for image uploads depend on browser capabilities
