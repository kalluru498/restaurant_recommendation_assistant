/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com'],
  },
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    REDDIT_CLIENT_ID: process.env.REDDIT_CLIENT_ID,
    REDDIT_CLIENT_SECRET: process.env.REDDIT_CLIENT_SECRET,
    BRAVE_SEARCH_API_KEY: process.env.BRAVE_SEARCH_API_KEY,
  },
}

module.exports = nextConfig