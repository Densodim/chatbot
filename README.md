# Aura Chat - AI-Powered Chat Application

A modern, feature-rich chat application built with Next.js, TypeScript, and Supabase. Supports real-time conversations with AI models, file attachments (images & documents), and anonymous/guest access.

## ✨ Features

- **Real-time AI Chat** - Streaming responses with multiple LLM models (OpenAI GPT-4, Groq)
- **File Attachments** - Upload images and documents with automatic text extraction
- **Anonymous Access** - Try as guest with 3 free messages, no registration required
- **User Authentication** - Secure signup/login with persistent chat history
- **Responsive Design** - Beautiful, mobile-first UI with dark/light theme support
- **Real-time Updates** - Live message synchronization across devices
- **Document Processing** - PDF text extraction and markdown support

## 🛠 Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with HTTP-only cookies
- **AI/ML**: OpenAI GPT-4 Vision, Groq Llama models
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage for file uploads
- **UI Components**: Custom components with Tailwind CSS
- **State Management**: TanStack Query for server state

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account and project

### 1. Clone and Install

```bash
git clone <repository-url>
cd chatbot
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_public_key

# AI Model API Keys
OPENAI_API_KEY=your_openai_api_key
GROQ_API_KEY=your_groq_api_key
```

### 3. Database Setup

Run the Supabase migration to set up the database schema:

```bash
# Apply the migration from supabase/migrations/20260327000000_initial_schema.sql
# You can do this via Supabase Dashboard CLI or directly in the dashboard
```

### 4. Start Development

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── chats/         # Chat management
│   │   └── attachments/   # File upload handling
│   └── (chat)/            # Chat page routes
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── chat/              # Chat UI components
│   ├── sidebar/           # Navigation sidebar
│   └── ui/                # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── supabase.ts        # Supabase admin client
│   ├── auth.ts            # Authentication helpers
│   ├── llm.ts             # AI model integration
│   └── attachments.ts     # File processing
└── types/                 # TypeScript type definitions
```

## 🔐 Architecture

### Security Model
- **Service Account Access**: All database operations use Supabase service role key
- **No Public Client**: Authentication handled via API routes, not direct Supabase client
- **HTTP-only Cookies**: Secure session token storage
- **API Route Only**: No direct database calls from components

### Data Flow
1. **Client** → API Routes → Supabase (Service Account)
2. **Real-time**: Supabase Realtime subscriptions for live updates
3. **File Storage**: Supabase Storage with signed URLs

## 🎨 UI/UX Features

- **Streaming Messages**: Real-time response streaming with typing indicators
- **File Previews**: Image thumbnails and document metadata
- **Responsive Layout**: Mobile-first design with adaptive layouts
- **Loading States**: Skeleton loaders and smooth transitions
- **Empty States**: Helpful onboarding and suggestion prompts
- **Anonymous Banner**: Clear messaging about usage limits

## 📱 Supported File Types

### Images
- JPEG, PNG, GIF, WebP, SVG
- Automatic preview generation
- Vision model processing

### Documents
- PDF (with text extraction)
- Markdown, Plain text
- Context truncation for large documents

## 🤖 AI Models

- **OpenAI GPT-4 Vision**: For image analysis and complex reasoning
- **Groq Llama Models**: Fast text-only responses
- **Automatic Fallback**: Seamless model switching based on content and availability

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Code Quality

- **TypeScript**: Full type safety
- **ESLint**: Code linting and formatting
- **Biome**: Fast formatting and linting
- **Server-only**: Proper server/client code separation

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on git push

### Docker

```bash
# Build image
docker build -t aura-chat .

# Run container
docker run -p 3000:3000 aura-chat
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For questions and support, please open an issue in the repository.
