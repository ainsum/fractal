# Fractal 🌐

An AI-powered desktop web browser that generates website content using Large Language Models. Instead of fetching websites from the internet, this application creates realistic website content using AI when you enter a URL.

## ✨ Features

- **AI-Powered Content Generation**: Generate realistic website content for any domain using state-of-the-art LLMs
- **Multiple AI Providers**: Support for OpenAI GPT-4, Anthropic Claude, and Google Gemini
- **Streaming Responses**: Real-time content generation with progress indicators
- **Modern UI**: Clean, responsive interface with dark mode support
- **Navigation Controls**: Back, forward, refresh, and home buttons
- **History Management**: Track your browsing history
- **Security**: Secure content sanitization and sandboxed rendering
- **Cross-Platform**: Works on Windows, macOS, and Linux

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 8+
- API keys for at least one AI provider:
  - OpenAI API key
  - Anthropic API key
  - Google AI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/chcardoz/llm-browser.git
   cd llm-browser
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   GOOGLE_API_KEY=your_google_api_key_here
   NODE_ENV=development
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the application for production
- `npm run test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Check code with Biome
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Biome
- `npm run type-check` - Run TypeScript type checking

### Git Hooks & Code Quality

This project uses **Husky** and **lint-staged** for automated code quality checks:

#### Pre-commit Hooks
- **Linting**: Automatically runs Biome on staged files
- **Formatting**: Ensures consistent code formatting
- **Type Checking**: Validates TypeScript types

#### Pre-push Hooks
- **Type Checking**: Ensures all TypeScript types are valid
- **Tests**: Runs the full test suite before pushing

#### Commit Message Validation
- **Conventional Commits**: Enforces conventional commit message format
- **Examples**: `feat: add new feature`, `fix: resolve bug`, `docs: update readme`

#### Setup
The hooks are automatically installed when you run `npm install`. To manually set up:
```bash
npm run prepare
```

### Project Structure

```
llm-browser/
├── src/
│   ├── main/              # Main process (Electron backend)
│   │   ├── main.ts        # Main process entry point
│   │   ├── preload.ts     # Preload script for IPC
│   │   └── llm-service.ts # AI service implementation
│   ├── renderer/          # Renderer process (Frontend)
│   │   ├── renderer.ts    # Renderer entry point
│   │   ├── browser-ui.ts  # Browser UI component
│   │   └── styles/
│   │       └── main.css   # Main styles
│   ├── shared/           # Shared types and utilities
│   │   ├── types.ts      # TypeScript type definitions
│   │   └── constants.ts  # Application constants
│   └── __tests__/        # Test files
├── assets/              # Icons and images
├── docs/               # Documentation
└── config files
```

## 🎯 Usage

1. **Launch the application**
   - The app will open with a welcome screen showing example URLs

2. **Enter a URL**
   - Type any domain in the address bar (e.g., `google.com`, `facebook.com`)
   - Press Enter or click the navigation button

3. **Watch AI generate content**
   - The app will use AI to generate realistic website content
   - You'll see a progress indicator during generation
   - Content appears in real-time as it's generated

4. **Navigate and explore**
   - Use the back/forward buttons to navigate history
   - Switch between AI providers using the dropdown
   - Refresh to regenerate content

## 🤖 AI Providers

The application supports multiple AI providers:

### OpenAI GPT-4
- **Models**: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- **Best for**: General website generation, creative content
- **Setup**: Add `OPENAI_API_KEY` to your `.env` file

### Anthropic Claude
- **Models**: Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku
- **Best for**: Detailed, well-structured content
- **Setup**: Add `ANTHROPIC_API_KEY` to your `.env` file

### Google Gemini
- **Models**: Gemini Pro, Gemini Pro Vision
- **Best for**: Fast generation, Google ecosystem integration
- **Setup**: Add `GOOGLE_API_KEY` to your `.env` file

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key | No (if using other providers) |
| `ANTHROPIC_API_KEY` | Anthropic API key | No (if using other providers) |
| `GOOGLE_API_KEY` | Google AI API key | No (if using other providers) |
| `NODE_ENV` | Environment (development/production) | Yes |

### Application Settings

The application can be configured through the constants file (`src/shared/constants.ts`):

- **Max History Entries**: Limit browsing history (default: 100)
- **Enable Streaming**: Real-time content generation (default: true)
- **Default Provider**: Auto-select AI provider (default: OpenAI)
- **Security Settings**: CSP policies and sandboxing

## 🧪 Testing

The application includes comprehensive tests:

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

- **Unit Tests**: Core functionality and utilities
- **Integration Tests**: IPC communication and AI service
- **E2E Tests**: Full user workflows (using Playwright)

## 🔒 Security

The application implements several security measures:

- **Content Security Policy**: Restricts script execution
- **Sandboxed Rendering**: Isolates generated content
- **Input Sanitization**: Cleans user input and AI-generated content
- **Secure IPC**: Type-safe communication between processes
- **Environment Isolation**: No direct Node.js access in renderer

## 🚀 Building for Production

### Create Distribution Packages

```bash
# Build for current platform
npm run build

# Build for all platforms
npm run make
```

### Supported Platforms

- **Windows**: `.exe` installer and portable
- **macOS**: `.dmg` and `.app`
- **Linux**: `.deb`, `.rpm`, and `.AppImage`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Use Biome for linting and formatting
- Update documentation as needed
- Follow conventional commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Electron](https://electronjs.org/) - Cross-platform desktop app framework
- [Vercel AI SDK](https://sdk.vercel.ai/) - AI integration toolkit
- [Vite](https://vitejs.dev/) - Fast build tool
- [Biome](https://biomejs.dev/) - Fast linter and formatter
- [Vitest](https://vitest.dev/) - Fast unit testing framework

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/chcardoz/llm-browser/issues)
- **Discussions**: [GitHub Discussions](https://github.com/chcardoz/llm-browser/discussions)
- **Email**: 59742506+chcardoz@users.noreply.github.com

## 🔄 Changelog

### v1.0.0
- Initial release
- AI-powered website generation
- Multiple provider support
- Modern UI with dark mode
- Comprehensive testing suite

---

**Note**: This application is for educational and experimental purposes. Generated content may not always be accurate or appropriate. Use responsibly and in accordance with AI provider terms of service.
