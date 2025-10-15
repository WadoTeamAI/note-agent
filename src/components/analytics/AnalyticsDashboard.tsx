import React, { useState, useEffect } from 'react';
import { AnalyticsService } from '../../services/analytics/analyticsService';
import { AnalyticsDashboard as DashboardData, AnalyticsQuery } from '../../types/analytics.types';
import { useAuth } from '../auth/AuthProvider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
    const [analyticsService] = useState(() => new AnalyticsService());

    useEffect(() => {
        if (isOpen) {
            loadDashboardData();
        }
    }, [isOpen, timeRange]);

    const loadDashboardData = async () => {
        setLoading(true);
        setError(null);

        try {
            const endDate = new Date();
            const startDate = new Date();
            
            switch (timeRange) {
                case 'week':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(endDate.getMonth() - 1);
                    break;
                case 'quarter':
                    startDate.setMonth(endDate.getMonth() - 3);
                    break;
            }

            const query: AnalyticsQuery = {
                startDate,
                endDate,
                userId: user?.id,
                groupBy: timeRange === 'week' ? 'day' : timeRange === 'month' ? 'day' : 'week'
            };

            const data = await analyticsService.getDashboardData(query);
            setDashboardData(data);
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
            setError('ダッシュボードデータの読み込みに失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const formatTime = (ms: number): string => {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        return `${(ms / 60000).toFixed(1)}m`;
    };

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-auto">
            <div className="min-h-screen flex items-start justify-center p-4 py-8">
                <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 w-full max-w-7xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/20">
                        <div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                📊 分析ダッシュボード
                            </h2>
                            <p className="text-gray-600 text-sm mt-1">
                                記事生成の統計とパフォーマンス分析
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value as any)}
                                className="px-3 py-2 bg-white/60 border border-white/30 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="week">過去1週間</option>
                                <option value="month">過去1ヶ月</option>
                                <option value="quarter">過去3ヶ月</option>
                            </select>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-gray-600">データを読み込み中...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-12">
                                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                                <p className="text-red-600">{error}</p>
                                <button
                                    onClick={loadDashboardData}
                                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    再試行
                                </button>
                            </div>
                        ) : dashboardData ? (
                            <div className="space-y-8">
                                {/* Overview Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                                    <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 p-6 rounded-xl border border-blue-200/30">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-blue-600 text-sm font-medium">生成記事数</p>
                                                <p className="text-2xl font-bold text-gray-800">
                                                    {formatNumber(dashboardData.overview.totalArticles)}
                                                </p>
                                            </div>
                                            <div className="text-3xl">📝</div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 p-6 rounded-xl border border-green-200/30">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-green-600 text-sm font-medium">平均品質スコア</p>
                                                <p className="text-2xl font-bold text-gray-800">
                                                    {dashboardData.overview.averageQualityScore.toFixed(1)}/10
                                                </p>
                                            </div>
                                            <div className="text-3xl">⭐</div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 p-6 rounded-xl border border-purple-200/30">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-purple-600 text-sm font-medium">平均生成時間</p>
                                                <p className="text-2xl font-bold text-gray-800">
                                                    {formatTime(dashboardData.overview.averageGenerationTime)}
                                                </p>
                                            </div>
                                            <div className="text-3xl">⏱️</div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 p-6 rounded-xl border border-orange-200/30">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-orange-600 text-sm font-medium">成功率</p>
                                                <p className="text-2xl font-bold text-gray-800">
                                                    {dashboardData.overview.successRate.toFixed(1)}%
                                                </p>
                                            </div>
                                            <div className="text-3xl">✅</div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-indigo-500/10 to-indigo-600/10 p-6 rounded-xl border border-indigo-200/30">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-indigo-600 text-sm font-medium">アクティブユーザー</p>
                                                <p className="text-2xl font-bold text-gray-800">
                                                    {formatNumber(dashboardData.overview.totalUsers)}
                                                </p>
                                            </div>
                                            <div className="text-3xl">👥</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Time Series Chart */}
                                {dashboardData.timeSeriesData.length > 0 && (
                                    <div className="bg-white/60 p-6 rounded-xl border border-white/30">
                                        <h3 className="text-lg font-bold text-gray-800 mb-4">📈 記事生成トレンド</h3>
                                        <div style={{ width: '100%', height: 300 }}>
                                            <ResponsiveContainer>
                                                <LineChart data={dashboardData.timeSeriesData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="date" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="articleCount" 
                                                        stroke="#6366f1" 
                                                        strokeWidth={2}
                                                        name="記事数"
                                                    />
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="averageQuality" 
                                                        stroke="#10b981" 
                                                        strokeWidth={2}
                                                        name="平均品質"
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}

                                {/* User Analysis */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Usage Patterns */}
                                    <div className="bg-white/60 p-6 rounded-xl border border-white/30">
                                        <h3 className="text-lg font-bold text-gray-800 mb-4">👤 ユーザー利用パターン</h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">平均記事文字数</span>
                                                <span className="font-bold">
                                                    {formatNumber(dashboardData.userAnalysis.averageArticleLength)}文字
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">月間アクティブユーザー</span>
                                                <span className="font-bold">
                                                    {formatNumber(dashboardData.userAnalysis.usagePatterns.monthlyActiveUsers)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">1ユーザーあたり平均記事数</span>
                                                <span className="font-bold">
                                                    {dashboardData.userAnalysis.usagePatterns.averageArticlesPerUser.toFixed(1)}記事
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Most Used Tones */}
                                    {dashboardData.userAnalysis.mostUsedTones.length > 0 && (
                                        <div className="bg-white/60 p-6 rounded-xl border border-white/30">
                                            <h3 className="text-lg font-bold text-gray-800 mb-4">🎭 人気の文体</h3>
                                            <div style={{ width: '100%', height: 250 }}>
                                                <ResponsiveContainer>
                                                    <PieChart>
                                                        <Pie
                                                            data={dashboardData.userAnalysis.mostUsedTones}
                                                            cx="50%"
                                                            cy="50%"
                                                            labelLine={false}
                                                            label={({ tone, percentage }) => `${tone} ${percentage}%`}
                                                            outerRadius={80}
                                                            fill="#8884d8"
                                                            dataKey="percentage"
                                                        >
                                                            {dashboardData.userAnalysis.mostUsedTones.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Performance Analysis */}
                                <div className="bg-white/60 p-6 rounded-xl border border-white/30">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">⚡ パフォーマンス分析</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {dashboardData.performanceAnalysis.systemMetrics.averageResponseTime.toFixed(0)}ms
                                            </div>
                                            <div className="text-sm text-gray-600">平均応答時間</div>
                                        </div>
                                        <div className="text-center p-4 bg-green-50 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600">
                                                {dashboardData.performanceAnalysis.systemMetrics.throughput.toFixed(1)}/min
                                            </div>
                                            <div className="text-sm text-gray-600">スループット</div>
                                        </div>
                                        <div className="text-center p-4 bg-red-50 rounded-lg">
                                            <div className="text-2xl font-bold text-red-600">
                                                {dashboardData.performanceAnalysis.systemMetrics.errorRate.toFixed(2)}%
                                            </div>
                                            <div className="text-sm text-gray-600">エラー率</div>
                                        </div>
                                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                                            <div className="text-2xl font-bold text-purple-600">
                                                {dashboardData.performanceAnalysis.systemMetrics.uptime.toFixed(1)}%
                                            </div>
                                            <div className="text-sm text-gray-600">稼働率</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Export Options */}
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => {
                                            // エクスポート機能の実装
                                            const dataStr = JSON.stringify(dashboardData, null, 2);
                                            const dataBlob = new Blob([dataStr], { type: 'application/json' });
                                            const url = URL.createObjectURL(dataBlob);
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.download = `analytics_${new Date().toISOString().split('T')[0]}.json`;
                                            link.click();
                                        }}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        📥 データをエクスポート
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-gray-400 text-6xl mb-4">📊</div>
                                <h3 className="text-xl font-bold text-gray-700 mb-2">分析データがありません</h3>
                                <p className="text-gray-600">記事を生成すると分析データが表示されます</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;