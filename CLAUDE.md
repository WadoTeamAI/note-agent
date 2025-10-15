# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive Japanese note article auto-generation agent that uses Google Gemini AI to create SEO-optimized blog articles. The application features an integrated research system that combines Google Search analysis, note platform insights, and social media trends to generate complete articles with cover images and social media content through a 7-step AI workflow.

**Key Features (Phase 1 Complete):**
- ✅ Integrated multi-source research capability (Google Search + note platform + SNS trends)
- ✅ Anti-AI writing style with emphasis on natural Japanese expression
- ✅ Support for YouTube URL input with video content analysis
- ✅ Multi-length article generation (2,500 / 5,000 / 10,000 characters)
- ✅ X (Twitter) promotion post generation (short/long/thread formats)
- ✅ Article history with Supabase integration
- ✅ Modern UI with UnionAI-inspired design (glassmorphism effects)

## Development Commands

- **Start development server**: `npm run dev` (runs on port 3000)
- **Build for production**: `npm run build`
- **Preview production build**: `npm run preview`
- **Install dependencies**: `npm install`
- **Type checking**: `npm run type-check` (if available in package.json)

## Environment Setup

The application requires a valid Gemini API key. Follow these steps:

1. **Get API Key**: Visit https://ai.google.dev/ to obtain your Gemini API key
2. **Create Environment File**: Copy `.env.example` to `.env.local`
   ```bash
   cp .env.example .env.local
   ```
3. **Set API Key**: Edit `.env.local` and replace `your_api_key_here` with your actual API key
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

**Security Notes**:
- Never commit API keys to version control
- The `.env.local` file is automatically ignored by Git
- For production deployment, set environment variables through your hosting platform
- The application validates API keys on startup and provides helpful error messages

## Architecture

### Core Workflow (Current Implementation)
The application follows a 6-step AI generation pipeline:
1. **ANALYZING**: SEO analysis and integrated research (Google Search + note platform + SNS trends)
2. **OUTLINING**: Article structure generation with title, meta description, sections, and FAQ
3. **WRITING**: Full article generation in Markdown format with anti-AI writing rules
4. **GENERATING_IMAGE**: Cover image generation (currently using Gemini 2.5 Flash Image API with SVG fallback)
5. **GENERATING_X_POSTS**: X promotion post generation (short/long/thread formats with engagement prediction)
6. **SAVING_HISTORY**: Article history saved to Supabase (when available)

### Optional Workflow Steps
- **TRANSCRIBING** (YouTube only): Video content analysis and transcription when YouTube URL is provided

### Future Extensions (Phase 1.5+)
- Inline graphics generation (Mermaid.js integration)
- A/B testing with multiple article versions
- Real-time preview and dark mode
- Voice input and audio transcription

### Key Components

**Core Application:**
- **App.tsx**: Main application component managing workflow state, includes history panel integration
- **types/index.ts**: Main type definitions that re-exports from article.types.ts, api.types.ts, and social.types.ts
- **types/social.types.ts**: X (Twitter) post generation types (XPost, XThread, XPostGenerationResult)

**AI & Social Services:**
- **services/ai/geminiService.ts**: All Gemini AI API interactions (text generation, image generation)
- **services/social/xPostGenerator.ts**: X post generation service (short/long/thread formats)

**Database & History:**
- **services/database/supabaseClient.ts**: Supabase client configuration and types
- **services/database/historyService.ts**: Article history management (save/retrieve/search)

**UI Components:**
- **components/forms/InputGroup.tsx**: Input form component with glassmorphism styling
- **components/feedback/StepIndicator.tsx**: Progress indicator with modern UI design
- **components/display/OutputDisplay.tsx**: Results display component with X post integration
- **components/display/XPostDisplay.tsx**: Specialized component for displaying X posts
- **components/history/HistoryPanel.tsx**: Article history sidebar panel

**Supporting Services:**
- **services/research/**: Research services (searchService.ts, noteAnalyzer.ts, trendAnalyzer.ts)
- **config/**: Configuration files (constants.ts, env.ts)
- **utils/**: Utility functions (formatting.ts, validation.ts)
- **hooks/**: Custom React hooks (useArticleGeneration.ts, useLocalStorage.ts)

### AI Service Functions

All AI interactions are centralized in `services/ai/geminiService.ts` with retry logic and error handling:
- `transcribeYouTubeVideo()`: Analyzes YouTube video content for article generation
- `analyzeSerpResults()`: Performs SEO analysis and search intent research (integrates with searchService.ts)
- `createArticleOutline()`: Generates structured article outline as JSON with schema validation
- `writeArticle()`: Creates full Markdown article content with anti-AI writing enforcement
- `createImagePrompt()`: Generates image description from article content and user theme
- `generateImage()`: Creates cover image using Gemini 2.5 Flash Image API (with SVG fallback)
- `withRetry()`: Exponential backoff retry mechanism for all API calls
- `validateEnvironment()`: Checks API key configuration and provides helpful error messages

### Data Flow

1. User inputs keyword/YouTube URL, tone, audience, target length, and image theme
2. System determines workflow path (keyword vs YouTube URL analysis)
3. Form submission triggers sequential API calls with progress tracking
4. Each step updates `currentStep` state with visual progress indicators
5. Error handling includes retry logic and user-friendly error messages
6. Final output includes Markdown content, base64 image, meta description, X posts, and copy functionality
7. **Article history is automatically saved to Supabase** (when available) or LocalStorage fallback
8. **History panel (📚 button)** allows users to view, restore, and manage past articles
9. Responsive UI adapts to different screen sizes with mobile-first design

## Technical Implementation Details

### Performance Optimizations
- Optimized prompts for faster processing (target: 30-60 seconds for 2,500-5,000 character articles)
- Retry configuration: 2 attempts max with exponential backoff (500ms-3000ms)
- Bundle size optimization: ~407KB compressed
- Responsive UI with mobile-first approach using Tailwind-like utility classes

### AI Model Configuration
- **Text Generation**: Gemini 2.5 Flash (optimized for speed and quality balance)
- **Image Generation**: Gemini 2.5 Flash Image API (16:9 aspect ratio, PNG format)
- **Schema Validation**: JSON schema enforcement for consistent API responses
- **Error Handling**: Comprehensive retry logic with user-friendly Japanese error messages

### Database & History Management
- **Primary Storage**: Supabase (PostgreSQL with Pgvector for future RAG features)
- **Fallback Storage**: LocalStorage for offline capability
- **Data Types**: Article content, metadata, generation parameters, performance metrics
- **Features**: Search, filter, restore, delete operations
- **Security**: Row Level Security (RLS) enabled, API key-based authentication

### Environment Management
- Robust API key validation with helpful setup guidance
- Multiple environment variable support (`GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`)
- Security-first approach with `.env.local` automatic Git ignore
- Graceful degradation when Supabase is not configured (LocalStorage fallback)
- Production deployment guidance included

## Content Generation Rules & Anti-AI Writing System

The application implements strict anti-AI writing rules to ensure natural Japanese expression:

### Prohibited Expressions
- Translation-style Japanese: "〜することができます" → "〜できます" or natural alternatives
- Robotic introductions: "〜について説明します" → Direct content approach
- Formal addressing: "あなたは〜" → Natural conversational flow

### Required Elements
- **Personal anecdotes**: Minimum 1 specific experience or story per article
- **Human warmth**: Use of "実は...", "正直なところ...", natural hesitations
- **Concrete examples**: Specific details over abstract concepts
- **Emotional connection**: Reader empathy and relatable situations

### Content Patterns
Multiple experience patterns are provided to AI:
- Personal struggle examples: "私自身も初めて○○に挑戦した時、△△で躓いてしまい..."
- Friend/colleague stories: "友人から聞いた話ですが..."
- Professional anecdotes: "以前職場で○○の案件を担当した際..."

## Development Workflow

### Adding New Features
1. Update type definitions in `types/` directory (article.types.ts, api.types.ts, or index.ts)
2. Extend `services/ai/geminiService.ts` for AI interactions
3. Add research functionality in `services/research/` if needed
4. Implement UI components in `components/forms/`, `components/display/`, or `components/feedback/`
5. Update workflow in `App.tsx` or consider using `hooks/useArticleGeneration.ts`
6. Add utility functions in `utils/` if needed
7. Test with `npm run build` for production readiness

### Code Organization Principles
- **Separation of Concerns**: UI components separated from business logic
- **Feature-based Structure**: Research services grouped in `services/research/`
- **Type Safety**: Comprehensive TypeScript definitions split by domain
- **Hooks Pattern**: Business logic extracted into custom hooks for reusability
- **Configuration Management**: Environment and constants centralized in `config/`

### Modifying AI Prompts
- All prompts are in Japanese and optimized for natural output
- Include anti-AI writing rules in new prompts (see Content Generation Rules section)
- Test with various input patterns (keywords vs YouTube URLs)
- Ensure schema validation for JSON responses in `createArticleOutline()`
- Use the retry mechanism with exponential backoff for API reliability

### Working with Research Services
- `searchService.ts`: Google Search API integration for real-time SERP analysis
- `noteAnalyzer.ts`: Note platform-specific analysis (placeholder for future implementation)
- `trendAnalyzer.ts`: Social media trend analysis (placeholder for future implementation)
- These services are called from `analyzeSerpResults()` with fallback to basic analysis

### Phase Development Status
Current implementation is Phase 1 (MVP). See `requirements.md` for detailed roadmap:
- Phase 1: Core generation (✅ Complete)
- Phase 1.5: Extended features (inline graphics, longer content, A/B testing)
- Phase 2: External API integration (note API, X API, Supabase)
- Phase 3: Analytics and optimization
- Phase 4: Multi-platform publishing