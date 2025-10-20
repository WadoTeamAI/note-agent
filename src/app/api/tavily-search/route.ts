import { NextRequest, NextResponse } from 'next/server';

const TAVILY_API_URL = 'https://api.tavily.com/search';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, search_depth, include_answer, include_raw_content, max_results } = body;

    // 環境変数からAPIキーを取得
    const apiKey = process.env.NEXT_PUBLIC_TAVILY_API_KEY || process.env.TAVILY_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Tavily APIキーが設定されていません' },
        { status: 400 }
      );
    }

    // Tavily APIに直接リクエスト
    const response = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: search_depth || 'advanced',
        include_answer: include_answer || true,
        include_raw_content: include_raw_content || false,
        max_results: max_results || 5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Tavily API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Tavily API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Tavily API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}