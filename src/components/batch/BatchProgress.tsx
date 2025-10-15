import React, { useState, useEffect } from 'react';
import { BatchArticleGenerator } from '../../services/batch/batchGenerator';
import { BatchArticleJob, BatchJobStatus } from '../../types/batch.types';
import { ProcessStep } from '../../types';

interface BatchProgressProps {
    generator: BatchArticleGenerator;
    onCancel: () => void;
}

const BatchProgress: React.FC<BatchProgressProps> = ({ generator, onCancel }) => {
    const [jobs, setJobs] = useState<BatchArticleJob[]>([]);
    const [progress, setProgress] = useState(generator.getResults()?.progress);

    useEffect(() => {
        // Set up callbacks for real-time updates
        generator.setProgressCallback((newProgress) => {
            setProgress(newProgress);
        });

        generator.setJobCallback((updatedJob) => {
            setJobs(prevJobs => 
                prevJobs.map(job => 
                    job.id === updatedJob.id ? updatedJob : job
                )
            );
        });

        // Initialize with current jobs
        setJobs(generator.getCurrentJobs());
        
        const results = generator.getResults();
        if (results) {
            setProgress(results.progress);
        }
    }, [generator]);

    const getStatusIcon = (status: BatchJobStatus) => {
        switch (status) {
            case BatchJobStatus.PENDING:
                return '⏳';
            case BatchJobStatus.RUNNING:
                return '🔄';
            case BatchJobStatus.COMPLETED:
                return '✅';
            case BatchJobStatus.FAILED:
                return '❌';
            case BatchJobStatus.CANCELLED:
                return '⚠️';
            default:
                return '❓';
        }
    };

    const getProgressIcon = (step: ProcessStep) => {
        switch (step) {
            case ProcessStep.ANALYZING:
                return '📊';
            case ProcessStep.OUTLINING:
                return '📝';
            case ProcessStep.WRITING:
                return '✍️';
            case ProcessStep.FACT_CHECKING:
                return '✓';
            case ProcessStep.GENERATING_IMAGE:
                return '🖼️';
            case ProcessStep.GENERATING_X_POSTS:
                return '🐦';
            case ProcessStep.DONE:
                return '🎉';
            default:
                return '⚪';
        }
    };

    const formatTime = (ms: number): string => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
        } else if (minutes > 0) {
            return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
        } else {
            return `${seconds}秒`;
        }
    };

    if (!progress) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">バッチ処理を開始しています...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Overall Progress */}
            <div className="backdrop-blur-sm bg-white/60 p-6 rounded-xl border border-white/30">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        バッチ生成進捗
                    </h3>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-indigo-600">{progress.overallProgress}%</div>
                        <div className="text-sm text-gray-600">
                            {progress.completedJobs}/{progress.totalJobs} 完了
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="relative mb-4">
                    <div className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full overflow-hidden shadow-inner">
                        <div 
                            style={{ width: `${progress.overallProgress}%` }} 
                            className="h-full bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 transition-all duration-1000 ease-out rounded-full relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent"></div>
                        </div>
                    </div>
                </div>

                {/* Status Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-3 bg-blue-50/60 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">{progress.runningJobs}</div>
                        <div className="text-sm text-blue-700">実行中</div>
                    </div>
                    <div className="p-3 bg-green-50/60 rounded-lg">
                        <div className="text-lg font-bold text-green-600">{progress.completedJobs}</div>
                        <div className="text-sm text-green-700">完了</div>
                    </div>
                    <div className="p-3 bg-red-50/60 rounded-lg">
                        <div className="text-lg font-bold text-red-600">{progress.failedJobs}</div>
                        <div className="text-sm text-red-700">失敗</div>
                    </div>
                    <div className="p-3 bg-gray-50/60 rounded-lg">
                        <div className="text-lg font-bold text-gray-600">{progress.pendingJobs}</div>
                        <div className="text-sm text-gray-700">待機中</div>
                    </div>
                </div>

                {/* Estimated Time */}
                {progress.estimatedTimeRemaining && (
                    <div className="mt-4 text-center text-sm text-gray-600">
                        推定残り時間: {formatTime(progress.estimatedTimeRemaining)}
                    </div>
                )}

                {/* Cancel Button */}
                <div className="mt-6 text-center">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
                    >
                        ⏹️ 処理を中止
                    </button>
                </div>
            </div>

            {/* Individual Job Progress */}
            <div className="backdrop-blur-sm bg-white/60 p-6 rounded-xl border border-white/30">
                <h4 className="text-lg font-bold text-gray-800 mb-4">個別記事の進捗</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                    {jobs.map((job) => (
                        <div 
                            key={job.id} 
                            className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                                job.status === BatchJobStatus.RUNNING 
                                    ? 'bg-blue-50/80 border border-blue-200' 
                                    : job.status === BatchJobStatus.COMPLETED
                                    ? 'bg-green-50/80 border border-green-200'
                                    : job.status === BatchJobStatus.FAILED
                                    ? 'bg-red-50/80 border border-red-200'
                                    : 'bg-gray-50/80 border border-gray-200'
                            }`}
                        >
                            <div className="flex items-center space-x-3 flex-1">
                                <div className="text-xl">
                                    {getStatusIcon(job.status)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate">
                                        {job.keyword}
                                    </div>
                                    <div className="text-sm text-gray-600 flex items-center">
                                        {job.status === BatchJobStatus.RUNNING && (
                                            <>
                                                <span className="mr-2">{getProgressIcon(job.progress)}</span>
                                                <span>{job.progress}</span>
                                            </>
                                        )}
                                        {job.status === BatchJobStatus.COMPLETED && job.actualTimeMs && (
                                            <span>完了時間: {formatTime(job.actualTimeMs)}</span>
                                        )}
                                        {job.status === BatchJobStatus.FAILED && job.error && (
                                            <span className="text-red-600 truncate">{job.error}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {job.status === BatchJobStatus.RUNNING && (
                                <div className="flex items-center space-x-2">
                                    <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BatchProgress;