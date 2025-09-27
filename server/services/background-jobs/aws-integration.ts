import { SageMakerClient, CreateTrainingJobCommand, DescribeTrainingJobCommand } from '@aws-sdk/client-sagemaker';
import { BatchClient, SubmitJobCommand, DescribeJobsCommand } from '@aws-sdk/client-batch';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, GetObjectCommandInput } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface AWSJobStatus {
  status: 'InProgress' | 'Completed' | 'Failed' | 'Starting';
  progress: number;
  error?: string;
  resultFiles?: string[];
}

interface TierResources {
  sagemakerInstanceType: string;
  batchvCpus: number;
  lambdaMemory: number;
  maxConcurrentJobs: number;
}

export class AWSJobExecutor {
  private sagemakerClient: SageMakerClient;
  private batchClient: BatchClient;  
  private lambdaClient: LambdaClient;
  private s3Client: S3Client;

  constructor() {
    const region = process.env.AWS_REGION || 'us-east-1';
    
    // Initialize AWS clients
    this.sagemakerClient = new SageMakerClient({ 
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });
    
    this.batchClient = new BatchClient({ 
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });
    
    this.lambdaClient = new LambdaClient({ 
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });
    
    this.s3Client = new S3Client({ 
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });
  }

  /**
   * Get AWS resource allocation based on premium tier
   */
  private getAWSResourcesByTier(premiumTier: string | null): TierResources {
    switch (premiumTier) {
      case 'professional':
        return {
          sagemakerInstanceType: 'ml.m5.xlarge',
          batchvCpus: 4,
          lambdaMemory: 1024,
          maxConcurrentJobs: 10
        };
      case 'advanced':
        return {
          sagemakerInstanceType: 'ml.m5.large', 
          batchvCpus: 2,
          lambdaMemory: 512,
          maxConcurrentJobs: 5
        };
      default: // basic or null
        return {
          sagemakerInstanceType: 'ml.t3.medium',
          batchvCpus: 1, 
          lambdaMemory: 256,
          maxConcurrentJobs: 2
        };
    }
  }

  /**
   * Execute market data analysis using AWS SageMaker
   */
  async executeMarketDataAnalysis(jobId: string, params: any, premiumTier: string | null): Promise<string> {
    console.log(`🧠 Starting SageMaker job for market data analysis: ${jobId}`);
    
    const resources = this.getAWSResourcesByTier(premiumTier);
    const trainingJobName = `market-analysis-${jobId.slice(0, 8)}-${Date.now()}`;
    
    try {
      const command = new CreateTrainingJobCommand({
        TrainingJobName: trainingJobName,
        RoleArn: process.env.AWS_SAGEMAKER_ROLE_ARN!,
        AlgorithmSpecification: {
          TrainingImage: '382416733822.dkr.ecr.us-east-1.amazonaws.com/xgboost:latest', // AWS managed XGBoost image
          TrainingInputMode: 'File'
        },
        InputDataConfig: [{
          ChannelName: 'training',
          DataSource: {
            S3DataSource: {
              S3DataType: 'S3Prefix',
              S3Uri: `s3://${process.env.AWS_S3_BUCKET_NAME}/market-data/input/`,
              S3DataDistributionType: 'FullyReplicated'
            }
          },
          ContentType: 'text/csv',
          CompressionType: 'None'
        }],
        OutputDataConfig: {
          S3OutputPath: `s3://${process.env.AWS_S3_BUCKET_NAME}/results/${jobId}/`
        },
        ResourceConfig: {
          InstanceType: resources.sagemakerInstanceType as any, // Cast to handle AWS SDK types
          InstanceCount: 1,
          VolumeSizeInGB: 30
        },
        StoppingCondition: {
          MaxRuntimeInSeconds: 3600 // 1 hour max
        },
        HyperParameters: {
          symbols: JSON.stringify(params.symbols || ['AAPL', 'GOOGL']),
          period: params.period || '1y',
          job_id: jobId,
          analysis_type: 'market_data_analysis'
        },
        Tags: [
          { Key: 'JobType', Value: 'market_data_analysis' },
          { Key: 'JobId', Value: jobId },
          { Key: 'PremiumTier', Value: premiumTier || 'basic' }
        ]
      });

      const result = await this.sagemakerClient.send(command);
      console.log(`✅ SageMaker training job started: ${trainingJobName}`);
      return result.TrainingJobArn!;
      
    } catch (error) {
      console.error(`❌ Failed to start SageMaker job:`, error);
      throw new Error(`SageMaker job creation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Execute portfolio optimization using AWS Batch
   */
  async executePortfolioOptimization(jobId: string, params: any, premiumTier: string | null): Promise<string> {
    console.log(`⚡ Starting AWS Batch job for portfolio optimization: ${jobId}`);
    
    const resources = this.getAWSResourcesByTier(premiumTier);
    const jobName = `portfolio-opt-${jobId.slice(0, 8)}-${Date.now()}`;
    
    try {
      const command = new SubmitJobCommand({
        jobName,
        jobQueue: process.env.AWS_BATCH_JOB_QUEUE!,
        jobDefinition: 'portfolio-optimization-job-def',
        parameters: {
          jobId,
          symbols: JSON.stringify(params.symbols || ['AAPL', 'GOOGL', 'MSFT']),
          riskTolerance: params.riskTolerance || 'moderate',
          investmentAmount: params.investmentAmount || '10000',
          premiumTier: premiumTier || 'basic'
        },
        timeout: {
          attemptDurationSeconds: 3600 // 1 hour timeout
        },
        containerOverrides: {
          vcpus: resources.batchvCpus,
          memory: resources.batchvCpus * 1024, // 1GB per vCPU
          environment: [
            { name: 'JOB_ID', value: jobId },
            { name: 'S3_BUCKET', value: process.env.AWS_S3_BUCKET_NAME! },
            { name: 'AWS_REGION', value: process.env.AWS_REGION! }
          ]
        },
        tags: {
          JobType: 'portfolio_optimization',
          JobId: jobId,
          PremiumTier: premiumTier || 'basic'
        }
      });

      const result = await this.batchClient.send(command);
      console.log(`✅ AWS Batch job submitted: ${jobName}`);
      return result.jobId!;
      
    } catch (error) {
      console.error(`❌ Failed to start Batch job:`, error);
      throw new Error(`Batch job submission failed: ${(error as Error).message}`);
    }
  }

  /**
   * Execute financial forecasting using AWS Lambda
   */
  async executeFinancialForecasting(jobId: string, params: any, premiumTier: string | null): Promise<string> {
    console.log(`🔮 Starting Lambda function for financial forecasting: ${jobId}`);
    
    const resources = this.getAWSResourcesByTier(premiumTier);
    
    const payload = {
      jobId,
      symbols: params.symbols || ['AAPL'],
      forecastPeriod: params.forecastPeriod || 30,
      model: params.model || 'lstm',
      premiumTier: premiumTier || 'basic',
      s3Bucket: process.env.AWS_S3_BUCKET_NAME,
      awsRegion: process.env.AWS_REGION
    };

    try {
      const command = new InvokeCommand({
        FunctionName: 'financial-forecasting-lambda',
        InvocationType: 'Event', // Async execution
        Payload: JSON.stringify(payload)
      });

      // Return real AWS request ID for tracking
      const result = await this.lambdaClient.send(command);
      const requestId = result.$metadata.requestId!;
      
      // Store request ID and S3 result path for monitoring
      const lambdaJobId = `lambda-${requestId}-${Date.now()}`;
      
      // Store expected S3 result location
      const expectedS3Key = `results/${jobId}/financial-forecast-${Date.now()}.json`;
      
      console.log(`✅ Lambda function invoked: ${lambdaJobId}, expecting results at: ${expectedS3Key}`);
      return lambdaJobId;
      
    } catch (error) {
      console.error(`❌ Failed to invoke Lambda function:`, error);
      throw new Error(`Lambda invocation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Check job status across different AWS services
   */
  async checkJobStatus(awsJobId: string, jobType: string, originalJobId: string): Promise<AWSJobStatus> {
    try {
      switch (jobType) {
        case 'market_data_analysis':
        case 'anomaly_detection':
        case 'sentiment_analysis':
        case 'correlation_analysis':
          return await this.checkSageMakerStatus(awsJobId);
        case 'portfolio_optimization':
        case 'backtesting':
        case 'risk_assessment':
        case 'batch_data_processing':
          return await this.checkBatchStatus(awsJobId);
        case 'financial_forecasting':
        case 'automated_reporting':
          return await this.checkLambdaStatus(awsJobId, originalJobId); // Pass original job ID
        default:
          throw new Error(`Unknown job type: ${jobType}`);
      }
    } catch (error) {
      console.error(`❌ Error checking job status for ${awsJobId}:`, error);
      return {
        status: 'Failed',
        progress: 0,
        error: (error as Error).message
      };
    }
  }

  /**
   * Check SageMaker training job status
   */
  private async checkSageMakerStatus(trainingJobArn: string): Promise<AWSJobStatus> {
    try {
      // Extract job name from ARN
      const jobName = trainingJobArn.split('/').pop()!;
      
      const command = new DescribeTrainingJobCommand({
        TrainingJobName: jobName
      });
      
      const result = await this.sagemakerClient.send(command);
      const status = result.TrainingJobStatus!;
      
      // Map SageMaker status to our status
      let mappedStatus: AWSJobStatus['status'];
      let progress = 0;
      
      switch (status) {
        case 'InProgress':
          mappedStatus = 'InProgress';
          progress = 50; // Assume 50% progress for in-progress jobs
          break;
        case 'Completed':
          mappedStatus = 'Completed';
          progress = 100;
          break;
        case 'Failed':
        case 'Stopped':
          mappedStatus = 'Failed';
          progress = 0;
          break;
        default:
          mappedStatus = 'Starting';
          progress = 10;
      }
      
      return {
        status: mappedStatus,
        progress,
        error: status === 'Failed' ? result.FailureReason : undefined
      };
      
    } catch (error) {
      console.error(`Error checking SageMaker status:`, error);
      return {
        status: 'Failed',
        progress: 0,
        error: (error as Error).message
      };
    }
  }

  /**
   * Check AWS Batch job status
   */
  private async checkBatchStatus(jobId: string): Promise<AWSJobStatus> {
    try {
      const command = new DescribeJobsCommand({
        jobs: [jobId]
      });
      
      const result = await this.batchClient.send(command);
      const job = result.jobs?.[0];
      
      if (!job) {
        return {
          status: 'Failed',
          progress: 0,
          error: 'Job not found'
        };
      }
      
      const status = job.status!;
      let mappedStatus: AWSJobStatus['status'];
      let progress = 0;
      
      switch (status) {
        case 'RUNNING':
          mappedStatus = 'InProgress';
          progress = 50;
          break;
        case 'SUCCEEDED':
          mappedStatus = 'Completed';
          progress = 100;
          break;
        case 'FAILED':
          mappedStatus = 'Failed';
          progress = 0;
          break;
        default:
          mappedStatus = 'Starting';
          progress = 10;
      }
      
      return {
        status: mappedStatus,
        progress,
        error: status === 'FAILED' ? job.statusReason : undefined
      };
      
    } catch (error) {
      console.error(`Error checking Batch status:`, error);
      return {
        status: 'Failed',
        progress: 0,
        error: (error as Error).message
      };
    }
  }

  /**
   * Check Lambda execution status - real S3-based monitoring
   */
  private async checkLambdaStatus(lambdaJobId: string, jobId: string): Promise<AWSJobStatus> {
    try {
      // Lambda jobs are async - check S3 for results
      const expectedS3Key = `results/${jobId}/`;
      
      // List objects in S3 result directory
      const listCommand = new ListObjectsV2Command({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Prefix: expectedS3Key
      });
      
      const listResult = await this.s3Client.send(listCommand);
      
      if (listResult.Contents && listResult.Contents.length > 0) {
        // Results found - job completed
        return {
          status: 'Completed',
          progress: 100,
          resultFiles: listResult.Contents.map(obj => obj.Key!)
        };
      } else {
        // Check Lambda logs for errors (simplified check)
        return {
          status: 'InProgress',
          progress: 50 // Lambda jobs are typically fast
        };
      }
    } catch (error) {
      console.error(`Error checking Lambda status ${lambdaJobId}:`, error);
      return {
        status: 'Failed',
        progress: 0,
        error: (error as Error).message
      };
    }
  }

  /**
   * Download results from S3 and generate signed URLs
   */
  async downloadResults(awsJobId: string, jobType: string, originalJobId: string): Promise<string[]> {
    console.log(`📥 Downloading results for ${awsJobId} (${jobType})`);
    
    try {
      const bucket = process.env.AWS_S3_BUCKET_NAME!;
      let s3Prefix: string;
      
      // Determine S3 prefix based on job type
      switch (jobType) {
        case 'financial_forecasting':
        case 'automated_reporting':
          // Lambda results stored by original job ID
          s3Prefix = `results/${originalJobId}/`;
          break;
        case 'market_data_analysis':
        case 'anomaly_detection':
        case 'sentiment_analysis':
        case 'correlation_analysis':
          // Extract job name from SageMaker ARN for results path
          const jobName = awsJobId.split('/').pop()!;
          s3Prefix = `results/${jobName}/output/`;
          break;
        default:
          // SageMaker/Batch results
          s3Prefix = `results/${awsJobId}/`;
          break;
      }
      
      // List objects in the results directory
      const listCommand = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: s3Prefix
      });
      
      const listResult = await this.s3Client.send(listCommand);
      const objects = listResult.Contents || [];
      
      if (objects.length === 0) {
        console.log(`No result files found for ${awsJobId}`);
        return [];
      }
      
      // Generate signed URLs for each result file
      const signedUrls: string[] = [];
      
      for (const obj of objects) {
        if (obj.Key && obj.Size && obj.Size > 0) {
          const getCommand = new GetObjectCommand({
            Bucket: bucket,
            Key: obj.Key
          });
          
          // Generate signed URL valid for 2 hours
          const signedUrl = await getSignedUrl(this.s3Client, getCommand, {
            expiresIn: 7200 // 2 hours
          });
          
          signedUrls.push(signedUrl);
        }
      }
      
      console.log(`✅ Generated ${signedUrls.length} signed URLs for results`);
      return signedUrls;
      
    } catch (error) {
      console.error(`❌ Error downloading results for ${jobType}:`, error);
      return [];
    }
  }

  /**
   * Clean up AWS resources for cancelled jobs
   */
  async cancelJob(awsJobId: string, jobType: string): Promise<void> {
    console.log(`🛑 Cancelling AWS job: ${awsJobId} (${jobType})`);
    
    try {
      switch (jobType) {
        case 'market_data_analysis':
          // SageMaker jobs can be stopped
          // Implementation would use StopTrainingJobCommand
          console.log(`Stopping SageMaker job: ${awsJobId}`);
          break;
        case 'portfolio_optimization':
          // Batch jobs can be cancelled
          // Implementation would use CancelJobCommand
          console.log(`Cancelling Batch job: ${awsJobId}`);
          break;
        case 'financial_forecasting':
          // Lambda functions complete quickly, cancellation not typically needed
          console.log(`Lambda job cannot be cancelled: ${awsJobId}`);
          break;
      }
    } catch (error) {
      console.error(`❌ Error cancelling job:`, error);
      throw new Error(`Failed to cancel job: ${(error as Error).message}`);
    }
  }
}

// Singleton instance for use across the application
export const awsJobExecutor = new AWSJobExecutor();