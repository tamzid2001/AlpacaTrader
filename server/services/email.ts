import { MailService } from '@sendgrid/mail';

// ALL EMAILS FROM: tamzid257@gmail.com
const SENDER_EMAIL = 'tamzid257@gmail.com';

// Initialize SendGrid with error handling
let mailService: MailService | null = null;
try {
  if (process.env.SENDGRID_API_KEY) {
    mailService = new MailService();
    mailService.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('✅ SendGrid email service initialized successfully');
  } else {
    console.warn('⚠️ SENDGRID_API_KEY not found - email service disabled');
  }
} catch (error) {
  console.error('❌ SendGrid initialization failed:', error);
}

// Professional email templates
export const emailTemplates = {
  priceAlert: (ticker: string, currentPrice: number, alertType: string, targetPrice?: number, percentile?: number) => ({
    subject: `🚨 ${ticker} Price Alert: ${alertType === 'crossing_up' ? 'Price Rising ⬆️' : alertType === 'crossing_down' ? 'Price Falling ⬇️' : 'Near Percentile'}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Price Alert - ${ticker}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f7f9fc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 30px; }
          .alert-box { background: ${alertType === 'crossing_up' ? '#d4edda' : alertType === 'crossing_down' ? '#f8d7da' : '#fff3cd'}; border: 1px solid ${alertType === 'crossing_up' ? '#c3e6cb' : alertType === 'crossing_down' ? '#f5c6cb' : '#ffeaa7'}; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .price-info { display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .price-current { font-size: 32px; font-weight: bold; color: ${alertType === 'crossing_up' ? '#28a745' : '#dc3545'}; }
          .price-target { font-size: 16px; color: #6c757d; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
          .btn { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📈 MarketDifferentials Alert</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Price Alert Triggered for ${ticker}</p>
          </div>
          <div class="content">
            <div class="alert-box">
              <h2 style="margin-top: 0; color: ${alertType === 'crossing_up' ? '#155724' : alertType === 'crossing_down' ? '#721c24' : '#856404'};">
                ${alertType === 'crossing_up' ? '🚀 Price Breaking Up!' : alertType === 'crossing_down' ? '📉 Price Breaking Down!' : '⚠️ Percentile Alert!'}
              </h2>
              <p><strong>${ticker}</strong> has ${alertType === 'crossing_up' ? 'crossed above' : alertType === 'crossing_down' ? 'dropped below' : 'reached near'} your alert threshold.</p>
            </div>
            
            <div class="price-info">
              <div>
                <div class="price-current">$${currentPrice.toFixed(2)}</div>
                <div style="font-size: 14px; color: #6c757d;">Current Price</div>
              </div>
              <div style="text-align: right;">
                ${targetPrice ? `
                  <div class="price-target">Target: $${targetPrice.toFixed(2)}</div>
                ` : ''}
                ${percentile ? `
                  <div class="price-target">P${percentile} Alert</div>
                ` : ''}
                <div style="font-size: 12px; color: #6c757d;">${new Date().toLocaleString()}</div>
              </div>
            </div>

            <p><strong>What should you do next?</strong></p>
            <ul>
              <li>Review your investment strategy for ${ticker}</li>
              <li>Check recent news and market conditions</li>
              <li>Consider your risk tolerance and portfolio allocation</li>
              <li>Update or modify your price alerts if needed</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="#" class="btn">View Full Market Analysis →</a>
            </div>
          </div>
          <div class="footer">
            <p><strong>MarketDifferentials</strong> - Professional Market Analysis</p>
            <p>This alert was generated automatically based on your price alert settings.</p>
            <p style="font-size: 12px;">© 2024 MarketDifferentials. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),
  
  scheduledNotification: (title: string, message: string, scheduledDate: Date) => ({
    subject: `📅 Scheduled Reminder: ${title}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Scheduled Notification</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f7f9fc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 30px; }
          .notification-box { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 MarketDifferentials</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Scheduled Notification</p>
          </div>
          <div class="content">
            <div class="notification-box">
              <h2 style="margin-top: 0; color: #1976d2;">${title}</h2>
              <p style="font-size: 16px; margin-bottom: 0;">${message}</p>
            </div>
            
            <p><strong>Scheduled for:</strong> ${scheduledDate.toLocaleString()}</p>
            <p><strong>Delivered at:</strong> ${new Date().toLocaleString()}</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #6c757d; font-size: 14px;">
              This is a scheduled notification that was approved by our admin team and delivered automatically.
            </p>
          </div>
          <div class="footer">
            <p><strong>MarketDifferentials</strong> - Professional Market Analysis</p>
            <p style="font-size: 12px;">© 2024 MarketDifferentials. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  excelReportInsights: (reportName: string, insights: any) => ({
    subject: `📊 Excel Analysis Complete: ${reportName}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Excel Report Analysis</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f7f9fc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 30px; }
          .insight-section { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .metric-item { background: white; border-radius: 6px; padding: 15px; margin: 10px 0; border-left: 4px solid #28a745; }
          .recommendation { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 10px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
          .btn { display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 MarketDifferentials</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Excel Report Analysis Complete</p>
          </div>
          <div class="content">
            <h2 style="color: #2c3e50; margin-top: 0;">Report: ${reportName}</h2>
            
            ${insights.summary ? `
              <div class="insight-section">
                <h3 style="color: #2c3e50; margin-top: 0;">📈 Executive Summary</h3>
                <p>${insights.summary}</p>
              </div>
            ` : ''}
            
            ${insights.key_metrics && insights.key_metrics.length > 0 ? `
              <div class="insight-section">
                <h3 style="color: #2c3e50; margin-top: 0;">🔢 Key Metrics</h3>
                ${insights.key_metrics.map((metric: any) => `
                  <div class="metric-item">
                    <strong>${metric.metric}:</strong> ${metric.value}
                    <span style="float: right; color: ${metric.trend === 'improving' ? '#28a745' : metric.trend === 'declining' ? '#dc3545' : '#6c757d'};">
                      ${metric.trend === 'improving' ? '↗️' : metric.trend === 'declining' ? '↘️' : '→'} ${metric.trend}
                    </span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            ${insights.insights && insights.insights.length > 0 ? `
              <div class="insight-section">
                <h3 style="color: #2c3e50; margin-top: 0;">💡 Key Insights</h3>
                <ul>
                  ${insights.insights.map((insight: string) => `<li>${insight}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            ${insights.recommendations && insights.recommendations.length > 0 ? `
              <div class="insight-section">
                <h3 style="color: #2c3e50; margin-top: 0;">🎯 Recommendations</h3>
                ${insights.recommendations.map((rec: string) => `
                  <div class="recommendation">
                    <strong>💡</strong> ${rec}
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" class="btn">Download Full Report →</a>
            </div>
            
            <p style="color: #6c757d; font-size: 14px;">
              <strong>Analysis completed at:</strong> ${new Date().toLocaleString()}<br>
              This report was generated using advanced AI analysis of your Excel data.
            </p>
          </div>
          <div class="footer">
            <p><strong>MarketDifferentials</strong> - Professional Market Analysis</p>
            <p style="font-size: 12px;">© 2024 MarketDifferentials. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  crashReport: (error: any, context: any) => ({
    subject: `🚨 Critical Error Alert - MarketDifferentials`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Critical Error Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f7f9fc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 30px; }
          .error-box { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .details-section { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .code-block { background: #1e1e1e; color: #ffffff; padding: 15px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 14px; overflow-x: auto; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Critical Error Alert</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">MarketDifferentials System Error</p>
          </div>
          <div class="content">
            <div class="error-box">
              <h2 style="margin-top: 0; color: #721c24;">⚠️ System Error Detected</h2>
              <p><strong>Error:</strong> ${error.name || 'Unknown Error'}</p>
              <p><strong>Message:</strong> ${error.message || 'No error message provided'}</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            </div>
            
            ${context ? `
              <div class="details-section">
                <h3 style="color: #2c3e50; margin-top: 0;">🔍 Context Information</h3>
                <p><strong>User ID:</strong> ${context.userId || 'Not provided'}</p>
                <p><strong>User Email:</strong> ${context.userEmail || 'Not provided'}</p>
                <p><strong>URL:</strong> ${context.url || 'Not provided'}</p>
                <p><strong>User Agent:</strong> ${context.userAgent || 'Not provided'}</p>
                <p><strong>Session ID:</strong> ${context.sessionId || 'Not provided'}</p>
              </div>
            ` : ''}
            
            ${error.stack ? `
              <div class="details-section">
                <h3 style="color: #2c3e50; margin-top: 0;">📋 Stack Trace</h3>
                <div class="code-block">${error.stack.replace(/\n/g, '<br>')}</div>
              </div>
            ` : ''}
            
            ${context?.errorInfo?.componentStack ? `
              <div class="details-section">
                <h3 style="color: #2c3e50; margin-top: 0;">⚛️ Component Stack</h3>
                <div class="code-block">${context.errorInfo.componentStack.replace(/\n/g, '<br>')}</div>
              </div>
            ` : ''}
            
            <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Action Required:</strong> Please investigate this error immediately and take appropriate action to resolve the issue.</p>
            </div>
          </div>
          <div class="footer">
            <p><strong>MarketDifferentials</strong> - System Monitoring</p>
            <p style="font-size: 12px;">This is an automated error report generated by the system monitoring.</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Main email sending function
export async function sendEmail(to: string, template: any, metadata?: any): Promise<boolean> {
  if (!mailService) {
    console.error('❌ SendGrid not initialized - cannot send email');
    return false;
  }

  try {
    const msg = {
      to,
      from: {
        email: SENDER_EMAIL,
        name: 'MarketDifferentials Notifications'
      },
      subject: template.subject,
      html: template.html,
      // Add metadata for tracking
      custom_args: {
        notification_type: metadata?.type || 'general',
        user_id: metadata?.userId || 'unknown',
        timestamp: new Date().toISOString()
      }
    };

    await mailService.send(msg);
    console.log(`✅ Email sent successfully to ${to}: ${template.subject}`);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to send email:', error);
    if (error.response) {
      console.error('SendGrid Error Details:', error.response.body);
    }
    return false;
  }
}

// Crash report function - sends to admin
export async function sendCrashReport(error: any, context: any): Promise<boolean> {
  const template = emailTemplates.crashReport(error, context);
  return await sendEmail(SENDER_EMAIL, template, { 
    type: 'crash_report',
    severity: 'critical' 
  });
}

// Price alert notification
export async function sendPriceAlert(
  userEmail: string, 
  ticker: string, 
  currentPrice: number, 
  alertType: string, 
  targetPrice?: number,
  percentile?: number,
  userId?: string
): Promise<boolean> {
  const template = emailTemplates.priceAlert(ticker, currentPrice, alertType, targetPrice, percentile);
  return await sendEmail(userEmail, template, { 
    type: 'price_alert',
    userId,
    ticker,
    alertType 
  });
}

// Scheduled notification
export async function sendScheduledNotification(
  userEmail: string,
  title: string,
  message: string,
  scheduledDate: Date,
  userId?: string
): Promise<boolean> {
  const template = emailTemplates.scheduledNotification(title, message, scheduledDate);
  return await sendEmail(userEmail, template, { 
    type: 'scheduled',
    userId,
    title 
  });
}

// Excel report insights
export async function sendExcelReportInsights(
  userEmail: string,
  reportName: string,
  insights: any,
  userId?: string
): Promise<boolean> {
  const template = emailTemplates.excelReportInsights(reportName, insights);
  return await sendEmail(userEmail, template, { 
    type: 'excel_report',
    userId,
    reportName 
  });
}

// Test email function for verification
export async function sendTestEmail(to: string = SENDER_EMAIL): Promise<boolean> {
  const testTemplate = {
    subject: '✅ SendGrid Integration Test - MarketDifferentials',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">✅ SendGrid Integration Test</h1>
        <p>This is a test email to verify that the SendGrid integration is working correctly.</p>
        <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>From:</strong> ${SENDER_EMAIL}</p>
        <p style="color: #28a745; font-weight: bold;">If you receive this email, the integration is working!</p>
      </div>
    `
  };
  
  return await sendEmail(to, testTemplate, { type: 'test' });
}

// Email service status check
export function getEmailServiceStatus(): { 
  available: boolean; 
  configured: boolean; 
  sender: string;
} {
  return {
    available: mailService !== null,
    configured: !!process.env.SENDGRID_API_KEY,
    sender: SENDER_EMAIL
  };
}