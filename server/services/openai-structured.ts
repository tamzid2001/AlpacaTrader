import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { sendExcelReportInsights } from './email';

// Initialize OpenAI with error handling
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
    console.log('✅ OpenAI structured analysis service initialized');
  } else {
    console.warn('⚠️ OPENAI_API_KEY not found - structured analysis disabled');
  }
} catch (error) {
  console.error('❌ OpenAI initialization failed:', error);
}

// Excel Report Analysis Schema
export const ExcelInsightsSchema = z.object({
  key_metrics: z.array(z.object({
    metric: z.string().describe("Name of the metric (e.g., 'Total Revenue', 'Growth Rate')"),
    value: z.union([z.string(), z.number()]).describe("The metric value"),
    trend: z.enum(["improving", "declining", "stable"]).describe("The trend direction for this metric")
  })).describe("Key performance metrics extracted from the data"),
  insights: z.array(z.string()).describe("Important insights and findings from the data analysis"),
  recommendations: z.array(z.string()).describe("Actionable recommendations based on the analysis"),
  summary: z.string().describe("A concise executive summary of the analysis"),
  risk_factors: z.array(z.string()).optional().describe("Potential risks identified in the data"),
  opportunities: z.array(z.string()).optional().describe("Growth opportunities identified"),
  data_quality_score: z.number().min(0).max(10).optional().describe("Score rating the quality of the input data (0-10)")
});

// CSV Anomaly Detection Schema
export const CSVAnomalySchema = z.object({
  anomalies: z.array(z.object({
    row_index: z.number().describe("Row number where anomaly was found"),
    column: z.string().describe("Column name containing the anomaly"),
    value: z.union([z.string(), z.number()]).describe("The anomalous value"),
    anomaly_type: z.enum([
      "outlier", 
      "missing_data", 
      "duplicate", 
      "format_error", 
      "statistical_outlier",
      "business_rule_violation"
    ]).describe("Type of anomaly detected"),
    severity: z.enum(["low", "medium", "high", "critical"]).describe("Severity level of the anomaly"),
    description: z.string().describe("Detailed description of the anomaly"),
    suggested_action: z.string().describe("Recommended action to address the anomaly")
  })).describe("List of detected anomalies in the data"),
  summary: z.object({
    total_anomalies: z.number().describe("Total number of anomalies found"),
    critical_count: z.number().describe("Number of critical anomalies"),
    data_quality_score: z.number().min(0).max(10).describe("Overall data quality score (0-10)"),
    confidence_level: z.number().min(0).max(1).describe("Confidence in anomaly detection (0-1)")
  }).describe("Summary statistics of anomaly detection"),
  recommendations: z.array(z.string()).describe("Recommendations for data cleaning and improvement")
});

// Financial Analysis Schema  
export const FinancialAnalysisSchema = z.object({
  financial_health: z.object({
    overall_score: z.number().min(0).max(100).describe("Overall financial health score (0-100)"),
    liquidity_ratio: z.number().optional().describe("Current liquidity ratio"),
    profitability_trend: z.enum(["improving", "declining", "stable"]).describe("Profitability trend"),
    risk_level: z.enum(["low", "medium", "high", "critical"]).describe("Financial risk level")
  }).describe("Financial health assessment"),
  key_ratios: z.array(z.object({
    ratio_name: z.string().describe("Name of the financial ratio"),
    value: z.number().describe("Calculated ratio value"),
    benchmark: z.number().optional().describe("Industry benchmark for comparison"),
    interpretation: z.string().describe("What this ratio indicates")
  })).describe("Important financial ratios calculated from the data"),
  cash_flow_analysis: z.object({
    operating_cash_flow: z.number().optional().describe("Operating cash flow amount"),
    free_cash_flow: z.number().optional().describe("Free cash flow amount"),
    cash_flow_trend: z.enum(["improving", "declining", "stable"]).describe("Cash flow trend")
  }).optional().describe("Cash flow analysis if data is available"),
  recommendations: z.array(z.string()).describe("Financial recommendations based on analysis")
});

/**
 * Structured analysis for Excel reports with email notification integration
 */
export async function analyzeExcelReport(
  reportData: any, 
  reportName: string, 
  userEmail?: string,
  userId?: string
): Promise<{
  success: boolean;
  insights?: z.infer<typeof ExcelInsightsSchema>;
  error?: string;
  emailSent?: boolean;
}> {
  if (!openai) {
    return {
      success: false,
      error: 'OpenAI service not available'
    };
  }

  try {
    console.log(`📊 Starting structured analysis for report: ${reportName}`);
    
    // Prepare data for analysis
    const dataString = JSON.stringify(reportData).substring(0, 8000); // Limit size
    
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert business analyst specializing in Excel report analysis. 
          Analyze the provided Excel data and extract meaningful insights, key metrics, trends, and actionable recommendations.
          
          Focus on:
          - Key performance indicators and metrics
          - Trends and patterns in the data
          - Business insights and findings
          - Actionable recommendations
          - Risk factors and opportunities
          - Data quality assessment
          
          Provide precise, professional, and actionable analysis suitable for business decision-making.`
        },
        {
          role: "user", 
          content: `Please analyze this Excel report data and provide structured insights:
          
          Report Name: ${reportName}
          Data: ${dataString}
          
          Extract key metrics, identify trends, provide insights and recommendations.`
        }
      ],
      response_format: zodResponseFormat(ExcelInsightsSchema, "excel_insights"),
      temperature: 0.1
    });

    const insights = completion.choices[0].message.parsed;
    
    if (!insights) {
      return {
        success: false,
        error: 'Failed to parse structured insights from OpenAI response'
      };
    }

    console.log(`✅ Excel analysis completed for ${reportName}: ${insights.key_metrics.length} metrics, ${insights.insights.length} insights`);

    // Send email notification if user email is provided
    let emailSent = false;
    if (userEmail) {
      try {
        emailSent = await sendExcelReportInsights(userEmail, reportName, insights, userId);
        console.log(`📧 Email notification ${emailSent ? 'sent' : 'failed'} for ${reportName}`);
      } catch (emailError) {
        console.error('❌ Failed to send email notification:', emailError);
      }
    }

    return {
      success: true,
      insights,
      emailSent
    };
  } catch (error: any) {
    console.error(`❌ Error analyzing Excel report ${reportName}:`, error);
    return {
      success: false,
      error: `Analysis failed: ${error.message}`
    };
  }
}

/**
 * CSV anomaly detection with structured output
 */
export async function analyzeCSVAnomalies(
  csvData: any[], 
  fileName?: string
): Promise<{
  success: boolean;
  anomalies?: z.infer<typeof CSVAnomalySchema>;
  error?: string;
}> {
  if (!openai) {
    return {
      success: false,
      error: 'OpenAI service not available'
    };
  }

  try {
    console.log(`🔍 Starting anomaly detection for CSV data (${csvData.length} rows)`);
    
    // Sample data for analysis (first 50 rows to stay within token limits)
    const sampleData = csvData.slice(0, 50);
    const dataString = JSON.stringify(sampleData, null, 2);
    
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert data quality analyst. Analyze CSV data for anomalies, inconsistencies, and data quality issues.
          
          Look for:
          - Statistical outliers and unusual values
          - Missing or null data patterns
          - Duplicate records
          - Format inconsistencies
          - Business rule violations
          - Data type mismatches
          - Suspicious patterns
          
          Classify anomalies by type and severity. Provide actionable recommendations for data cleaning.`
        },
        {
          role: "user",
          content: `Analyze this CSV data for anomalies and data quality issues:
          
          ${fileName ? `File: ${fileName}` : ''}
          Total rows: ${csvData.length}
          Sample data (first 50 rows):
          ${dataString}
          
          Detect anomalies, assess data quality, and provide recommendations.`
        }
      ],
      response_format: zodResponseFormat(CSVAnomalySchema, "csv_anomalies"),
      temperature: 0.1
    });

    const anomalies = completion.choices[0].message.parsed;
    
    if (!anomalies) {
      return {
        success: false,
        error: 'Failed to parse structured anomaly analysis from OpenAI response'
      };
    }

    console.log(`✅ Anomaly detection completed: ${anomalies.anomalies.length} anomalies found, quality score: ${anomalies.summary.data_quality_score}/10`);

    return {
      success: true,
      anomalies
    };
  } catch (error: any) {
    console.error('❌ Error in CSV anomaly detection:', error);
    return {
      success: false,
      error: `Anomaly detection failed: ${error.message}`
    };
  }
}

/**
 * Financial data analysis with structured output
 */
export async function analyzeFinancialData(
  financialData: any,
  reportName: string
): Promise<{
  success: boolean;
  analysis?: z.infer<typeof FinancialAnalysisSchema>;
  error?: string;
}> {
  if (!openai) {
    return {
      success: false,
      error: 'OpenAI service not available'
    };
  }

  try {
    console.log(`💰 Starting financial analysis for: ${reportName}`);
    
    const dataString = JSON.stringify(financialData).substring(0, 6000);
    
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini", 
      messages: [
        {
          role: "system",
          content: `You are a senior financial analyst. Analyze financial data to assess financial health, calculate key ratios, and provide professional recommendations.
          
          Focus on:
          - Financial health and stability
          - Key financial ratios (liquidity, profitability, efficiency)
          - Cash flow analysis
          - Risk assessment
          - Investment recommendations
          - Performance trends
          
          Provide professional-grade financial analysis suitable for executive decision-making.`
        },
        {
          role: "user",
          content: `Analyze this financial data and provide structured financial insights:
          
          Report: ${reportName}
          Financial Data: ${dataString}
          
          Calculate ratios, assess financial health, and provide recommendations.`
        }
      ],
      response_format: zodResponseFormat(FinancialAnalysisSchema, "financial_analysis"),
      temperature: 0.1
    });

    const analysis = completion.choices[0].message.parsed;
    
    if (!analysis) {
      return {
        success: false,
        error: 'Failed to parse structured financial analysis'
      };
    }

    console.log(`✅ Financial analysis completed for ${reportName}: Score ${analysis.financial_health.overall_score}/100`);

    return {
      success: true,
      analysis
    };
  } catch (error: any) {
    console.error(`❌ Error in financial analysis for ${reportName}:`, error);
    return {
      success: false,
      error: `Financial analysis failed: ${error.message}`
    };
  }
}

/**
 * Market sentiment analysis for text data
 */
export async function analyzeMarketSentiment(
  textData: string[],
  context?: string
): Promise<{
  success: boolean;
  sentiment?: {
    overall_sentiment: "bullish" | "bearish" | "neutral";
    confidence: number;
    key_themes: string[];
    sentiment_score: number; // -1 to 1
    recommendations: string[];
  };
  error?: string;
}> {
  if (!openai) {
    return {
      success: false,
      error: 'OpenAI service not available'
    };
  }

  try {
    console.log(`📈 Analyzing market sentiment for ${textData.length} text items`);
    
    const textSample = textData.slice(0, 20).join('\n\n');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a market sentiment analyst. Analyze text data to determine market sentiment, identify themes, and provide investment insights.`
        },
        {
          role: "user",
          content: `Analyze market sentiment from this text data:
          
          ${context ? `Context: ${context}` : ''}
          
          Text Data:
          ${textSample}
          
          Provide sentiment analysis, confidence score, key themes, and recommendations in JSON format with fields:
          - overall_sentiment: "bullish" | "bearish" | "neutral"
          - confidence: number (0-1)
          - key_themes: string[]
          - sentiment_score: number (-1 to 1)
          - recommendations: string[]`
        }
      ],
      temperature: 0.2
    });

    const response = completion.choices[0].message.content;
    const sentiment = JSON.parse(response || '{}');

    console.log(`✅ Sentiment analysis completed: ${sentiment.overall_sentiment} (${(sentiment.confidence * 100).toFixed(1)}% confidence)`);

    return {
      success: true,
      sentiment
    };
  } catch (error: any) {
    console.error('❌ Error in sentiment analysis:', error);
    return {
      success: false,
      error: `Sentiment analysis failed: ${error.message}`
    };
  }
}

/**
 * Get OpenAI service status
 */
export function getOpenAIServiceStatus(): {
  available: boolean;
  configured: boolean;
  model: string;
} {
  return {
    available: openai !== null,
    configured: !!process.env.OPENAI_API_KEY,
    model: 'gpt-4o-mini'
  };
}

/**
 * Test OpenAI structured output
 */
export async function testStructuredOutput(): Promise<{
  success: boolean;
  message: string;
}> {
  if (!openai) {
    return {
      success: false,
      message: 'OpenAI service not available'
    };
  }

  try {
    const testSchema = z.object({
      test_result: z.string(),
      timestamp: z.string(),
      status: z.enum(["success", "failure"])
    });

    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: "Return a test response indicating successful connection" }
      ],
      response_format: zodResponseFormat(testSchema, "test_response"),
    });

    const result = completion.choices[0].message.parsed;
    
    return {
      success: true,
      message: `✅ OpenAI structured output test successful: ${result?.test_result}`
    };
  } catch (error: any) {
    return {
      success: false,
      message: `❌ OpenAI test failed: ${error.message}`
    };
  }
}

// Export schemas for use in other modules
export { ExcelInsightsSchema, CSVAnomalySchema, FinancialAnalysisSchema };