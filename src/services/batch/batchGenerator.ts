import { v4 as uuidv4 } from 'uuid';
import { 
    BatchArticleJob, 
    BatchJobStatus, 
    BatchConfig, 
    BatchGenerationRequest, 
    BatchResults,
    BatchProgress 
} from '../../types/batch.types';
import { ProcessStep, FinalOutput } from '../../types';
import * as geminiService from '../ai/geminiService';
import { generateXPosts } from '../social/xPostGenerator';
import { extractClaims, performFactCheck } from '../research/tavilyService';

export class BatchArticleGenerator {
    private jobs: Map<string, BatchArticleJob> = new Map();
    private results: BatchResults | null = null;
    private isRunning = false;
    private abortController: AbortController | null = null;

    private defaultConfig: BatchConfig = {
        maxConcurrentJobs: 2, // Conservative to avoid API rate limits
        delayBetweenJobs: 3000, // 3 seconds between jobs
        retryAttempts: 2,
        timeoutMs: 300000 // 5 minutes per job
    };

    private onProgressUpdate: ((progress: BatchProgress) => void) | null = null;
    private onJobUpdate: ((job: BatchArticleJob) => void) | null = null;

    setProgressCallback(callback: (progress: BatchProgress) => void) {
        this.onProgressUpdate = callback;
    }

    setJobCallback(callback: (job: BatchArticleJob) => void) {
        this.onJobUpdate = callback;
    }

    async startBatch(request: BatchGenerationRequest): Promise<BatchResults> {
        if (this.isRunning) {
            throw new Error('バッチ処理が既に実行中です');
        }

        this.isRunning = true;
        this.abortController = new AbortController();
        
        const config = { ...this.defaultConfig, ...request.config };
        
        // Initialize jobs
        this.jobs.clear();
        const jobs: BatchArticleJob[] = request.keywords.map(keyword => ({
            id: uuidv4(),
            keyword,
            tone: request.tone,
            audience: request.audience,
            targetLength: request.targetLength,
            imageTheme: request.imageTheme,
            status: BatchJobStatus.PENDING,
            progress: ProcessStep.IDLE,
            createdAt: new Date(),
            updatedAt: new Date(),
            estimatedTimeMs: this.estimateJobTime(request.targetLength)
        }));

        jobs.forEach(job => this.jobs.set(job.id, job));

        this.results = {
            jobs,
            progress: this.calculateProgress(),
            startTime: new Date(),
            config
        };

        try {
            await this.processBatch(config);
            this.results.endTime = new Date();
        } catch (error) {
            console.error('Batch processing error:', error);
            // Mark remaining pending/running jobs as failed
            this.jobs.forEach(job => {
                if (job.status === BatchJobStatus.PENDING || job.status === BatchJobStatus.RUNNING) {
                    job.status = BatchJobStatus.FAILED;
                    job.error = error instanceof Error ? error.message : 'Unknown error';
                    job.updatedAt = new Date();
                }
            });
        } finally {
            this.isRunning = false;
            this.abortController = null;
        }

        return this.results;
    }

    private async processBatch(config: BatchConfig): Promise<void> {
        const pendingJobs = Array.from(this.jobs.values())
            .filter(job => job.status === BatchJobStatus.PENDING);

        // Process jobs in batches with concurrency limit
        for (let i = 0; i < pendingJobs.length; i += config.maxConcurrentJobs) {
            const batch = pendingJobs.slice(i, i + config.maxConcurrentJobs);
            
            // Process batch concurrently
            const promises = batch.map(job => this.processJob(job, config));
            await Promise.allSettled(promises);

            // Update progress
            this.updateProgress();

            // Delay between batches (except for the last batch)
            if (i + config.maxConcurrentJobs < pendingJobs.length) {
                await this.delay(config.delayBetweenJobs);
            }

            // Check if cancelled
            if (this.abortController?.signal.aborted) {
                throw new Error('Batch processing cancelled');
            }
        }
    }

    private async processJob(job: BatchArticleJob, config: BatchConfig): Promise<void> {
        const startTime = Date.now();
        let attempt = 0;

        while (attempt < config.retryAttempts && job.status !== BatchJobStatus.COMPLETED) {
            attempt++;
            
            try {
                job.status = BatchJobStatus.RUNNING;
                job.updatedAt = new Date();
                this.updateJobAndNotify(job);

                // Create timeout promise
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('Job timeout')), config.timeoutMs);
                });

                // Race between job execution and timeout
                const output = await Promise.race([
                    this.executeJob(job),
                    timeoutPromise
                ]);

                job.output = output;
                job.status = BatchJobStatus.COMPLETED;
                job.actualTimeMs = Date.now() - startTime;
                job.updatedAt = new Date();
                
                this.updateJobAndNotify(job);
                break; // Success, exit retry loop

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`Job ${job.id} attempt ${attempt} failed:`, errorMessage);
                
                if (attempt >= config.retryAttempts) {
                    job.status = BatchJobStatus.FAILED;
                    job.error = `Failed after ${attempt} attempts: ${errorMessage}`;
                    job.actualTimeMs = Date.now() - startTime;
                    job.updatedAt = new Date();
                    this.updateJobAndNotify(job);
                } else {
                    // Reset to pending for retry
                    job.status = BatchJobStatus.PENDING;
                    job.progress = ProcessStep.IDLE;
                    job.updatedAt = new Date();
                    await this.delay(1000 * attempt); // Exponential backoff
                }
            }
        }
    }

    private async executeJob(job: BatchArticleJob): Promise<FinalOutput> {
        // Step 1: SEO Analysis
        job.progress = ProcessStep.ANALYZING;
        this.updateJobAndNotify(job);
        const analysis = await geminiService.analyzeSerpResults(job.keyword);

        // Step 2: Article Outline
        job.progress = ProcessStep.OUTLINING;
        this.updateJobAndNotify(job);
        const outline = await geminiService.createArticleOutline(
            analysis, 
            job.audience, 
            job.tone, 
            job.keyword
        );

        // Step 3: Article Writing
        job.progress = ProcessStep.WRITING;
        this.updateJobAndNotify(job);
        const markdownContent = await geminiService.writeArticle(
            outline, 
            job.targetLength, 
            job.tone, 
            job.audience
        );

        // Step 4: Fact Checking
        job.progress = ProcessStep.FACT_CHECKING;
        this.updateJobAndNotify(job);
        const claims = await extractClaims(markdownContent, job.keyword);
        const factCheckSummary = await performFactCheck({
            articleContent: markdownContent,
            claims: claims,
            keyword: job.keyword,
        });

        // Step 5: Image Generation
        job.progress = ProcessStep.GENERATING_IMAGE;
        this.updateJobAndNotify(job);
        const imagePrompt = await geminiService.createImagePrompt(
            outline.title, 
            markdownContent, 
            job.imageTheme
        );
        const imageUrl = await geminiService.generateImage(imagePrompt);

        // Step 6: X Posts Generation
        job.progress = ProcessStep.GENERATING_X_POSTS;
        this.updateJobAndNotify(job);
        const xPosts = await generateXPosts({
            keyword: job.keyword,
            articleTitle: outline.title,
            articleSummary: outline.metaDescription,
            tone: job.tone,
            targetAudiences: ['初心者', '中級者', 'ビジネスパーソン', '主婦・主夫', '学生'],
        });

        job.progress = ProcessStep.DONE;
        this.updateJobAndNotify(job);

        return {
            markdownContent,
            imageUrl,
            metaDescription: outline.metaDescription,
            xPosts,
            factCheckSummary
        };
    }

    private updateJobAndNotify(job: BatchArticleJob): void {
        this.jobs.set(job.id, { ...job });
        this.onJobUpdate?.(job);
    }

    private updateProgress(): void {
        const progress = this.calculateProgress();
        if (this.results) {
            this.results.progress = progress;
        }
        this.onProgressUpdate?.(progress);
    }

    private calculateProgress(): BatchProgress {
        const jobs = Array.from(this.jobs.values());
        const totalJobs = jobs.length;
        const completedJobs = jobs.filter(j => j.status === BatchJobStatus.COMPLETED).length;
        const failedJobs = jobs.filter(j => j.status === BatchJobStatus.FAILED).length;
        const runningJobs = jobs.filter(j => j.status === BatchJobStatus.RUNNING).length;
        const pendingJobs = jobs.filter(j => j.status === BatchJobStatus.PENDING).length;

        const overallProgress = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;

        // Estimate remaining time based on completed jobs
        let estimatedTimeRemaining: number | undefined;
        const completedJobsWithTime = jobs.filter(j => j.actualTimeMs && j.status === BatchJobStatus.COMPLETED);
        if (completedJobsWithTime.length > 0 && pendingJobs + runningJobs > 0) {
            const avgTimePerJob = completedJobsWithTime.reduce((sum, j) => sum + (j.actualTimeMs || 0), 0) / completedJobsWithTime.length;
            estimatedTimeRemaining = avgTimePerJob * (pendingJobs + runningJobs);
        }

        return {
            totalJobs,
            completedJobs,
            failedJobs,
            runningJobs,
            pendingJobs,
            overallProgress,
            estimatedTimeRemaining
        };
    }

    private estimateJobTime(targetLength: number): number {
        // Base time estimates based on article length
        const baseTime = 60000; // 1 minute base
        const lengthMultiplier = targetLength / 2500; // Scale based on 2500 chars baseline
        return Math.round(baseTime * lengthMultiplier * 1.5); // Add buffer
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    cancelBatch(): void {
        if (this.abortController) {
            this.abortController.abort();
        }
    }

    getResults(): BatchResults | null {
        return this.results;
    }

    getCurrentJobs(): BatchArticleJob[] {
        return Array.from(this.jobs.values());
    }

    isGenerating(): boolean {
        return this.isRunning;
    }
}