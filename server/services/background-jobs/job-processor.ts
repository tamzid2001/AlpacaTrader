import { storage } from '../../storage';
import type { BackgroundJob, InsertBackgroundJob, PremiumJobType, JobStatus } from '@shared/schema';
import { awsJobExecutor } from './aws-integration';

export class JobProcessor {
  private processing = new Set<string>();
  private jobProcessorInterval: NodeJS.Timeout | null = null;

  constructor() {
    console.log('🚀 JobProcessor initialized');
    this.startJobProcessor();
  }

  async createJob(userId: string, jobType: PremiumJobType, params: any): Promise<string> {
    console.log(`📝 Creating job for user ${userId}, type: ${jobType}`);
    
    // Check if user is premium
    const user = await storage.getUser(userId);
    if (!user?.isPremiumApproved) {
      throw new Error('Premium access required for background jobs');
    }

    // Create job with higher priority for premium users
    const priority = this.getPriorityByTier(user.premiumTier);
    
    const jobData: InsertBackgroundJob = {
      userId,
      jobType,
      jobParams: params,
      priority,
      estimatedDuration: this.estimateDuration(jobType, params),
      status: 'queued',
      progressPercentage: 0,
      retryCount: 0,
      maxRetries: 3,
    };

    const jobId = await storage.createBackgroundJob(jobData);
    console.log(`✅ Job ${jobId} created successfully`);
    return jobId;
  }

  private getPriorityByTier(premiumTier: string | null): number {
    switch (premiumTier) {
      case 'professional': return 5; // Highest priority
      case 'advanced': return 4;
      case 'basic': return 3;
      default: return 2; // Default for premium users without tier
    }
  }

  private estimateDuration(jobType: PremiumJobType, params: any): number {
    // Estimate job duration in minutes based on job type and parameters
    switch (jobType) {
      case 'market_data_analysis':
        return params.symbols?.length * 2 || 10; // 2 min per symbol
      case 'portfolio_optimization':
        return params.portfolioSize * 3 || 15; // 3 min per asset
      case 'risk_assessment':
        return params.complexity === 'advanced' ? 30 : 15;
      case 'financial_forecasting':
        return params.period === '5y' ? 45 : 20;
      case 'batch_data_processing':
        return Math.max(params.dataSize / 1000 * 5, 10); // 5 min per 1000 records
      case 'automated_reporting':
        return params.reportType === 'comprehensive' ? 25 : 10;
      case 'anomaly_detection':
        return params.dataPoints > 10000 ? 35 : 20;
      case 'sentiment_analysis':
        return params.articles?.length * 0.5 || 15; // 30 sec per article
      case 'correlation_analysis':
        return params.assets?.length * params.assets?.length * 0.1 || 20;
      case 'backtesting':
        return params.strategies?.length * 10 || 30; // 10 min per strategy
      default:
        return 15; // Default estimate
    }
  }

  private async startJobProcessor() {
    console.log('🔄 Starting job processor loop');
    
    // Process multiple jobs every 3 seconds for better throughput
    this.jobProcessorInterval = setInterval(async () => {
      try {
        // Try to start multiple jobs if there's capacity
        const attempts = 5; // Try to start up to 5 jobs per cycle
        for (let i = 0; i < attempts; i++) {
          await this.processNextJob();
        }
      } catch (error) {
        console.error('❌ Error in job processor loop:', error);
      }
    }, 3000); // Check every 3 seconds for better responsiveness
  }

  private async processNextJob() {
    // Get ALL queued jobs, not just the first one
    const queuedJobs = await storage.getAllQueuedJobs();
    if (!queuedJobs || queuedJobs.length === 0) return;

    // Try to find a job from any tier that has available capacity
    for (const job of queuedJobs) {
      // Skip if this specific job is already being processed
      if (this.processing.has(job.id)) continue;

      // Get user's premium tier
      const user = await storage.getUser(job.userId);
      const tierLimits = this.getTierLimits(user?.premiumTier || null);
      
      // Count jobs currently processing for this specific tier
      const currentTierJobs = await this.countJobsForTier(user?.premiumTier || null);
      
      if (currentTierJobs < tierLimits.maxConcurrentJobs) {
        // This tier has capacity - process this job
        console.log(`🚀 Processing job ${job.id} for tier ${user?.premiumTier || 'basic'} (${currentTierJobs + 1}/${tierLimits.maxConcurrentJobs} slots)`);

        // Mark job as being processed and remove from queue
        this.processing.add(job.id);
        await storage.updateJobStatus(job.id, 'running', { startedAt: new Date() });
        
        try {
          await this.executeJob(job, user?.premiumTier || null);
          console.log(`✅ Job ${job.id} completed successfully`);
        } catch (error: any) {
          console.error(`❌ Job ${job.id} failed:`, error);
          await this.handleJobFailure(job.id, error);
        } finally {
          this.processing.delete(job.id);
        }
        
        return; // Successfully started a job
      } else {
        console.log(`⏱️ Tier ${user?.premiumTier || 'basic'} at capacity (${currentTierJobs}/${tierLimits.maxConcurrentJobs}). Checking next job...`);
        // Continue to next job in queue instead of blocking
      }
    }

    // If we get here, all tiers are at capacity
    console.log(`⏸️ All tiers at capacity. Waiting for jobs to complete...`);
  }

  private getTierLimits(premiumTier: string | null) {
    switch (premiumTier) {
      case 'professional':
        return { maxConcurrentJobs: 10 };
      case 'advanced':
        return { maxConcurrentJobs: 5 };
      default: // basic
        return { maxConcurrentJobs: 2 };
    }
  }

  private async countJobsForTier(premiumTier: string | null): Promise<number> {
    // Count running jobs for users with this premium tier
    let count = 0;
    for (const jobId of this.processing) {
      const job = await storage.getBackgroundJob(jobId);
      if (job) {
        const user = await storage.getUser(job.userId);
        if ((user?.premiumTier || null) === premiumTier) {
          count++;
        }
      }
    }
    return count;
  }

  private async executeJob(job: BackgroundJob, premiumTier?: string | null) {
    console.log(`🚀 Executing job ${job.id} (${job.jobType}) - Using AWS services`);
    
    await storage.updateJobStatus(job.id, 'running', { 
      startedAt: new Date(),
      progressPercentage: 0
    });

    // Use passed premium tier for resource allocation
    const tierForJob = premiumTier !== undefined ? premiumTier : (await storage.getUser(job.userId))?.premiumTier;

    let awsJobId: string;
    let awsJobType: string;

    try {
      // Dispatch to real AWS services based on job type
      switch (job.jobType) {
        case 'market_data_analysis':
          awsJobId = await awsJobExecutor.executeMarketDataAnalysis(job.id, job.jobParams, tierForJob);
          awsJobType = 'sagemaker';
          break;
        case 'portfolio_optimization':
          awsJobId = await awsJobExecutor.executePortfolioOptimization(job.id, job.jobParams, tierForJob);
          awsJobType = 'batch';
          break;
        case 'financial_forecasting':
          awsJobId = await awsJobExecutor.executeFinancialForecasting(job.id, job.jobParams, tierForJob);
          awsJobType = 'lambda';
          break;
        case 'risk_assessment':
          awsJobId = await awsJobExecutor.executePortfolioOptimization(job.id, job.jobParams, tierForJob); // Use batch for risk assessment
          awsJobType = 'batch';
          break;
        case 'batch_data_processing':
          awsJobId = await awsJobExecutor.executePortfolioOptimization(job.id, job.jobParams, tierForJob); // Use batch for data processing
          awsJobType = 'batch';
          break;
        case 'automated_reporting':
          awsJobId = await awsJobExecutor.executeFinancialForecasting(job.id, job.jobParams, tierForJob); // Use lambda for reporting
          awsJobType = 'lambda';
          break;
        case 'anomaly_detection':
          awsJobId = await awsJobExecutor.executeMarketDataAnalysis(job.id, job.jobParams, tierForJob); // Use SageMaker for ML tasks
          awsJobType = 'sagemaker';
          break;
        case 'sentiment_analysis':
          awsJobId = await awsJobExecutor.executeMarketDataAnalysis(job.id, job.jobParams, tierForJob); // Use SageMaker for ML tasks
          awsJobType = 'sagemaker';
          break;
        case 'correlation_analysis':
          awsJobId = await awsJobExecutor.executeMarketDataAnalysis(job.id, job.jobParams, tierForJob); // Use SageMaker for ML tasks
          awsJobType = 'sagemaker';
          break;
        case 'backtesting':
          awsJobId = await awsJobExecutor.executePortfolioOptimization(job.id, job.jobParams, tierForJob); // Use batch for compute-intensive backtesting
          awsJobType = 'batch';
          break;
        default:
          throw new Error(`AWS integration not implemented for job type: ${job.jobType}`);
      }

      // Store AWS job ID and type for status tracking
      await storage.updateJob(job.id, { 
        awsJobId,
        awsJobType,
        awsRegion: process.env.AWS_REGION || 'us-east-1'
      });

      console.log(`✅ AWS job ${awsJobId} (${awsJobType}) started for ${job.jobType}`);

      // Start status polling for AWS job
      this.pollAWSJobStatus(job.id, awsJobId, job.jobType);

    } catch (error: any) {
      console.error(`❌ Failed to start AWS job for ${job.id}:`, error);
      throw error;
    }
  }

  private async handleJobFailure(jobId: string, error: any) {
    const job = await storage.getBackgroundJob(jobId);
    if (!job) return;

    const errorMessage = error.message || 'Unknown error occurred';
    const retryCount = (job.retryCount || 0) + 1;

    if (retryCount < (job.maxRetries || 3)) {
      // Retry the job
      console.log(`🔄 Retrying job ${jobId} (attempt ${retryCount})`);
      await storage.updateJobStatus(jobId, 'queued', {
        retryCount,
        errorMessage: `Retry ${retryCount}: ${errorMessage}`,
      });
    } else {
      // Mark as failed
      console.log(`💀 Job ${jobId} failed permanently after ${retryCount} attempts`);
      await storage.updateJobStatus(jobId, 'failed', {
        failedAt: new Date(),
        retryCount,
        errorMessage: `Failed after ${retryCount} attempts: ${errorMessage}`,
      });
    }
  }

  private async updateJobProgress(jobId: string, progress: number) {
    await storage.updateJobProgress(jobId, progress);
    console.log(`📊 Job ${jobId} progress: ${progress}%`);
  }

  private async pollAWSJobStatus(jobId: string, awsJobId: string, jobType: string) {
    console.log(`🔄 Starting AWS job status polling for ${jobId} (${awsJobId})`);
    
    const pollInterval = setInterval(async () => {
      try {
        const status = await awsJobExecutor.checkJobStatus(awsJobId, jobType, jobId); // Pass jobId
        
        // Update progress
        await storage.updateJobProgress(jobId, status.progress || 0);
        console.log(`📊 AWS Job ${awsJobId} progress: ${status.progress}%`);

        if (status.status === 'Completed') {
          clearInterval(pollInterval);
          console.log(`✅ AWS job ${awsJobId} completed successfully`);
          
          try {
            // Download results from AWS
            const resultUrls = await awsJobExecutor.downloadResults(awsJobId, jobType, jobId);
            
            await storage.updateJobStatus(jobId, 'completed', {
              completedAt: new Date(),
              progressPercentage: 100,
              outputFileUrls: resultUrls
            });
            
            console.log(`📥 Downloaded ${resultUrls.length} result files for job ${jobId}`);
          } catch (downloadError) {
            console.error(`❌ Failed to download results for ${jobId}:`, downloadError);
            // Still mark as completed but without results
            await storage.updateJobStatus(jobId, 'completed', {
              completedAt: new Date(),
              progressPercentage: 100,
              errorMessage: `Completed but failed to download results: ${(downloadError as Error).message}`
            });
          }
          
        } else if (status.status === 'Failed') {
          clearInterval(pollInterval);
          console.log(`❌ AWS job ${awsJobId} failed: ${status.error}`);
          
          await storage.updateJobStatus(jobId, 'failed', {
            failedAt: new Date(),
            errorMessage: status.error || 'AWS job failed'
          });
        }
        // For 'InProgress' or 'Starting', continue polling
        
      } catch (error) {
        console.error(`❌ Error polling AWS job status for ${awsJobId}:`, error);
        // Continue polling - don't fail the job on a single polling error
      }
    }, 30000); // Poll every 30 seconds
  }

  // ===========================================
  // JOB-SPECIFIC PROCESSORS
  // ===========================================

  private async processMarketDataAnalysis(job: BackgroundJob) {
    const params = job.jobParams as any;
    console.log(`📈 Processing market data analysis for symbols:`, params.symbols);
    
    await this.updateJobProgress(job.id, 10);
    
    // Simulate technical indicator calculations
    await this.delay(2000);
    await this.updateJobProgress(job.id, 25);
    
    // Simulate trend analysis
    await this.delay(2000);
    await this.updateJobProgress(job.id, 50);
    
    // Simulate volume analysis
    await this.delay(2000);
    await this.updateJobProgress(job.id, 75);
    
    // Simulate price pattern recognition
    await this.delay(2000);
    await this.updateJobProgress(job.id, 90);
    
    // Generate results
    const results = {
      analysis_type: 'market_data_analysis',
      symbols: params.symbols || ['AAPL', 'GOOGL'],
      period: params.period || '1y',
      technical_indicators: {
        rsi: { AAPL: 65.4, GOOGL: 58.2 },
        macd: { AAPL: 1.23, GOOGL: -0.45 },
        bollinger_bands: { AAPL: 'overbought', GOOGL: 'neutral' }
      },
      trend_analysis: {
        overall_trend: 'bullish',
        support_levels: { AAPL: 180.50, GOOGL: 2650.00 },
        resistance_levels: { AAPL: 195.20, GOOGL: 2780.00 }
      },
      volume_analysis: {
        volume_trend: 'increasing',
        unusual_volume_detected: false
      },
      recommendations: [
        'AAPL showing strong upward momentum - consider long position',
        'GOOGL consolidating - wait for breakout confirmation'
      ],
      charts_generated: ['technical_chart.png', 'volume_chart.png'],
      generated_at: new Date().toISOString()
    };
    
    await storage.updateJobResults(job.id, results);
  }

  private async processPortfolioOptimization(job: BackgroundJob) {
    const params = job.jobParams as any;
    console.log(`📊 Processing portfolio optimization for ${params.portfolioSize || 10} assets`);
    
    await this.updateJobProgress(job.id, 20);
    await this.delay(3000);
    
    await this.updateJobProgress(job.id, 50);
    await this.delay(3000);
    
    await this.updateJobProgress(job.id, 80);
    await this.delay(2000);
    
    const results = {
      analysis_type: 'portfolio_optimization',
      optimization_method: 'modern_portfolio_theory',
      target_return: params.targetReturn || 0.12,
      risk_tolerance: params.riskTolerance || 'moderate',
      optimized_allocation: {
        'AAPL': 0.25,
        'GOOGL': 0.20,
        'MSFT': 0.15,
        'TSLA': 0.10,
        'SPY': 0.30
      },
      expected_return: 0.118,
      expected_volatility: 0.165,
      sharpe_ratio: 0.715,
      rebalancing_recommendations: [
        'Reduce TSLA allocation by 5%',
        'Increase SPY allocation by 3%',
        'Consider adding bonds for diversification'
      ],
      risk_metrics: {
        var_95: -0.08,
        max_drawdown: -0.15,
        beta: 1.02
      },
      generated_at: new Date().toISOString()
    };
    
    await storage.updateJobResults(job.id, results);
  }

  private async processRiskAssessment(job: BackgroundJob) {
    const params = job.jobParams as any;
    console.log(`⚠️ Processing risk assessment (complexity: ${params.complexity})`);
    
    await this.updateJobProgress(job.id, 25);
    await this.delay(3000);
    
    await this.updateJobProgress(job.id, 60);
    await this.delay(4000);
    
    await this.updateJobProgress(job.id, 85);
    await this.delay(2000);
    
    const results = {
      analysis_type: 'risk_assessment',
      portfolio_value: params.portfolioValue || 1000000,
      risk_level: 'moderate',
      var_analysis: {
        var_1day_95: -25000,
        var_1day_99: -45000,
        var_1week_95: -55000
      },
      stress_testing: {
        market_crash_scenario: -0.35,
        interest_rate_shock: -0.18,
        sector_concentration_risk: 'high'
      },
      correlation_analysis: {
        portfolio_correlation: 0.72,
        diversification_ratio: 0.68,
        concentration_risk: 'moderate'
      },
      risk_recommendations: [
        'Reduce correlation by adding international exposure',
        'Consider hedging with defensive assets',
        'Implement stop-loss orders for volatile positions'
      ],
      generated_at: new Date().toISOString()
    };
    
    await storage.updateJobResults(job.id, results);
  }

  private async processFinancialForecasting(job: BackgroundJob) {
    const params = job.jobParams as any;
    console.log(`🔮 Processing financial forecasting (period: ${params.period})`);
    
    await this.updateJobProgress(job.id, 30);
    await this.delay(4000);
    
    await this.updateJobProgress(job.id, 70);
    await this.delay(5000);
    
    const results = {
      analysis_type: 'financial_forecasting',
      forecast_period: params.period || '1y',
      model_type: 'ml_ensemble',
      predictions: {
        'AAPL': { price_target: 210.50, confidence: 0.78, direction: 'bullish' },
        'GOOGL': { price_target: 2850.00, confidence: 0.82, direction: 'bullish' },
        'SPY': { price_target: 485.00, confidence: 0.75, direction: 'neutral' }
      },
      market_outlook: {
        overall_sentiment: 'cautiously optimistic',
        key_drivers: ['AI adoption', 'interest rates', 'geopolitical tensions'],
        risk_factors: ['inflation', 'regulatory changes']
      },
      scenarios: {
        bull_case: { probability: 0.35, return_expectation: 0.25 },
        base_case: { probability: 0.45, return_expectation: 0.12 },
        bear_case: { probability: 0.20, return_expectation: -0.08 }
      },
      generated_at: new Date().toISOString()
    };
    
    await storage.updateJobResults(job.id, results);
  }

  private async processBatchData(job: BackgroundJob) {
    const params = job.jobParams as any;
    console.log(`🔄 Processing batch data (${params.dataSize || 1000} records)`);
    
    await this.updateJobProgress(job.id, 20);
    await this.delay(3000);
    
    await this.updateJobProgress(job.id, 60);
    await this.delay(4000);
    
    await this.updateJobProgress(job.id, 90);
    await this.delay(2000);
    
    const results = {
      analysis_type: 'batch_data_processing',
      records_processed: params.dataSize || 1000,
      processing_time: '3.2 minutes',
      data_quality: {
        completeness: 0.95,
        accuracy: 0.92,
        consistency: 0.88
      },
      summary_statistics: {
        total_records: params.dataSize || 1000,
        valid_records: Math.floor((params.dataSize || 1000) * 0.95),
        invalid_records: Math.floor((params.dataSize || 1000) * 0.05),
        duplicate_records: Math.floor((params.dataSize || 1000) * 0.02)
      },
      output_files: ['processed_data.csv', 'data_quality_report.pdf'],
      generated_at: new Date().toISOString()
    };
    
    await storage.updateJobResults(job.id, results);
  }

  private async processAutomatedReporting(job: BackgroundJob) {
    const params = job.jobParams as any;
    console.log(`📄 Processing automated reporting (type: ${params.reportType})`);
    
    await this.updateJobProgress(job.id, 25);
    await this.delay(3000);
    
    await this.updateJobProgress(job.id, 65);
    await this.delay(4000);
    
    await this.updateJobProgress(job.id, 90);
    await this.delay(2000);
    
    const results = {
      analysis_type: 'automated_reporting',
      report_type: params.reportType || 'monthly_summary',
      report_period: params.period || 'last_month',
      sections_generated: [
        'Executive Summary',
        'Portfolio Performance',
        'Risk Analysis',
        'Market Outlook',
        'Recommendations'
      ],
      key_metrics: {
        total_return: 0.085,
        risk_adjusted_return: 0.12,
        max_drawdown: -0.06,
        volatility: 0.15
      },
      output_formats: ['PDF', 'Excel', 'PowerPoint'],
      generated_files: [
        'monthly_report.pdf',
        'performance_dashboard.xlsx',
        'executive_presentation.pptx'
      ],
      generated_at: new Date().toISOString()
    };
    
    await storage.updateJobResults(job.id, results);
  }

  private async processAnomalyDetection(job: BackgroundJob) {
    const params = job.jobParams as any;
    console.log(`🔍 Processing anomaly detection (${params.dataPoints || 10000} data points)`);
    
    await this.updateJobProgress(job.id, 30);
    await this.delay(4000);
    
    await this.updateJobProgress(job.id, 70);
    await this.delay(5000);
    
    const results = {
      analysis_type: 'anomaly_detection',
      model_type: 'isolation_forest',
      data_points_analyzed: params.dataPoints || 10000,
      anomalies_detected: 45,
      anomaly_types: {
        price_spikes: 12,
        volume_anomalies: 18,
        correlation_breaks: 8,
        pattern_deviations: 7
      },
      severity_distribution: {
        high: 8,
        medium: 15,
        low: 22
      },
      notable_anomalies: [
        { timestamp: '2024-01-15T10:30:00Z', type: 'price_spike', severity: 'high', symbol: 'AAPL' },
        { timestamp: '2024-01-20T14:15:00Z', type: 'volume_surge', severity: 'medium', symbol: 'TSLA' }
      ],
      model_performance: {
        precision: 0.87,
        recall: 0.92,
        f1_score: 0.89
      },
      generated_at: new Date().toISOString()
    };
    
    await storage.updateJobResults(job.id, results);
  }

  private async processSentimentAnalysis(job: BackgroundJob) {
    const params = job.jobParams as any;
    console.log(`💭 Processing sentiment analysis (${params.articles?.length || 100} articles)`);
    
    await this.updateJobProgress(job.id, 25);
    await this.delay(3000);
    
    await this.updateJobProgress(job.id, 60);
    await this.delay(4000);
    
    await this.updateJobProgress(job.id, 85);
    await this.delay(2000);
    
    const results = {
      analysis_type: 'sentiment_analysis',
      articles_analyzed: params.articles?.length || 100,
      time_period: params.period || 'last_7_days',
      overall_sentiment: {
        score: 0.65,
        classification: 'positive',
        confidence: 0.82
      },
      sentiment_by_symbol: {
        'AAPL': { score: 0.72, classification: 'positive' },
        'GOOGL': { score: 0.58, classification: 'neutral' },
        'TSLA': { score: 0.45, classification: 'neutral' }
      },
      trending_topics: [
        'AI innovation',
        'quarterly earnings',
        'market volatility'
      ],
      sentiment_trend: 'improving',
      sources_analyzed: ['Reuters', 'Bloomberg', 'Financial Times', 'MarketWatch'],
      generated_at: new Date().toISOString()
    };
    
    await storage.updateJobResults(job.id, results);
  }

  private async processCorrelationAnalysis(job: BackgroundJob) {
    const params = job.jobParams as any;
    console.log(`🔗 Processing correlation analysis (${params.assets?.length || 10} assets)`);
    
    await this.updateJobProgress(job.id, 35);
    await this.delay(3000);
    
    await this.updateJobProgress(job.id, 75);
    await this.delay(4000);
    
    const results = {
      analysis_type: 'correlation_analysis',
      assets_analyzed: params.assets || ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'SPY'],
      analysis_period: params.period || '1y',
      correlation_matrix: {
        'AAPL-GOOGL': 0.72,
        'AAPL-MSFT': 0.68,
        'AAPL-TSLA': 0.45,
        'GOOGL-MSFT': 0.75,
        'GOOGL-TSLA': 0.38,
        'MSFT-TSLA': 0.42
      },
      highest_correlations: [
        { pair: 'GOOGL-MSFT', correlation: 0.75 },
        { pair: 'AAPL-GOOGL', correlation: 0.72 },
        { pair: 'AAPL-MSFT', correlation: 0.68 }
      ],
      diversification_opportunities: [
        'Add international exposure',
        'Include commodities',
        'Consider real estate REITs'
      ],
      risk_insights: {
        portfolio_correlation: 0.65,
        concentration_risk: 'moderate',
        diversification_ratio: 0.68
      },
      generated_at: new Date().toISOString()
    };
    
    await storage.updateJobResults(job.id, results);
  }

  private async processBacktesting(job: BackgroundJob) {
    const params = job.jobParams as any;
    console.log(`⏮️ Processing backtesting (${params.strategies?.length || 3} strategies)`);
    
    await this.updateJobProgress(job.id, 20);
    await this.delay(4000);
    
    await this.updateJobProgress(job.id, 50);
    await this.delay(5000);
    
    await this.updateJobProgress(job.id, 80);
    await this.delay(3000);
    
    const results = {
      analysis_type: 'backtesting',
      strategies_tested: params.strategies || ['momentum', 'mean_reversion', 'breakout'],
      backtest_period: params.period || '5y',
      benchmark: 'SPY',
      strategy_performance: {
        momentum: {
          total_return: 0.145,
          annual_return: 0.028,
          sharpe_ratio: 1.24,
          max_drawdown: -0.12,
          win_rate: 0.58
        },
        mean_reversion: {
          total_return: 0.087,
          annual_return: 0.017,
          sharpe_ratio: 0.89,
          max_drawdown: -0.08,
          win_rate: 0.62
        },
        breakout: {
          total_return: 0.198,
          annual_return: 0.038,
          sharpe_ratio: 1.45,
          max_drawdown: -0.18,
          win_rate: 0.54
        }
      },
      best_strategy: 'breakout',
      benchmark_performance: {
        total_return: 0.124,
        annual_return: 0.024,
        sharpe_ratio: 1.12
      },
      recommendations: [
        'Breakout strategy shows strongest risk-adjusted returns',
        'Consider combining momentum and mean reversion for stability',
        'Monitor drawdown periods carefully'
      ],
      generated_at: new Date().toISOString()
    };
    
    await storage.updateJobResults(job.id, results);
  }

  // Utility method for simulating processing delays
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Method to gracefully shutdown the job processor
  public shutdown() {
    console.log('🛑 Shutting down job processor');
    if (this.jobProcessorInterval) {
      clearInterval(this.jobProcessorInterval);
      this.jobProcessorInterval = null;
    }
  }
}

export const jobProcessor = new JobProcessor();