# SOLess AI Chatbot

A knowledge-based AI chatbot for the SOLess project on Solana, powered by Anthropic's Claude AI or local LLMs via Ollama.

## Features

- **AI-powered chat interface** - Answers questions about the SOLess project using Anthropic's Claude or local LLM models
- **Advanced Document Management**
  - Upload and manage PDF, Markdown, and text files
  - Import documentation directly from GitHub repositories
  - Automatic directory structure analysis
  - Smart file processing and organization
- **Knowledge Base Management**
  - Local or cloud-based storage support
  - Version tracking and backup
  - Structured content organization
- **Admin Dashboard**
  - Test the chatbot and manage knowledge
  - Monitor system performance
  - Configure bot personality
  - Manage integrations
- **Multiple Integration Options**
  - Website widget support
  - Telegram bot integration
  - RESTful API endpoints
  - Easy embedding options

## Tech Stack

- Node.js and Express for the backend
- Anthropic Claude API for production responses
- Ollama with Phind-CodeLlama for local development
- Pure JavaScript, HTML and CSS for the frontend
- No extra frontend frameworks required

## Project Structure

```
├── docs/                   # Knowledge documents folder
├── logs/                   # Log files
├── src/
│   ├── public/             # Static files
│   │   ├── admin/          # Admin dashboard
│   │   │   ├── css/        # Admin styles
│   │   │   ├── js/         # Admin scripts
│   │   │   ├── index.html  # Dashboard home
│   │   │   ├── documents.html  # Document management
│   │   │   └── integration.html # Website integration
│   │   ├── upload.html     # Legacy upload page
│   │   └── widget.js       # Website integration widget
│   ├── routes/
│   │   └── api.js          # API endpoints
│   ├── utils/
│   │   ├── documentLoader.js  # Document processing
│   │   ├── promptGenerator.js # Claude prompt creation
│   │   └── solessKnowledge.js # Core knowledge
│   ├── server.js           # Express server
│   └── telegramBot.js      # Telegram integration
├── .env                    # Environment variables
├── load-env.js             # Custom environment loader
├── package.json            # Dependencies
└── README.md               # This file
```

## Quick Setup

1. Use the deployment script:

   ```bash
   ./deploy-local.sh
   ```

   This will set up everything automatically. See [Deployment Guide](docs/deployment-guide.md) for manual setup.

2. Visit `http://localhost:3000/admin` in your browser

## Detailed Setup

1. Environment Setup:

   ```bash
   # Create and configure environment
   cp .env.example .env
   # Edit .env with your configuration:
   ANTHROPIC_API_KEY=your-actual-anthropic-api-key
   TELEGRAM_BOT_TOKEN=your-telegram-bot-token # Optional
   PORT=3000
   STORAGE_TYPE=local # or 'cloud' for cloud deployment
   ```

2. Storage Configuration:

   - Local deployment uses `./docs` directory
   - Cloud deployment supports AWS S3, Google Cloud Storage, or Azure Blob Storage

3. LLM Configuration:

   - **Production Mode**: Uses Anthropic Claude API
   - **Development Mode**: Can use local Ollama LLM to save on API costs

   ```bash
   # Set up Ollama for local development
   ./setup-ollama.sh

   # Start in development mode with Ollama prioritized
   ./start-dev.sh
   ```

4. Start the Server:

   ```bash
   # Development mode with hot reload
   npm run dev

   # Production mode
   npm start
   ```

For complete setup details and cloud deployment options, see:

- [Deployment Guide](docs/deployment-guide.md)
- [User Guide](docs/user-guide.md)
- [Ollama Local LLM Setup Guide](docs/ollama-setup-guide.md)

## Usage

### Admin Dashboard

Access the admin dashboard at `/admin` to:

- Test the SOLess chatbot directly
- Upload and manage knowledge documents
- Get code snippets for website integration

### API Endpoints

- `POST /api/conversations` - Create a new conversation
- `POST /api/conversations/:id/messages` - Send a message
- `GET /api/documents` - List all documents
- `POST /api/documents/upload` - Upload a document
- `DELETE /api/documents/:filename` - Delete a document

### Website Integration

Embed the chatbot on any website by adding the following script before the closing `</body>` tag:

```html
<!-- SOLess Chat Widget -->
<script>
  (function () {
    var script = document.createElement("script");
    script.src = "https://your-server-url/widget.js";
    script.async = true;
    document.head.appendChild(script);

    window.SOLessConfig = {
      position: "bottom-right",
      primaryColor: "#4a148c",
      welcomeMessage: "Hello! Ask me about SOLess...",
    };
  })();
</script>
```

## License

[License information]

## Contributing

[Contribution guidelines]
