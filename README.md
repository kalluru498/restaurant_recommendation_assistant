# 🍽️ Restaurant Chatbot - AI-Powered Dining Assistant

A full-stack Next.js chatbot application that provides intelligent restaurant recommendations by combining Reddit discussions and web search results. Built with OpenAI GPT-4, responsive design, and modern UI components.

![Restaurant Chatbot Demo](https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop)

## ✨ Features

- **AI-Powered Conversations**: Utilizes OpenAI GPT-4 for natural language understanding
- **Multi-Source Research**: Combines Reddit discussions and web search for comprehensive recommendations
- **Real-Time Streaming**: Streaming responses for better user experience
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Location-Aware**: Provides location-specific restaurant recommendations
- **Conversation History**: Maintains context throughout the chat session

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- Reddit API credentials
- Brave Search API key (optional, for enhanced web search)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/restaurant-chatbot.git
cd restaurant-chatbot
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file in the root directory:
```bash
OPENAI_API_KEY=your_openai_api_key_here
REDDIT_CLIENT_ID=your_reddit_client_id_here
REDDIT_CLIENT_SECRET=your_reddit_client_secret_here
BRAVE_SEARCH_API_KEY=your_brave_search_api_key_here
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to `http://localhost:3000` to see the application.

## 🔧 API Setup Guide

### OpenAI API
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Generate a new API key
5. Add to your `.env.local` file

### Reddit API
1. Go to [Reddit Apps](https://www.reddit.com/prefs/apps)
2. Click "Create App" or "Create Another App"
3. Choose "script" as the app type
4. Note down your client ID and secret
5. Add to your `.env.local` file

### Brave Search API (Optional)
1. Visit [Brave Search API](https://api.search.brave.com/)
2. Sign up for an account
3. Generate an API key
4. Add to your `.env.local` file

## 🏗️ Project Structure

```
restaurant-chatbot/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # API endpoint for chat functionality
│   ├── components/
│   │   ├── ChatInterface.tsx     # Main chat interface component
│   │   ├── MessageBubble.tsx     # Individual message component
│   │   └── TypingIndicator.tsx   # Loading animation component
│   ├── lib/
│   │   ├── openai.ts            # OpenAI client configuration
│   │   ├── reddit.ts            # Reddit API integration
│   │   └── search.ts            # Web search functionality
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout component
│   └── page.tsx                 # Home page component
├── public/
│   └── favicon.ico
├── .env.local                   # Environment variables
├── next.config.js               # Next.js configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts
```

## 🎯 Usage Examples

### Basic Restaurant Recommendation
```
User: "I'm looking for Italian restaurants in downtown Seattle"
Bot: "Based on Reddit discussions and recent reviews, here are some highly recommended Italian restaurants in downtown Seattle..."
```

### Cuisine-Specific Search
```
User: "What's the best sushi place in San Francisco under $50 per person?"
Bot: "I found several excellent sushi restaurants in San Francisco within your budget..."
```

### Dietary Restrictions
```
User: "I need vegan options in Austin, Texas"
Bot: "Here are some popular vegan restaurants in Austin that locals recommend..."
```

## 🔌 API Endpoints

### POST /api/chat
Handles chat messages and returns AI responses.

**Request Body:**
```json
{
  "message": "string",
  "history": [
    {
      "role": "user" | "assistant",
      "content": "string"
    }
  ]
}
```

**Response:**
- Streaming text response
- Content-Type: `text/plain`
- Transfer-Encoding: `chunked`

## 🎨 Customization

### Styling
The application uses Tailwind CSS for styling. You can customize:

- **Colors**: Modify the color palette in `tailwind.config.js`
- **Animations**: Add custom animations in the theme configuration
- **Components**: Update component styles in individual files

### AI Behavior
Customize the AI's behavior by modifying the system prompt in `/app/api/chat/route.ts`:

```typescript
const systemPrompt = `You are a helpful restaurant recommendation assistant...`;
```

### Data Sources
Add new data sources by creating new modules in the `/app/lib/` directory and integrating them into the chat API.

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Alternative Platforms
The application can be deployed on any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🛠️ Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Code Quality
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting (recommended)

## 🔒 Security Considerations

- API keys are stored securely in environment variables
- Rate limiting implemented to prevent abuse
- Input validation for all user inputs
- CORS configured for API endpoints

## 📊 Performance

- Server-side rendering with Next.js
- Optimized images with Next.js Image component
- Streaming responses for better perceived performance
- Efficient caching strategies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Troubleshooting

### Common Issues

**API Key Not Working**
- Verify your API keys are correctly set in `.env.local`
- Ensure you have sufficient credits/quota
- Check that the keys have proper permissions

**Reddit API Errors**
- Confirm your Reddit app is configured as "script" type
- Verify client ID and secret are correct
- Check Reddit API rate limits

**Build Errors**
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version compatibility
- Verify TypeScript configuration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Reddit for community data access
- Brave Search for web search capabilities
- Next.js team for the excellent framework
- Tailwind CSS for utility-first styling

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check existing issues for solutions
- Refer to the API documentation for each service

---

**Made with ❤️ for food lovers everywhere**