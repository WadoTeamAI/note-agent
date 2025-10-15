import React, { useState, useEffect } from 'react';
import { XPostExporter, PreparedPost, XPostExportOptions } from '../../services/social/xPostExporter';

interface XPostManagerProps {
    isOpen: boolean;
    onClose: () => void;
    initialPosts?: PreparedPost[];
}

const XPostManager: React.FC<XPostManagerProps> = ({ isOpen, onClose, initialPosts = [] }) => {
    const [exporter] = useState(() => new XPostExporter());
    const [posts, setPosts] = useState<PreparedPost[]>([]);
    const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | PreparedPost['status']>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'short' | 'long'>('all');
    const [editingPost, setEditingPost] = useState<PreparedPost | null>(null);
    const [showExportOptions, setShowExportOptions] = useState(false);

    // 初期データの設定
    useEffect(() => {
        if (initialPosts.length > 0) {
            initialPosts.forEach(post => {
                exporter.posts.set(post.id, post);
            });
        }
        exporter.loadFromLocalStorage();
        refreshPosts();
    }, [initialPosts, exporter]);

    const refreshPosts = () => {
        const allPosts = exporter.getAllPosts();
        let filteredPosts = allPosts;

        // 検索フィルター
        if (searchQuery) {
            filteredPosts = filteredPosts.filter(post =>
                post.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.metadata.keyword?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.metadata.articleTitle?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // ステータスフィルター
        if (statusFilter !== 'all') {
            filteredPosts = filteredPosts.filter(post => post.status === statusFilter);
        }

        // タイプフィルター
        if (typeFilter !== 'all') {
            filteredPosts = filteredPosts.filter(post => post.id.startsWith(typeFilter));
        }

        setPosts(filteredPosts);
    };

    useEffect(() => {
        refreshPosts();
    }, [searchQuery, statusFilter, typeFilter]);

    const handlePostUpdate = (id: string, updates: Partial<PreparedPost>) => {
        exporter.updatePost(id, updates);
        exporter.saveToLocalStorage();
        refreshPosts();
    };

    const handlePostDelete = (id: string) => {
        exporter.deletePost(id);
        exporter.saveToLocalStorage();
        setSelectedPosts(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
        refreshPosts();
    };

    const handleSelectPost = (id: string, selected: boolean) => {
        setSelectedPosts(prev => {
            const newSet = new Set(prev);
            if (selected) {
                newSet.add(id);
            } else {
                newSet.delete(id);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedPosts.size === posts.length) {
            setSelectedPosts(new Set());
        } else {
            setSelectedPosts(new Set(posts.map(p => p.id)));
        }
    };

    const handleExport = (options: XPostExportOptions) => {
        const postsToExport = selectedPosts.size > 0 
            ? posts.filter(p => selectedPosts.has(p.id))
            : posts;
        
        exporter.downloadFile(postsToExport, options);
        setShowExportOptions(false);
    };

    const handleCopyToClipboard = async (post: PreparedPost) => {
        const success = await exporter.copyToClipboard(post);
        if (success) {
            alert('投稿をクリップボードにコピーしました！');
        } else {
            alert('コピーに失敗しました');
        }
    };

    const handleCopyAllToClipboard = async () => {
        const postsToExport = selectedPosts.size > 0 
            ? posts.filter(p => selectedPosts.has(p.id))
            : posts;
        
        const success = await exporter.copyAllToClipboard(postsToExport);
        if (success) {
            alert(`${postsToExport.length}件の投稿をクリップボードにコピーしました！`);
        } else {
            alert('コピーに失敗しました');
        }
    };

    const statistics = exporter.getStatistics();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-auto">
            <div className="min-h-screen flex items-start justify-center p-4 py-8">
                <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 w-full max-w-6xl max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/20">
                        <div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                🐦 X投稿管理
                            </h2>
                            <p className="text-gray-600 text-sm mt-1">
                                生成された投稿の編集、管理、エクスポート
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="p-6 border-b border-white/20">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">{statistics.total}</div>
                                <div className="text-sm text-blue-800">総投稿数</div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">{statistics.byStatus.ready}</div>
                                <div className="text-sm text-green-800">準備完了</div>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-yellow-600">{statistics.byStatus.draft}</div>
                                <div className="text-sm text-yellow-800">下書き</div>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-purple-600">{statistics.averageCharacterCount}</div>
                                <div className="text-sm text-purple-800">平均文字数</div>
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-indigo-600">{statistics.totalHashtags}</div>
                                <div className="text-sm text-indigo-800">総ハッシュタグ数</div>
                            </div>
                        </div>
                    </div>

                    {/* Filters and Actions */}
                    <div className="p-6 border-b border-white/20">
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                            <div className="flex flex-col sm:flex-row gap-3 flex-1">
                                <input
                                    type="text"
                                    placeholder="投稿内容、キーワードで検索..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 flex-1"
                                />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as any)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">全ステータス</option>
                                    <option value="draft">下書き</option>
                                    <option value="ready">準備完了</option>
                                    <option value="scheduled">予約済み</option>
                                </select>
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value as any)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">全タイプ</option>
                                    <option value="short">ショート</option>
                                    <option value="long">ロング</option>
                                </select>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleSelectAll}
                                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                >
                                    {selectedPosts.size === posts.length ? '選択解除' : '全選択'}
                                </button>
                                <button
                                    onClick={handleCopyAllToClipboard}
                                    disabled={posts.length === 0}
                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    📋 コピー
                                </button>
                                <button
                                    onClick={() => setShowExportOptions(true)}
                                    disabled={posts.length === 0}
                                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    📥 エクスポート
                                </button>
                            </div>
                        </div>

                        {selectedPosts.size > 0 && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-blue-700 text-sm">
                                    {selectedPosts.size}件の投稿が選択されています
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Posts List */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {posts.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-gray-400 text-6xl mb-4">🐦</div>
                                <h3 className="text-xl font-bold text-gray-700 mb-2">投稿がありません</h3>
                                <p className="text-gray-600">記事を生成すると投稿がここに表示されます</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {posts.map((post) => (
                                    <div key={post.id} className="bg-white/60 border border-white/30 rounded-lg p-4">
                                        <div className="flex items-start gap-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedPosts.has(post.id)}
                                                onChange={(e) => handleSelectPost(post.id, e.target.checked)}
                                                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                                        post.status === 'ready' ? 'bg-green-100 text-green-800' :
                                                        post.status === 'scheduled' ? 'bg-purple-100 text-purple-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {post.status === 'ready' ? '準備完了' :
                                                         post.status === 'scheduled' ? '予約済み' : '下書き'}
                                                    </span>
                                                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                        {post.id.startsWith('short') ? 'ショート' : 'ロング'}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {post.metadata.characterCount}文字
                                                    </span>
                                                </div>

                                                <div className="bg-gray-50 p-3 rounded-lg mb-3">
                                                    <p className="text-gray-800 whitespace-pre-wrap">{post.text}</p>
                                                </div>

                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {post.hashtags?.map((tag, index) => (
                                                        <span key={index} className="text-blue-600 text-sm">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>

                                                <div className="text-xs text-gray-500 space-y-1">
                                                    <p>ターゲット: {post.target || 'なし'}</p>
                                                    <p>キーワード: {post.metadata.keyword}</p>
                                                    <p>記事: {post.metadata.articleTitle}</p>
                                                    <p>作成: {post.createdAt.toLocaleString('ja-JP')}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => handleCopyToClipboard(post)}
                                                    className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                                                    title="コピー"
                                                >
                                                    📋
                                                </button>
                                                <button
                                                    onClick={() => setEditingPost(post)}
                                                    className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm"
                                                    title="編集"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handlePostUpdate(post.id, {
                                                        status: post.status === 'draft' ? 'ready' : 'draft'
                                                    })}
                                                    className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm"
                                                    title={post.status === 'draft' ? '準備完了にする' : '下書きに戻す'}
                                                >
                                                    {post.status === 'draft' ? '✅' : '📝'}
                                                </button>
                                                <button
                                                    onClick={() => handlePostDelete(post.id)}
                                                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
                                                    title="削除"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Edit Modal */}
                    {editingPost && (
                        <EditPostModal
                            post={editingPost}
                            onSave={(updates) => {
                                handlePostUpdate(editingPost.id, updates);
                                setEditingPost(null);
                            }}
                            onClose={() => setEditingPost(null)}
                        />
                    )}

                    {/* Export Options Modal */}
                    {showExportOptions && (
                        <ExportOptionsModal
                            onExport={handleExport}
                            onClose={() => setShowExportOptions(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

// 投稿編集モーダル
interface EditPostModalProps {
    post: PreparedPost;
    onSave: (updates: Partial<PreparedPost>) => void;
    onClose: () => void;
}

const EditPostModal: React.FC<EditPostModalProps> = ({ post, onSave, onClose }) => {
    const [text, setText] = useState(post.text);
    const [target, setTarget] = useState(post.target || '');
    const [hashtags, setHashtags] = useState(post.hashtags?.join(', ') || '');

    const handleSave = () => {
        const hashtagArray = hashtags.split(',').map(tag => tag.trim()).filter(tag => tag);
        onSave({
            text,
            target: target || undefined,
            hashtags: hashtagArray.length > 0 ? hashtagArray : undefined,
            metadata: {
                ...post.metadata,
                characterCount: text.length,
                hashtagCount: hashtagArray.length
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 w-full max-w-md">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">投稿を編集</h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                投稿テキスト ({text.length}文字)
                            </label>
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={4}
                                maxLength={280}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ターゲット
                            </label>
                            <input
                                type="text"
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="例: 初心者"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ハッシュタグ（カンマ区切り）
                            </label>
                            <input
                                type="text"
                                value={hashtags}
                                onChange={(e) => setHashtags(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="例: 副業, ブログ, 初心者"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                            >
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// エクスポートオプションモーダル
interface ExportOptionsModalProps {
    onExport: (options: XPostExportOptions) => void;
    onClose: () => void;
}

const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({ onExport, onClose }) => {
    const [format, setFormat] = useState<XPostExportOptions['format']>('csv');
    const [includeMetadata, setIncludeMetadata] = useState(true);
    const [includeSchedule, setIncludeSchedule] = useState(false);

    const handleExport = () => {
        onExport({
            format,
            includeMetadata,
            includeSchedule
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 w-full max-w-md">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">エクスポート設定</h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                ファイル形式
                            </label>
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        checked={format === 'csv'}
                                        onChange={() => setFormat('csv')}
                                        className="mr-2"
                                    />
                                    CSV (Excel対応)
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        checked={format === 'json'}
                                        onChange={() => setFormat('json')}
                                        className="mr-2"
                                    />
                                    JSON (プログラム処理用)
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        checked={format === 'txt'}
                                        onChange={() => setFormat('txt')}
                                        className="mr-2"
                                    />
                                    テキスト (読みやすい形式)
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        checked={format === 'markdown'}
                                        onChange={() => setFormat('markdown')}
                                        className="mr-2"
                                    />
                                    Markdown (文書作成用)
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                オプション
                            </label>
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={includeMetadata}
                                        onChange={(e) => setIncludeMetadata(e.target.checked)}
                                        className="mr-2"
                                    />
                                    メタデータを含める（記事タイトル、キーワード等）
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={includeSchedule}
                                        onChange={(e) => setIncludeSchedule(e.target.checked)}
                                        className="mr-2"
                                    />
                                    予約投稿情報を含める
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleExport}
                                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
                            >
                                エクスポート
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default XPostManager;