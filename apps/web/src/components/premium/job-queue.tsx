import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Play, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Download, 
  RefreshCw,
  TrendingUp,
  BarChart3,
  Shield,
  Brain,
  Database,
  FileText,
  Search,
  GitBranch,
  ArrowLeft
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { BackgroundJob } from '@shared/schema';

interface JobQueueProps {
  userId: string;
}

export default function JobQueue({ userId }: JobQueueProps) {
  const [selectedJobType, setSelectedJobType] = useState('');
  const [jobParams, setJobParams] = useState('{}');
  const { toast } = useToast();

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['/api/premium/jobs'],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: { jobType: string; params: any }) => {
      const response = await apiRequest('POST', '/api/premium/jobs', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/premium/jobs'] });
      toast({
        title: 'Job Created',
        description: 'Your background job has been queued successfully.',
      });
      setJobParams('{}');
      setSelectedJobType('');
    },
    onError: (error: any) => {
      toast({
        title: 'Job Creation Failed',
        description: error.message || 'Failed to create background job.',
        variant: 'destructive',
      });
    },
  });

  const cancelJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await apiRequest('DELETE', `/api/premium/jobs/${jobId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/premium/jobs'] });
      toast({
        title: 'Job Cancelled',
        description: 'Background job cancelled successfully.',
      });
    },
  });

  const handleCreateJob = () => {
    if (!selectedJobType) return;
    
    try {
      const params = JSON.parse(jobParams);
      createJobMutation.mutate({ jobType: selectedJobType, params });
    } catch (error) {
      toast({
        title: 'Invalid Parameters',
        description: 'Please provide valid JSON parameters.',
        variant: 'destructive',
      });
    }
  };

  const getJobTypeIcon = (jobType: string) => {
    switch (jobType) {
      case 'market_data_analysis': return <TrendingUp className="h-4 w-4" />;
      case 'portfolio_optimization': return <BarChart3 className="h-4 w-4" />;
      case 'risk_assessment': return <Shield className="h-4 w-4" />;
      case 'financial_forecasting': return <Brain className="h-4 w-4" />;
      case 'batch_data_processing': return <Database className="h-4 w-4" />;
      case 'automated_reporting': return <FileText className="h-4 w-4" />;
      case 'anomaly_detection': return <Search className="h-4 w-4" />;
      case 'sentiment_analysis': return <Brain className="h-4 w-4" />;
      case 'correlation_analysis': return <GitBranch className="h-4 w-4" />;
      case 'backtesting': return <ArrowLeft className="h-4 w-4" />;
      default: return <Play className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued': return <Clock className="h-4 w-4" />;
      case 'running': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'secondary';
      case 'running': return 'default';
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  const getJobTypeDisplayName = (jobType: string) => {
    const names = {
      market_data_analysis: 'Market Data Analysis',
      portfolio_optimization: 'Portfolio Optimization',
      risk_assessment: 'Risk Assessment',
      financial_forecasting: 'Financial Forecasting',
      batch_data_processing: 'Batch Data Processing',
      automated_reporting: 'Automated Reporting',
      anomaly_detection: 'Anomaly Detection',
      sentiment_analysis: 'Sentiment Analysis',
      correlation_analysis: 'Correlation Analysis',
      backtesting: 'Backtesting'
    };
    return names[jobType as keyof typeof names] || jobType;
  };

  const getJobTypeDescription = (jobType: string) => {
    const descriptions = {
      market_data_analysis: 'Advanced technical analysis and market insights',
      portfolio_optimization: 'AI-powered portfolio allocation suggestions',
      risk_assessment: 'Comprehensive risk analysis and VaR calculations',
      financial_forecasting: 'ML-based price predictions and market outlook',
      batch_data_processing: 'Large-scale data processing and transformation',
      automated_reporting: 'Generate detailed financial reports and presentations',
      anomaly_detection: 'Identify unusual patterns and market anomalies',
      sentiment_analysis: 'Analyze news sentiment impact on market movements',
      correlation_analysis: 'Cross-asset correlation and diversification insights',
      backtesting: 'Test trading strategies against historical data'
    };
    return descriptions[jobType as keyof typeof descriptions] || 'Advanced analytics processing';
  };

  const getParameterExamples = (jobType: string) => {
    const examples = {
      market_data_analysis: '{"symbols": ["AAPL", "GOOGL"], "period": "1y", "indicators": ["RSI", "MACD"]}',
      portfolio_optimization: '{"assets": ["AAPL", "GOOGL", "SPY"], "targetReturn": 0.12, "riskTolerance": "moderate"}',
      risk_assessment: '{"portfolio": ["AAPL", "TSLA"], "portfolioValue": 100000, "complexity": "advanced"}',
      financial_forecasting: '{"symbols": ["AAPL"], "period": "1y", "model": "ml_ensemble"}',
      batch_data_processing: '{"dataSource": "csv", "dataSize": 10000, "operations": ["clean", "transform"]}',
      automated_reporting: '{"reportType": "monthly_summary", "period": "last_month", "format": "PDF"}',
      anomaly_detection: '{"symbols": ["AAPL"], "dataPoints": 5000, "sensitivity": "high"}',
      sentiment_analysis: '{"symbols": ["AAPL"], "sources": ["news", "social"], "period": "7d"}',
      correlation_analysis: '{"assets": ["AAPL", "GOOGL", "MSFT"], "period": "1y", "method": "pearson"}',
      backtesting: '{"strategies": ["momentum", "mean_reversion"], "period": "5y", "capital": 100000}'
    };
    return examples[jobType as keyof typeof examples] || '{}';
  };

  const formatElapsedTime = (startedAt: string, completedAt?: string) => {
    const start = new Date(startedAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const diff = end.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Job Creation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Create Background Job
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Job Type</label>
              <Select value={selectedJobType} onValueChange={(value) => {
                setSelectedJobType(value);
                setJobParams(getParameterExamples(value));
              }}>
                <SelectTrigger data-testid="select-job-type">
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market_data_analysis">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Market Data Analysis</div>
                        <div className="text-xs text-muted-foreground">Advanced technical analysis</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="portfolio_optimization">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Portfolio Optimization</div>
                        <div className="text-xs text-muted-foreground">AI-powered allocation</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="risk_assessment">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Risk Assessment</div>
                        <div className="text-xs text-muted-foreground">VaR & stress testing</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="financial_forecasting">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Financial Forecasting</div>
                        <div className="text-xs text-muted-foreground">ML predictions</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="batch_data_processing">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Batch Data Processing</div>
                        <div className="text-xs text-muted-foreground">Large dataset processing</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="automated_reporting">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Automated Reporting</div>
                        <div className="text-xs text-muted-foreground">Generate reports</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="anomaly_detection">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Anomaly Detection</div>
                        <div className="text-xs text-muted-foreground">Pattern recognition</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="sentiment_analysis">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Sentiment Analysis</div>
                        <div className="text-xs text-muted-foreground">News sentiment impact</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="correlation_analysis">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Correlation Analysis</div>
                        <div className="text-xs text-muted-foreground">Asset relationships</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="backtesting">
                    <div className="flex items-center gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Backtesting</div>
                        <div className="text-xs text-muted-foreground">Strategy validation</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {selectedJobType && (
                <p className="text-sm text-muted-foreground mt-1">
                  {getJobTypeDescription(selectedJobType)}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Parameters (JSON)</label>
              <Textarea
                value={jobParams}
                onChange={(e) => setJobParams(e.target.value)}
                placeholder='{"symbols": ["AAPL", "GOOGL"], "period": "1y"}'
                className="font-mono text-sm"
                rows={4}
                data-testid="textarea-job-params"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Configure job-specific parameters in JSON format
              </p>
            </div>
          </div>
          
          <Button 
            onClick={handleCreateJob}
            disabled={!selectedJobType || createJobMutation.isPending}
            className="w-full"
            data-testid="button-create-job"
          >
            {createJobMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creating Job...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Create Background Job
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Job Queue List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Job Queue</span>
            {jobs && jobs.length > 0 && (
              <Badge variant="secondary">
                {jobs.length} job{jobs.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading jobs...</span>
            </div>
          ) : !jobs || jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No background jobs found</p>
              <p>Create your first job above to get started with advanced analytics.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job: BackgroundJob) => (
                <div 
                  key={job.id} 
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                  data-testid={`job-card-${job.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getJobTypeIcon(job.jobType)}
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {getJobTypeDisplayName(job.jobType)}
                          <Badge variant={getStatusColor(job.status) as any} className="text-xs">
                            {getStatusIcon(job.status)}
                            <span className="ml-1">{job.status}</span>
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ID: {job.id.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {job.status === 'completed' && job.resultData && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            // Show results in a modal or download
                            console.log('Job results:', job.resultData);
                            toast({
                              title: 'Job Results',
                              description: 'Results logged to console. Download feature coming soon!',
                            });
                          }}
                          data-testid={`button-download-${job.id}`}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          View Results
                        </Button>
                      )}
                      
                      {['queued', 'running'].includes(job.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelJobMutation.mutate(job.id)}
                          disabled={cancelJobMutation.isPending}
                          data-testid={`button-cancel-${job.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {job.status === 'running' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{job.progressPercentage || 0}%</span>
                      </div>
                      <Progress 
                        value={job.progressPercentage || 0} 
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  {job.errorMessage && (
                    <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded border border-red-200 dark:border-red-800">
                      <div className="font-medium mb-1">Error Details:</div>
                      {job.errorMessage}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="space-y-1">
                      <div>Created: {new Date(job.createdAt).toLocaleString()}</div>
                      {job.startedAt && (
                        <div>
                          {job.status === 'running' ? 'Running for: ' : 'Duration: '}
                          {formatElapsedTime(job.startedAt, job.completedAt || undefined)}
                        </div>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      {job.estimatedDuration && (
                        <div>Est: {job.estimatedDuration} min</div>
                      )}
                      {job.priority && job.priority !== 3 && (
                        <div>Priority: {job.priority}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}