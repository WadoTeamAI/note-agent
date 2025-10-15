import { GoogleGenAI, Type } from "@google/genai";
import { ArticleOutline, Audience, Tone } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeSerpResults(keyword: string): Promise<string> {
    const prompt = `あなたはプロのSEOアナリストです。
以下のキーワードについて、日本のGoogle検索結果上位10件を分析したと仮定し、その結果を要約してください。

キーワード: "${keyword}"

以下の4つの項目について、具体的かつ簡潔にまとめてください。
1.  **検索ユーザーの主な意図**: ユーザーがこのキーワードで検索するとき、何を知りたい、または解決したいと考えているか。
2.  **上位記事で共通する見出し構成**: 上位記事によく見られる、記事の流れや構造的なパターン。
3.  **上位記事が見落としている重要な視点**: 既存の記事では十分にカバーされていないが、ユーザーにとって価値のある情報や切り口。
4.  **想定される「よくある質問（FAQ）」**: このテーマについてユーザーが抱きやすい疑問を3〜5個挙げてください。`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
}

export async function createArticleOutline(analysis: string, audience: Audience, tone: Tone, keyword: string): Promise<ArticleOutline> {
    const prompt = `あなたはプロのSEOコンサルタント兼ブログ編集者です。
以下のSEO分析結果とターゲット設定に基づき、検索エンジンと読者の双方に評価される、質の高いnote記事の構成案を作成してください。

# SEO分析結果
${analysis}

# ターゲット設定
- メインキーワード: ${keyword}
- 読者層: ${audience}
- 文体: ${tone}

# 作成する構成案の要件
- **タイトル**: キーワードを含み、クリックしたくなるような魅力的なタイトル（32文字以内）。
- **メタディスクリプション**: 記事の内容を簡潔に要約し、キーワードを含んだ説明文（120文字以内）。
- **導入文**: 読者の悩みに共感し、記事を読むメリットを提示する。
- **見出し構成**: 分析結果を元に、検索意図を完全に満たす論理的な構成にする。
- **FAQ**: 読者が抱きそうな疑問を先回りして解消する。

# 出力形式
必ず以下のJSONスキーマに従って出力してください。`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "記事のタイトル（SEOに強く、32文字以内）" },
                    metaDescription: { type: Type.STRING, description: "記事のメタディスクリプション（120文字以内）" },
                    introduction: { type: Type.STRING, description: "記事の導入文" },
                    sections: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                heading: { type: Type.STRING, description: "H2見出し" },
                                content: { type: Type.STRING, description: "その見出しで書くべき内容の要約" },
                            },
                             required: ["heading", "content"],
                        },
                    },
                    faq: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING, description: "よくある質問の質問文" },
                                answer: { type: Type.STRING, description: "質問に対する回答の要約" },
                            },
                             required: ["question", "answer"],
                        },
                    },
                },
                required: ["title", "metaDescription", "introduction", "sections", "faq"],
            },
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
}

export async function writeArticle(outline: ArticleOutline, targetLength: number, tone: Tone, audience: Audience): Promise<string> {
    const sectionsText = outline.sections.map(s => `## ${s.heading}\n${s.content}`).join('\n\n');
    const faqText = outline.faq.map(f => `- Q: ${f.question}\n- A: ${f.answer}`).join('\n');

    const prompt = `あなたはプロのWebライターです。
以下の記事構成案と指示に従って、noteで公開するための記事本文をMarkdown形式で執筆してください。

# 記事構成案
- タイトル: ${outline.title}
- 導入: ${outline.introduction}
- 本文:
${sectionsText}
- FAQ:
${faqText}


# 指示
- 目安文字数: ${targetLength}文字
- 読者層: ${audience}
- 文体: ${tone}

# SEOライティングの原則
- **キーワードの自然な配置**: タイトルに含まれるキーワードや関連キーワードを、見出しや本文中に不自然にならないように、かつ効果的に配置してください。特に、導入文と各H2見出しの直後には、キーワードを意識して文章を作成してください。
- **E-E-A-T**: 専門性、経験、権威性、信頼性を示せるように、具体的な情報やデータを盛り込んでください。

# 最重要執筆ルール (必ず厳守してください)
- **人間らしさの追求**: AIが書いたような無機質な文章は絶対に避けてください。
- **禁止事項**:
    - 抽象的な一般論や精神論
    - 「～することができます」のような翻訳調の日本語
    - 「あなたは～」のような読者への不自然な呼びかけ
    - 大げさで陳腐な比喩表現
- **必須条件**:
    - 日本語として自然で、少し感情や温かみが感じられるような表現を心がけること。
    - 記事のどこか1箇所以上に、具体的な体験談や個人的なエピソード、たとえ話を盛り込むこと。（例：「私自身も副業を始めた頃、〇〇で失敗した経験があります。その時...」）
    - 完璧すぎない、少しの「揺れ」や人間味を意図的に文章に残すこと。読者が親近感を覚えるような、少しだけ砕けた表現を混ぜても良い。
- **形式**: Markdown形式で、見出しやリストなどを適切に使用してください。記事タイトルはH1見出し（#）としてください。`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
}

export async function createImagePrompt(articleTitle: string, articleContent: string): Promise<string> {
    const summary = articleContent.substring(0, 1000); // Use first 1000 chars as summary
    const prompt = `以下のブログ記事のタイトルと内容を要約し、アイキャッチ画像（イラスト）を生成するための、簡潔で情景が目に浮かぶような日本語のプロンプトを1つだけ作成してください。

記事タイトル: "${articleTitle}"
記事内容の要約: "${summary}"

プロンプトの例:
「夜のカフェでノートパソコンを使って働く女性。暖かい照明と木のテーブル、落ち着いた雰囲気。」
「青空の下、山頂で日の出を見ながら達成感に満ちた表情の登山家。」`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
}

export async function generateImage(prompt: string): Promise<string> {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio: '16:9',
        },
    });
    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
}