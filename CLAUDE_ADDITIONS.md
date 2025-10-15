## Working with X Post Generation
The `services/social/xPostGenerator.ts` service generates multiple types of X posts:

**Short Posts (140 chars)**: 5 different audience-targeted variations
- Uses audience-specific prompts for初心者, 中級者, ビジネスパーソン, 主婦・主夫, 学生
- Includes engagement prediction (high/medium/low)
- Automatically generates appropriate hashtags

**Long Posts (300-500 chars)**: 2 strategic approaches
- Story-driven approach with personal narrative
- Data-driven approach with statistics and facts

**Thread Posts**: Multi-tweet sequences
- Problem-solving format (問題提起 → 解決策 → 結果)
- How-to format (ステップバイステップの説明)
- Each thread contains 5-7 connected tweets

## Working with Article History
The history system uses Supabase for persistent storage with LocalStorage fallback:

**Saving Articles**: Automatically saves after successful generation including:
- All input parameters (keyword, tone, audience, etc.)
- Generated content (markdown, images, X posts)
- Generation metadata (time taken, workflow steps)
- Performance metrics for analytics

**Retrieving History**: `HistoryPanel` component provides:
- Paginated list of past articles
- Search by keyword or title
- Filter by date range or generation parameters
- One-click restore functionality

## UI Design Philosophy
The application follows UnionAI-inspired design principles:

**Glassmorphism Effects**: 
- Semi-transparent backgrounds with backdrop blur
- Layered visual hierarchy with depth
- Subtle borders and shadows for definition

**Animation Patterns**:
- Gradient shifts for dynamic backgrounds
- Smooth transitions for state changes
- Progressive loading indicators
- Hover effects with scale transforms

**Color Palette**:
- Primary: Indigo to purple gradients
- Accent: Pink and blue highlights
- Background: Soft pastels with animated shifts
- Text: High contrast grays for readability

## Deployment Status
The application is deployed on Vercel:
- Production URL: https://note-agent-loevn4c0h-gaityu0325-8726s-projects.vercel.app
- Automatic deployments on Git push
- Environment variables configured for production
- CDN distribution for optimal performance