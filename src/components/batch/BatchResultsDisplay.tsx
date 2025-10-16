import React, { useState } from 'react';
import { BatchResults, BatchArticleJob, BatchJobStatus } from '../../types/batch.types';
import OutputDisplay from '../display/OutputDisplay';

interface BatchResultsDisplayProps {
    results: BatchResults;
}

const BatchResultsDisplay: React.FC<BatchResultsDisplayProps> = ({ results }) => {
    const [selectedJob, setSelectedJob] = useState<BatchArticleJob | null>(null);
    const [filterStatus, setFilterStatus] = useState<BatchJobStatus | 'all'>('all');

    const completedJobs = results.jobs.filter(job => job.status === BatchJobStatus.COMPLETED);
    const failedJobs = results.jobs.filter(job => job.status === BatchJobStatus.FAILED);
    
    const filteredJobs = results.jobs.filter(job => 
        filterStatus === 'all' || job.status === filterStatus
    );

    const totalTime = results.endTime ? 
        results.endTime.getTime() - results.startTime.getTime() : 0;

    const formatTime = (ms: number): string => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}時間${(minutes % 60)}分`;
        } else if (minutes > 0) {
            return `${minutes}分${(seconds % 60)}秒`;
        } else {
            return `${seconds}秒`;
        }
    };

    const downloadAllAsZip = () => {
        // TODO: Implement ZIP download functionality
        alert('ZIP ダウンロード機能は今後実装予定です');
    };

    const copyAllTitles = () => {
        const titles = completedJobs
            .map(job => job.output?.markdownContent.match(/^#\s+(.+)/m)?.[1] || job.keyword)
            .join('\n');
        
        navigator.clipboard.writeText(titles).then(() => {
            alert('タイトル一覧をコピーしました');
        });
    };

    if (selectedJob && selectedJob.output) {
        return (
            <div>
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => setSelectedJob(null)}
                        className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>一覧に戻る</span>
                    </button>
                    <h3 className="text-xl font-bold text-gray-800">
                        {selectedJob.keyword}
                    </h3>
                </div>
                <OutputDisplay output={selectedJob.output} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="backdrop-blur-sm bg-white/60 p-6 rounded-xl border border-white/30">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                        バッチ生成完了！
                    </h3>
                    <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                            {results.progress.completedJobs}/{results.progress.totalJobs} 成功
                        </div>
                        <div className="text-sm text-gray-600">
                            実行時間: {formatTime(totalTime)}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 bg-green-50/60 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{completedJobs.length}</div>
                        <div className="text-sm text-green-700">成功</div>
                    </div>
                    <div className="p-4 bg-red-50/60 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{failedJobs.length}</div>
                        <div className="text-sm text-red-700">失敗</div>
                    </div>
                    <div className="p-4 bg-blue-50/60 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                            {Math.round(results.progress.overallProgress)}%
                        </div>
                        <div className="text-sm text-blue-700">成功率</div>
                    </div>
                    <div className="p-4 bg-purple-50/60 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                            {completedJobs.length > 0 ? 
                                Math.round(completedJobs.reduce((sum, job) => sum + (job.actualTimeMs || 0), 0) / completedJobs.length / 1000) 
                                : 0}秒
                        </div>
                        <div className="text-sm text-purple-700">平均時間</div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mt-6">
                    <button
                        onClick={downloadAllAsZip}
                        disabled={completedJobs.length === 0}
                        className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>全記事をZIPダウンロード</span>
                    </button>
                    
                    <button
                        onClick={copyAllTitles}
                        disabled={completedJobs.length === 0}
                        className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>タイトル一覧をコピー</span>
                    </button>
                </div>
            </div>

            {/* Filter */}
            <div className="backdrop-blur-sm bg-white/60 p-4 rounded-xl border border-white/30">
                <div className="flex items-center space-x-4">
                    <label className="font-medium text-gray-700">フィルター:</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as BatchJobStatus | 'all')}
                        className="px-3 py-2 bg-white/60 border border-white/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        <option value="all">すべて ({results.jobs.length})</option>
                        <option value={BatchJobStatus.COMPLETED}>成功のみ ({completedJobs.length})</option>
                        <option value={BatchJobStatus.FAILED}>失敗のみ ({failedJobs.length})</option>
                    </select>
                </div>
            </div>

            {/* Job List */}
            <div className="backdrop-blur-sm bg-white/60 p-6 rounded-xl border border-white/30">
                <h4 className="text-lg font-bold text-gray-800 mb-4">生成結果一覧</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {(filteredJobs || []).map((job) => (
                        <div 
                            key={job.id}
                            className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                                job.status === BatchJobStatus.COMPLETED 
                                    ? 'bg-green-50/80 border-green-200 hover:bg-green-100/80' 
                                    : job.status === BatchJobStatus.FAILED
                                    ? 'bg-red-50/80 border-red-200 hover:bg-red-100/80'
                                    : 'bg-gray-50/80 border-gray-200 hover:bg-gray-100/80'
                            }`}
                            onClick={() => job.status === BatchJobStatus.COMPLETED && setSelectedJob(job)}
                        >
                            <div className="flex items-center space-x-4 flex-1">
                                <div className="text-2xl">
                                    {job.status === BatchJobStatus.COMPLETED ? '✅' : 
                                     job.status === BatchJobStatus.FAILED ? '❌' : '⏳'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 truncate">
                                        {job.keyword}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {job.status === BatchJobStatus.COMPLETED && job.output && (
                                            <span className="text-green-700">
                                                {job.output.markdownContent.match(/^#\s+(.+)/m)?.[1] || 'タイトル未取得'}
                                            </span>
                                        )}
                                        {job.status === BatchJobStatus.FAILED && job.error && (
                                            <span className="text-red-700 truncate">
                                                エラー: {job.error}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="text-right text-sm text-gray-500">
                                {job.actualTimeMs && (
                                    <div>{formatTime(job.actualTimeMs)}</div>
                                )}
                                {job.status === BatchJobStatus.COMPLETED && (
                                    <div className="text-indigo-600 font-medium">
                                        詳細を表示 →
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {failedJobs.length > 0 && (
                <div className="backdrop-blur-sm bg-red-50/60 p-4 rounded-xl border border-red-200/30">
                    <h5 className="font-bold text-red-800 mb-2">⚠️ 失敗したジョブ</h5>
                    <ul className="text-sm text-red-700 space-y-1">
                        {failedJobs.map(job => (
                            <li key={job.id}>
                                <strong>{job.keyword}</strong>: {job.error}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default BatchResultsDisplay;