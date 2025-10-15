import React, { useState } from 'react';
import { 
    ApprovalStep, 
    StepType, 
    ApprovalStatus, 
    UserFeedback,
    OutlineApprovalData,
    ContentApprovalData,
    ImageApprovalData,
    XPostApprovalData
} from '../../types/approval.types';

interface StepReviewCardProps {
    step: ApprovalStep;
    isCurrentStep: boolean;
    isCompleted: boolean;
    isPending: boolean;
    isSubmitting: boolean;
    onFeedback: (feedback: Omit<UserFeedback, 'timestamp'>) => void;
    onSkip: (reason?: string) => void;
}

const StepReviewCard: React.FC<StepReviewCardProps> = ({
    step,
    isCurrentStep,
    isCompleted,
    isPending,
    isSubmitting,
    onFeedback,
    onSkip
}) => {
    const [showFeedbackForm, setShowFeedbackForm] = useState(false);
    const [comment, setComment] = useState('');
    const [suggestions, setSuggestions] = useState('');
    const [rating, setRating] = useState<number>(5);
    const [decision, setDecision] = useState<ApprovalStatus>(ApprovalStatus.APPROVED);

    const getStepIcon = (type: StepType) => {
        switch (type) {
            case StepType.OUTLINE_REVIEW: return '📋';
            case StepType.CONTENT_REVIEW: return '📝';
            case StepType.IMAGE_REVIEW: return '🖼️';
            case StepType.XPOST_REVIEW: return '🐦';
            case StepType.FINAL_REVIEW: return '🎯';
            default: return '❓';
        }
    };

    const getStatusIcon = (status: ApprovalStatus) => {
        switch (status) {
            case ApprovalStatus.PENDING: return '⏳';
            case ApprovalStatus.APPROVED: return '✅';
            case ApprovalStatus.REJECTED: return '❌';
            case ApprovalStatus.MODIFIED: return '📝';
            case ApprovalStatus.SKIPPED: return '⏭️';
            default: return '❓';
        }
    };

    const getStatusColor = (status: ApprovalStatus) => {
        switch (status) {
            case ApprovalStatus.PENDING: return 'border-yellow-200 bg-yellow-50';
            case ApprovalStatus.APPROVED: return 'border-green-200 bg-green-50';
            case ApprovalStatus.REJECTED: return 'border-red-200 bg-red-50';
            case ApprovalStatus.MODIFIED: return 'border-blue-200 bg-blue-50';
            case ApprovalStatus.SKIPPED: return 'border-gray-200 bg-gray-50';
            default: return 'border-gray-200 bg-white';
        }
    };

    const handleSubmitFeedback = () => {
        const feedback: Omit<UserFeedback, 'timestamp'> = {
            decision,
            comment: comment.trim() || undefined,
            suggestions: suggestions.trim() || undefined,
            rating
        };

        onFeedback(feedback);
        setShowFeedbackForm(false);
        setComment('');
        setSuggestions('');
        setRating(5);
    };

    const renderStepContent = () => {
        if (!step.content) {
            return (
                <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                    このステップのコンテンツはまだ準備されていません
                </div>
            );
        }

        switch (step.type) {
            case StepType.OUTLINE_REVIEW:
                return renderOutlineContent(step.content as OutlineApprovalData);
            case StepType.CONTENT_REVIEW:
                return renderContentReview(step.content as ContentApprovalData);
            case StepType.IMAGE_REVIEW:
                return renderImageReview(step.content as ImageApprovalData);
            case StepType.XPOST_REVIEW:
                return renderXPostReview(step.content as XPostApprovalData);
            case StepType.FINAL_REVIEW:
                return renderFinalReview();
            default:
                return <div>未対応のステップタイプです</div>;
        }
    };

    const renderOutlineContent = (data: OutlineApprovalData) => (
        <div className="space-y-4">
            <div>
                <h4 className="font-bold text-gray-800 mb-2">記事タイトル</h4>
                <div className="p-3 bg-white rounded border text-gray-700">
                    {data.originalOutline.title}
                </div>
            </div>
            <div>
                <h4 className="font-bold text-gray-800 mb-2">メタディスクリプション</h4>
                <div className="p-3 bg-white rounded border text-gray-700">
                    {data.originalOutline.metaDescription}
                </div>
            </div>
            <div>
                <h4 className="font-bold text-gray-800 mb-2">記事構成</h4>
                <div className="space-y-2">
                    {data.originalOutline.sections.map((section, index) => (
                        <div key={index} className="p-3 bg-white rounded border">
                            <div className="font-medium text-gray-800">{section.heading}</div>
                            {section.subheadings.length > 0 && (
                                <ul className="mt-2 ml-4 text-sm text-gray-600 list-disc">
                                    {section.subheadings.map((sub, subIndex) => (
                                        <li key={subIndex}>{sub}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderContentReview = (data: ContentApprovalData) => (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="font-bold text-gray-800">記事本文</h4>
                <div className="text-sm text-gray-600">
                    文字数: {data.wordCount}文字
                </div>
            </div>
            <div className="p-4 bg-white rounded border max-h-64 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                    {data.originalContent}
                </pre>
            </div>
        </div>
    );

    const renderImageReview = (data: ImageApprovalData) => (
        <div className="space-y-4">
            <div>
                <h4 className="font-bold text-gray-800 mb-2">生成された画像</h4>
                <div className="relative group">
                    <img 
                        src={data.originalImageUrl} 
                        alt="Generated image" 
                        className="w-full max-w-md rounded-lg shadow-lg"
                    />
                </div>
            </div>
            <div>
                <h4 className="font-bold text-gray-800 mb-2">画像生成プロンプト</h4>
                <div className="p-3 bg-white rounded border text-gray-700">
                    {data.originalPrompt}
                </div>
            </div>
        </div>
    );

    const renderXPostReview = (data: XPostApprovalData) => (
        <div className="space-y-4">
            <h4 className="font-bold text-gray-800 mb-2">X投稿案</h4>
            <div className="space-y-3">
                {data.originalPosts.map((post, index) => (
                    <div key={index} className="p-3 bg-white rounded border">
                        <div className="text-sm text-gray-600 mb-1">
                            {post.type} - {post.audience}
                        </div>
                        <div className="text-gray-800">{post.content}</div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderFinalReview = () => (
        <div className="text-center p-6">
            <div className="text-4xl mb-4">🎯</div>
            <h4 className="font-bold text-gray-800 mb-2">最終確認</h4>
            <p className="text-gray-600">
                全てのステップが完了しました。記事の内容を最終確認し、公開準備を進めてください。
            </p>
        </div>
    );

    return (
        <div className={`
            border-2 rounded-xl p-6 transition-all duration-300
            ${isCurrentStep ? 'ring-2 ring-indigo-300 shadow-lg' : ''}
            ${getStatusColor(step.status)}
        `}>
            {/* Step Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold
                        ${isCurrentStep ? 'bg-indigo-500 text-white' : 
                          isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}
                    `}>
                        {isCompleted ? getStatusIcon(step.status) : getStepIcon(step.type)}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">{step.title}</h3>
                        <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                </div>
                <div className="text-sm text-gray-500">
                    {getStatusIcon(step.status)} {step.status}
                </div>
            </div>

            {/* Step Content */}
            <div className="mb-4">
                {renderStepContent()}
            </div>

            {/* Feedback Section */}
            {step.feedback && (
                <div className="mb-4 p-4 bg-white/60 rounded-lg border">
                    <h5 className="font-medium text-gray-800 mb-2">フィードバック</h5>
                    {step.feedback.comment && (
                        <p className="text-sm text-gray-700 mb-2">{step.feedback.comment}</p>
                    )}
                    {step.feedback.suggestions && (
                        <div className="text-sm text-gray-700 mb-2">
                            <strong>修正提案:</strong> {step.feedback.suggestions}
                        </div>
                    )}
                    {step.feedback.rating && (
                        <div className="text-sm text-gray-600">
                            評価: {'⭐'.repeat(step.feedback.rating)} ({step.feedback.rating}/5)
                        </div>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            {isPending && step.content && !showFeedbackForm && (
                <div className="flex space-x-3">
                    <button
                        onClick={() => setShowFeedbackForm(true)}
                        disabled={isSubmitting}
                        className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                        レビューする
                    </button>
                    <button
                        onClick={() => onSkip()}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                    >
                        スキップ
                    </button>
                </div>
            )}

            {/* Feedback Form */}
            {showFeedbackForm && (
                <div className="mt-4 p-4 bg-white rounded-lg border space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">判定</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setDecision(ApprovalStatus.APPROVED)}
                                className={`p-2 rounded text-sm font-medium transition-colors ${
                                    decision === ApprovalStatus.APPROVED 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                            >
                                ✅ 承認
                            </button>
                            <button
                                onClick={() => setDecision(ApprovalStatus.MODIFIED)}
                                className={`p-2 rounded text-sm font-medium transition-colors ${
                                    decision === ApprovalStatus.MODIFIED 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                            >
                                📝 修正
                            </button>
                            <button
                                onClick={() => setDecision(ApprovalStatus.REJECTED)}
                                className={`p-2 rounded text-sm font-medium transition-colors ${
                                    decision === ApprovalStatus.REJECTED 
                                        ? 'bg-red-500 text-white' 
                                        : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                            >
                                ❌ 却下
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">コメント</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            rows={3}
                            placeholder="フィードバックや感想をお聞かせください"
                        />
                    </div>

                    {decision === ApprovalStatus.MODIFIED && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">修正提案</label>
                            <textarea
                                value={suggestions}
                                onChange={(e) => setSuggestions(e.target.value)}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                rows={3}
                                placeholder="具体的な修正案をお聞かせください"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">評価 (1-5)</label>
                        <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className={`text-2xl transition-colors ${
                                        star <= rating ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                >
                                    ⭐
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={handleSubmitFeedback}
                            disabled={isSubmitting}
                            className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? '送信中...' : 'フィードバックを送信'}
                        </button>
                        <button
                            onClick={() => setShowFeedbackForm(false)}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-lg transition-colors"
                        >
                            キャンセル
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StepReviewCard;