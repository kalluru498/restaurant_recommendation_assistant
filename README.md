# Restaurant Chatbot

An AI-powered restaurant recommendation chatbot built with Next.js 14 (App Router) that searches Reddit and the web to provide personalized dining recommendations.

## Features

- 🤖 **AI-Powered Recommendations**: Uses OpenAI GPT-4 with function calling
- 🔍 **Reddit Integration**: Searches Reddit for authentic user reviews and discussions
- 🌐 **Web Search**: Finds professional reviews from Yelp, Google, TripAdvisor, etc.
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- 🎨 **Modern UI**: Clean, intuitive interface with real-time chat
- 🔄 **Real-time Updates**: Live search results and source citations

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Lucide React Icons
- **AI**: OpenAI GPT-4 with Function Calling
- **APIs**: Reddit API, Brave Search API (or SerpAPI)
- **HTTP Client**: Axios
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd restaurant-chatbot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your API keys to `.env.local`:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   BRAVE_API_KEY=your_brave_api_key_here  # Optional
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### API Keys Setup

#### Required: OpenAI API Key
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add it to your `.env.local` file

#### Optional: Brave Search API Key
1. Go to [Brave Search API](https://api.search.brave.com/app/keys)
2. Sign up for a free account (1000 queries/month)
3. Generate an API key
4. Add it to your `.env.local` file

*Note: Without Brave API key, the app will use simulated web search results for demo purposes.*

## Usage Examples

Try asking the chatbot:

- "Where is the best place to get Mediterranean food in Flatiron?"
- "What should I order at Four Charles?"
- "What is the difference between Thai Villa and Soothr?"
- "Is Per Se an expensive restaurant?"
- "Best pizza places in NYC under $20"
- "Romantic restaurants in SoHo with good wine selection"

## Project Structure

```
restaurant-chatbot/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Chat API endpoint
│   ├── globals.css               # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main chat interface
├── lib/
│   ├── reddit.ts                # Reddit search functionality
│   └── web-search.ts            # Web search functionality
├── public/                      # Static assets
├── .env.example                 # Environment variables template
├── next.config.js              # Next.js configuration
├── package.json                # Dependencies
├── tailwind.config.js          # Tailwind configuration
└── README.md                   # This file
```

## Deployment

### Deploy to Vercel

1. **Connect your repository to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository

2. **Set environment variables**
   - In Vercel dashboard, go to Settings > Environment Variables
   - Add your `OPENAI_API_KEY` and `BRAVE_API_KEY`

3. **Deploy**
   - Vercel will automatically deploy your app
   - Your app will be available at `https://your-app-name.vercel.app`

### Manual Deployment

```bash
npm run build
npm start
```

## API Endpoints

### POST /api/chat

Processes chat messages and returns AI responses with source citations.

**Request Body:**
```json
{
  "message": "Best Italian restaurants in NYC"
}
```

**Response:**
```json
{
  "message": "Here are some excellent Italian restaurants in NYC...",
  "sources": ["Reddit search: Italian restaurants NYC", "Web search: best Italian restaurants NYC"]
}
```

## Key Features Explained

### Reddit Search Integration
- Searches Reddit for authentic user discussions
- Filters by relevance and score
- Extracts key information from posts and comments
- Provides real user experiences and opinions

### Web Search Integration
- Uses Brave Search API for comprehensive web results
- Finds professional reviews from major platforms
- Includes restaurant websites, menus, and ratings
- Fallback to simulated results for demo purposes

### AI Function Calling
- Uses OpenAI's function calling feature
- Intelligently decides when to search Reddit vs web
- Synthesizes information from multiple sources
- Provides contextual, helpful responses

## Error Handling

The app includes comprehensive error handling:

- **API Failures**: Graceful degradation with fallback responses
- **Network Issues**: Timeout handling and retry logic
- **Invalid Inputs**: Input validation and sanitization
- **Rate Limiting**: Handles API rate limits gracefully

## Performance Optimizations

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Efficient Rendering**: React best practices and optimizations
- **API Caching**: Reduces redundant API calls
- **Error Boundaries**: Prevents crashes from propagating

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed description
3. Include error logs and reproduction steps

---

**Built with ❤️ using Next.js, OpenAI, and modern web technologies**