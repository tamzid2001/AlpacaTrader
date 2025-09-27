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

  shareInvitation: (inviterName: string, resourceType: string, resourceName: string, acceptUrl: string, declineUrl: string, permissions: string[], message?: string) => ({
    subject: `📊 ${inviterName} shared ${resourceType === 'market_data' ? 'Market Data' : resourceType === 'csv' ? 'Analysis Results' : 'Content'} with you`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Share Invitation</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f7f9fc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 30px; }
          .invitation-box { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 25px; margin: 20px 0; text-align: center; }
          .resource-info { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .permissions-list { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin: 15px 0; }
          .permission-item { display: inline-block; background: #e7f3ff; color: #1976d2; padding: 6px 12px; border-radius: 20px; margin: 4px; font-size: 14px; }
          .action-buttons { text-align: center; margin: 30px 0; }
          .btn { display: inline-block; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 0 10px; font-size: 16px; }
          .btn-accept { background: #28a745; color: white; }
          .btn-decline { background: #6c757d; color: white; }
          .btn:hover { opacity: 0.9; }
          .message-box { background: #fffbf0; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 15px 0; font-style: italic; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
          .security-note { font-size: 12px; color: #6c757d; text-align: center; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔗 MarketDifferentials</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">You've been invited to access shared content</p>
          </div>
          <div class="content">
            <div class="invitation-box">
              <h2 style="margin-top: 0; color: #333;">📤 ${inviterName} wants to share content with you</h2>
              <p style="font-size: 18px; margin-bottom: 0;">Click below to accept this invitation and gain access to shared ${resourceType === 'market_data' ? 'market data' : resourceType === 'csv' ? 'analysis results' : 'content'}.</p>
            </div>
            
            <div class="resource-info">
              <h3 style="margin-top: 0; color: #1976d2;">📋 What's being shared:</h3>
              <p><strong>${resourceName}</strong></p>
              <p style="margin-bottom: 0;">Type: ${resourceType === 'market_data' ? '📈 Market Data Analysis' : resourceType === 'csv' ? '📊 CSV Analysis Results' : '📄 Content'}</p>
            </div>

            ${message ? `
              <div class="message-box">
                <h4 style="margin-top: 0;">💬 Personal Message:</h4>
                <p style="margin-bottom: 0;">"${message}"</p>
              </div>
            ` : ''}

            <div class="permissions-list">
              <h4 style="margin-top: 0;">🔐 Your Access Permissions:</h4>
              <div>
                ${permissions.map(p => `<span class="permission-item">${p === 'view' ? '👁️ View' : p === 'edit' ? '✏️ Edit' : p === 'share' ? '🔗 Share' : p === 'delete' ? '🗑️ Delete' : p}</span>`).join('')}
              </div>
            </div>

            <div class="action-buttons">
              <a href="${acceptUrl}" class="btn btn-accept">✅ Accept Invitation</a>
              <a href="${declineUrl}" class="btn btn-decline">❌ Decline</a>
            </div>

            <div style="background: #e8f5e8; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #155724;">🔒 Security & Privacy</h4>
              <ul style="margin-bottom: 0; padding-left: 20px;">
                <li>This invitation is secure and only you can access it</li>
                <li>The invitation will expire automatically for security</li>
                <li>You can revoke access at any time from your dashboard</li>
                <li>All sharing activity is logged for security purposes</li>
              </ul>
            </div>

            <div class="security-note">
              <p>🔗 This invitation link is unique and secure. If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          </div>
          <div class="footer">
            <p><strong>MarketDifferentials</strong> - Professional Market Analysis & Collaboration</p>
            <p>Secure sharing made simple for financial professionals</p>
            <p style="font-size: 12px;">© 2024 MarketDifferentials. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  shareAccepted: (accepterName: string, resourceType: string, resourceName: string) => ({
    subject: `✅ ${accepterName} accepted your share invitation`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Share Accepted</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f7f9fc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 30px; }
          .success-box { background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 25px; margin: 20px 0; text-align: center; }
          .resource-info { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
          .btn { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 MarketDifferentials</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Share invitation accepted!</p>
          </div>
          <div class="content">
            <div class="success-box">
              <h2 style="margin-top: 0; color: #155724;">✅ Great news!</h2>
              <p style="font-size: 18px; margin-bottom: 0;"><strong>${accepterName}</strong> has accepted your invitation and now has access to your shared content.</p>
            </div>
            
            <div class="resource-info">
              <h3 style="margin-top: 0;">📋 Shared Content:</h3>
              <p><strong>${resourceName}</strong></p>
              <p style="margin-bottom: 0;">Type: ${resourceType === 'market_data' ? '📈 Market Data Analysis' : resourceType === 'csv' ? '📊 CSV Analysis Results' : '📄 Content'}</p>
            </div>

            <p>You can now collaborate on this content together. You can manage sharing permissions and monitor access from your dashboard.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="#" class="btn">View Sharing Dashboard →</a>
            </div>
          </div>
          <div class="footer">
            <p><strong>MarketDifferentials</strong> - Professional Market Analysis & Collaboration</p>
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
  }),

  // Productivity Email Templates
  taskAssignment: (assignerName: string, taskTitle: string, boardTitle: string, dueDate?: Date, priority?: string) => ({
    subject: `📋 New Task Assignment: ${taskTitle}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Task Assignment</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f7f9fc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 30px; }
          .task-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
          .priority-high { background: #ff4444; color: white; }
          .priority-medium { background: #ffaa00; color: white; }
          .priority-low { background: #00c851; color: white; }
          .btn { display: inline-block; background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Task Assignment</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">You have a new task to work on</p>
          </div>
          <div class="content">
            <div class="task-box">
              <h2 style="margin-top: 0; color: #856404;">${taskTitle}</h2>
              <p><strong>Assigned by:</strong> ${assignerName}</p>
              <p><strong>Board:</strong> ${boardTitle}</p>
              ${priority ? `<div style="margin: 10px 0;"><span class="priority-badge priority-${priority}">${priority} Priority</span></div>` : ''}
              ${dueDate ? `<p><strong>Due Date:</strong> ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString()}</p>` : ''}
            </div>
            
            <p>You've been assigned a new task that requires your attention. Click the button below to view the full details and start working on it.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" class="btn">View Task Details →</a>
            </div>
          </div>
          <div class="footer">
            <p><strong>MarketDifferentials</strong> - Productivity Management</p>
            <p style="font-size: 12px;">© 2024 MarketDifferentials. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  dueDateReminder: (taskTitle: string, boardTitle: string, dueDate: Date, timeUntilDue: string, priority?: string) => ({
    subject: `⏰ Due Date Reminder: ${taskTitle} (${timeUntilDue})`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Due Date Reminder</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f7f9fc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 30px; }
          .reminder-box { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
          .priority-urgent { background: #ff4444; color: white; }
          .priority-high { background: #ff6600; color: white; }
          .priority-medium { background: #ffaa00; color: white; }
          .priority-low { background: #00c851; color: white; }
          .btn { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Due Date Reminder</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Your task is due ${timeUntilDue}</p>
          </div>
          <div class="content">
            <div class="reminder-box">
              <h2 style="margin-top: 0; color: #1976d2;">${taskTitle}</h2>
              <p><strong>Board:</strong> ${boardTitle}</p>
              <p><strong>Due Date:</strong> ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString()}</p>
              <p><strong>Time Remaining:</strong> ${timeUntilDue}</p>
              ${priority ? `<div style="margin: 10px 0;"><span class="priority-badge priority-${priority}">${priority} Priority</span></div>` : ''}
            </div>
            
            <p>This is a friendly reminder that your task is approaching its due date. Don't let it slip by - complete it on time to keep your productivity on track!</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" class="btn">Complete Task Now →</a>
            </div>
          </div>
          <div class="footer">
            <p><strong>MarketDifferentials</strong> - Productivity Management</p>
            <p style="font-size: 12px;">© 2024 MarketDifferentials. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  statusChange: (taskTitle: string, boardTitle: string, oldStatus: string, newStatus: string, changedBy: string) => ({
    subject: `🔄 Status Update: ${taskTitle} is now ${newStatus}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Status Change Notification</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f7f9fc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 30px; }
          .status-box { background: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .status-change { display: flex; justify-content: space-between; align-items: center; margin: 20px 0; }
          .status-badge { padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; text-transform: uppercase; }
          .status-not_started { background: #6c757d; color: white; }
          .status-in_progress { background: #007bff; color: white; }
          .status-completed { background: #28a745; color: white; }
          .status-blocked { background: #dc3545; color: white; }
          .status-cancelled { background: #6c757d; color: white; }
          .btn { display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔄 Status Update</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Task status has been updated</p>
          </div>
          <div class="content">
            <div class="status-box">
              <h2 style="margin-top: 0; color: #155724;">${taskTitle}</h2>
              <p><strong>Board:</strong> ${boardTitle}</p>
              <p><strong>Updated by:</strong> ${changedBy}</p>
              <p><strong>Updated at:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="status-change">
              <div style="text-align: center;">
                <span class="status-badge status-${oldStatus.replace(' ', '_')}">${oldStatus}</span>
                <div style="font-size: 12px; margin-top: 5px; color: #6c757d;">Previous Status</div>
              </div>
              <div style="font-size: 24px; color: #28a745;">→</div>
              <div style="text-align: center;">
                <span class="status-badge status-${newStatus.replace(' ', '_')}">${newStatus}</span>
                <div style="font-size: 12px; margin-top: 5px; color: #6c757d;">Current Status</div>
              </div>
            </div>
            
            <p>The status of your task has been updated. Stay informed about the progress and take any necessary actions.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" class="btn">View Task Details →</a>
            </div>
          </div>
          <div class="footer">
            <p><strong>MarketDifferentials</strong> - Productivity Management</p>
            <p style="font-size: 12px;">© 2024 MarketDifferentials. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  mentionNotification: (mentionerName: string, taskTitle: string, boardTitle: string, comment: string) => ({
    subject: `💬 ${mentionerName} mentioned you in ${taskTitle}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mention Notification</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f7f9fc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #8e44ad 0%, #3498db 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 30px; }
          .mention-box { background: #f8f9fe; border-left: 4px solid #8e44ad; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .comment-box { background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 15px 0; font-style: italic; border-left: 3px solid #dee2e6; }
          .btn { display: inline-block; background: #8e44ad; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💬 You've been mentioned!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">${mentionerName} mentioned you</p>
          </div>
          <div class="content">
            <div class="mention-box">
              <h2 style="margin-top: 0; color: #6f42c1;">${taskTitle}</h2>
              <p><strong>Board:</strong> ${boardTitle}</p>
              <p><strong>Mentioned by:</strong> ${mentionerName}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="comment-box">
              <p style="margin: 0;">"${comment}"</p>
            </div>
            
            <p>${mentionerName} mentioned you in a comment and may be looking for your input or collaboration. Check out the full context and respond as needed.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" class="btn">View & Respond →</a>
            </div>
          </div>
          <div class="footer">
            <p><strong>MarketDifferentials</strong> - Productivity Management</p>
            <p style="font-size: 12px;">© 2024 MarketDifferentials. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  overdueAlert: (taskTitle: string, boardTitle: string, dueDate: Date, daysOverdue: number, priority?: string) => ({
    subject: `🚨 OVERDUE: ${taskTitle} (${daysOverdue} days overdue)`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Overdue Task Alert</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f7f9fc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 30px; }
          .overdue-box { background: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
          .priority-urgent { background: #ff4444; color: white; }
          .priority-high { background: #ff6600; color: white; }
          .priority-medium { background: #ffaa00; color: white; }
          .priority-low { background: #00c851; color: white; }
          .btn { display: inline-block; background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 OVERDUE ALERT</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Your task is ${daysOverdue} days overdue</p>
          </div>
          <div class="content">
            <div class="overdue-box">
              <h2 style="margin-top: 0; color: #721c24;">${taskTitle}</h2>
              <p><strong>Board:</strong> ${boardTitle}</p>
              <p><strong>Original Due Date:</strong> ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString()}</p>
              <p><strong>Days Overdue:</strong> <span style="color: #dc3545; font-weight: bold;">${daysOverdue} days</span></p>
              ${priority ? `<div style="margin: 10px 0;"><span class="priority-badge priority-${priority}">${priority} Priority</span></div>` : ''}
            </div>
            
            <p><strong>⚠️ Action Required:</strong> This task is significantly overdue and needs immediate attention. Please complete it as soon as possible or update its status if it's no longer relevant.</p>
            
            <ul>
              <li>Complete the task if it's still relevant</li>
              <li>Update the due date if more time is needed</li>
              <li>Mark as cancelled if no longer applicable</li>
              <li>Delegate to someone else if appropriate</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" class="btn">Take Action Now →</a>
            </div>
          </div>
          <div class="footer">
            <p><strong>MarketDifferentials</strong> - Productivity Management</p>
            <p style="font-size: 12px;">© 2024 MarketDifferentials. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  dailyDigest: (userName: string, digestData: any) => ({
    subject: `📊 Daily Productivity Digest - ${new Date().toLocaleDateString()}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily Productivity Digest</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f7f9fc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 30px; }
          .stats-grid { display: flex; justify-content: space-between; margin: 20px 0; }
          .stat-box { background: #f8f9fa; border-radius: 8px; padding: 15px; text-align: center; flex: 1; margin: 0 5px; }
          .stat-number { font-size: 24px; font-weight: bold; color: #17a2b8; }
          .stat-label { font-size: 12px; color: #6c757d; text-transform: uppercase; }
          .task-list { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .task-item { background: white; border-radius: 6px; padding: 12px; margin: 8px 0; border-left: 4px solid #28a745; }
          .task-overdue { border-left-color: #dc3545; }
          .task-due-soon { border-left-color: #ffc107; }
          .btn { display: inline-block; background: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Daily Digest</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Good morning, ${userName}!</p>
          </div>
          <div class="content">
            <p>Here's your productivity summary for ${new Date().toLocaleDateString()}:</p>
            
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-number">${digestData.totalTasks || 0}</div>
                <div class="stat-label">Total Tasks</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">${digestData.completedTasks || 0}</div>
                <div class="stat-label">Completed</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">${digestData.dueTasks || 0}</div>
                <div class="stat-label">Due Today</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">${digestData.overdueTasks || 0}</div>
                <div class="stat-label">Overdue</div>
              </div>
            </div>
            
            ${digestData.dueTasks > 0 ? `
              <div class="task-list">
                <h3 style="margin-top: 0; color: #2c3e50;">📅 Due Today</h3>
                ${digestData.dueTasksList?.map((task: any) => `
                  <div class="task-item task-due-soon">
                    <strong>${task.title}</strong><br>
                    <small>${task.boardTitle} • Due: ${task.dueDate}</small>
                  </div>
                `).join('') || ''}
              </div>
            ` : ''}
            
            ${digestData.overdueTasks > 0 ? `
              <div class="task-list">
                <h3 style="margin-top: 0; color: #2c3e50;">🚨 Overdue Tasks</h3>
                ${digestData.overdueTasksList?.map((task: any) => `
                  <div class="task-item task-overdue">
                    <strong>${task.title}</strong><br>
                    <small>${task.boardTitle} • ${task.daysOverdue} days overdue</small>
                  </div>
                `).join('') || ''}
              </div>
            ` : ''}
            
            ${digestData.completedTasks > 0 ? `
              <div class="task-list">
                <h3 style="margin-top: 0; color: #2c3e50;">✅ Recently Completed</h3>
                ${digestData.completedTasksList?.map((task: any) => `
                  <div class="task-item">
                    <strong>${task.title}</strong><br>
                    <small>${task.boardTitle} • Completed: ${task.completedAt}</small>
                  </div>
                `).join('') || ''}
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" class="btn">View Full Dashboard →</a>
            </div>
            
            <p style="color: #6c757d; font-size: 14px;">
              <strong>Productivity Tip:</strong> ${digestData.tip || "Focus on completing your highest priority tasks first to maximize your impact today!"}
            </p>
          </div>
          <div class="footer">
            <p><strong>MarketDifferentials</strong> - Productivity Management</p>
            <p style="font-size: 12px;">© 2024 MarketDifferentials. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  boardInvitation: (inviterName: string, boardTitle: string, boardDescription: string, role: string) => ({
    subject: `🤝 ${inviterName} invited you to collaborate on "${boardTitle}"`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Board Invitation</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f7f9fc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #6f42c1 0%, #007bff 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 30px; }
          .invitation-box { background: #f8f9fe; border-left: 4px solid #6f42c1; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .role-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; background: #6f42c1; color: white; }
          .btn-primary { display: inline-block; background: #6f42c1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 5px; }
          .btn-secondary { display: inline-block; background: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 5px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤝 Collaboration Invitation</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">You've been invited to join a board</p>
          </div>
          <div class="content">
            <div class="invitation-box">
              <h2 style="margin-top: 0; color: #6f42c1;">${boardTitle}</h2>
              <p><strong>Invited by:</strong> ${inviterName}</p>
              <p><strong>Your role:</strong> <span class="role-badge">${role}</span></p>
              <p><strong>Description:</strong> ${boardDescription}</p>
              <p><strong>Invited on:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <p>${inviterName} has invited you to collaborate on their productivity board. You'll be able to view tasks, participate in discussions, and contribute to the project's success.</p>
            
            <p><strong>As a ${role}, you'll be able to:</strong></p>
            <ul>
              ${role === 'owner' ? '<li>Full access to all board features</li><li>Manage board settings and permissions</li><li>Add and remove team members</li>' : ''}
              ${role === 'editor' ? '<li>Create, edit, and delete tasks</li><li>Comment and collaborate on items</li><li>Update task statuses and assignments</li>' : ''}
              ${role === 'viewer' ? '<li>View all board content</li><li>Comment on tasks</li><li>Receive notifications about updates</li>' : ''}
              <li>Receive notifications about important updates</li>
              <li>Export board data for reporting</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" class="btn-primary">Accept Invitation →</a>
              <a href="#" class="btn-secondary">Decline</a>
            </div>
          </div>
          <div class="footer">
            <p><strong>MarketDifferentials</strong> - Productivity Management</p>
            <p style="font-size: 12px;">© 2024 MarketDifferentials. All rights reserved.</p>
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

// Share invitation email functions
export async function sendShareInvitation(
  email: string,
  inviterName: string,
  resourceType: string,
  resourceName: string,
  acceptUrl: string,
  declineUrl: string,
  permissions: string[],
  message?: string
): Promise<boolean> {
  const template = emailTemplates.shareInvitation(inviterName, resourceType, resourceName, acceptUrl, declineUrl, permissions, message);
  return await sendEmail(email, template, { 
    type: 'share_invitation',
    resourceType,
    inviter: inviterName 
  });
}

export async function sendShareAcceptedNotification(
  email: string,
  accepterName: string,
  resourceType: string,
  resourceName: string
): Promise<boolean> {
  const template = emailTemplates.shareAccepted(accepterName, resourceType, resourceName);
  return await sendEmail(email, template, { 
    type: 'share_accepted',
    resourceType,
    accepter: accepterName 
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

// Productivity Email Functions
export async function sendTaskAssignment(
  userEmail: string,
  assignerName: string,
  taskTitle: string,
  boardTitle: string,
  dueDate?: Date,
  priority?: string,
  userId?: string
): Promise<boolean> {
  const template = emailTemplates.taskAssignment(assignerName, taskTitle, boardTitle, dueDate, priority);
  return await sendEmail(userEmail, template, {
    type: 'task_assignment',
    userId,
    taskTitle,
    assignerName
  });
}

export async function sendDueDateReminder(
  userEmail: string,
  taskTitle: string,
  boardTitle: string,
  dueDate: Date,
  timeUntilDue: string,
  priority?: string,
  userId?: string
): Promise<boolean> {
  const template = emailTemplates.dueDateReminder(taskTitle, boardTitle, dueDate, timeUntilDue, priority);
  return await sendEmail(userEmail, template, {
    type: 'due_date_reminder',
    userId,
    taskTitle,
    dueDate: dueDate.toISOString()
  });
}

export async function sendStatusChange(
  userEmail: string,
  taskTitle: string,
  boardTitle: string,
  oldStatus: string,
  newStatus: string,
  changedBy: string,
  userId?: string
): Promise<boolean> {
  const template = emailTemplates.statusChange(taskTitle, boardTitle, oldStatus, newStatus, changedBy);
  return await sendEmail(userEmail, template, {
    type: 'status_change',
    userId,
    taskTitle,
    oldStatus,
    newStatus,
    changedBy
  });
}

export async function sendMentionNotification(
  userEmail: string,
  mentionerName: string,
  taskTitle: string,
  boardTitle: string,
  comment: string,
  userId?: string
): Promise<boolean> {
  const template = emailTemplates.mentionNotification(mentionerName, taskTitle, boardTitle, comment);
  return await sendEmail(userEmail, template, {
    type: 'mention',
    userId,
    taskTitle,
    mentionerName,
    comment
  });
}

export async function sendOverdueAlert(
  userEmail: string,
  taskTitle: string,
  boardTitle: string,
  dueDate: Date,
  daysOverdue: number,
  priority?: string,
  userId?: string
): Promise<boolean> {
  const template = emailTemplates.overdueAlert(taskTitle, boardTitle, dueDate, daysOverdue, priority);
  return await sendEmail(userEmail, template, {
    type: 'overdue_alert',
    userId,
    taskTitle,
    daysOverdue
  });
}

export async function sendDailyDigest(
  userEmail: string,
  userName: string,
  digestData: {
    totalTasks?: number;
    completedTasks?: number;
    dueTasks?: number;
    overdueTasks?: number;
    dueTasksList?: any[];
    overdueTasksList?: any[];
    completedTasksList?: any[];
    tip?: string;
  },
  userId?: string
): Promise<boolean> {
  const template = emailTemplates.dailyDigest(userName, digestData);
  return await sendEmail(userEmail, template, {
    type: 'daily_digest',
    userId,
    userName,
    digestData
  });
}

export async function sendBoardInvitation(
  userEmail: string,
  inviterName: string,
  boardTitle: string,
  boardDescription: string,
  role: string,
  userId?: string
): Promise<boolean> {
  const template = emailTemplates.boardInvitation(inviterName, boardTitle, boardDescription, role);
  return await sendEmail(userEmail, template, {
    type: 'board_invitation',
    userId,
    inviterName,
    boardTitle,
    role
  });
}

// Smart reminder scheduling function
export function calculateReminderTime(dueDate: Date, reminderType: 'immediate' | '1hour' | '1day' | '3days' | '1week'): Date {
  const now = new Date();
  const due = new Date(dueDate);
  
  switch (reminderType) {
    case 'immediate':
      return now;
    case '1hour':
      return new Date(due.getTime() - (60 * 60 * 1000)); // 1 hour before
    case '1day':
      return new Date(due.getTime() - (24 * 60 * 60 * 1000)); // 1 day before
    case '3days':
      return new Date(due.getTime() - (3 * 24 * 60 * 60 * 1000)); // 3 days before
    case '1week':
      return new Date(due.getTime() - (7 * 24 * 60 * 60 * 1000)); // 1 week before
    default:
      return due;
  }
}

// Generate human-readable time until due
export function formatTimeUntilDue(dueDate: Date): string {
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  
  if (diffMs < 0) {
    const daysOverdue = Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
    return `${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue`;
  }
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffDays > 0) {
    return `in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
  } else if (diffHours > 0) {
    return `in ${diffHours} hour${diffHours === 1 ? '' : 's'}`;
  } else if (diffMinutes > 0) {
    return `in ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}`;
  } else {
    return 'due now';
  }
}

// Productivity notification scheduler (for backend automation)
export async function scheduleProductivityNotifications(
  userId: string,
  userEmail: string,
  userName: string,
  tasks: any[]
): Promise<boolean> {
  try {
    const now = new Date();
    let notificationsSent = 0;

    // Check for due date reminders
    for (const task of tasks) {
      if (task.dueDate && task.status !== 'completed' && task.status !== 'cancelled') {
        const dueDate = new Date(task.dueDate);
        const timeUntilDue = formatTimeUntilDue(dueDate);
        const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Send reminder if due within 24 hours
        if (hoursUntilDue > 0 && hoursUntilDue <= 24) {
          await sendDueDateReminder(
            userEmail,
            task.title,
            task.boardTitle || 'Unknown Board',
            dueDate,
            timeUntilDue,
            task.priority,
            userId
          );
          notificationsSent++;
        }
        // Send overdue alert if past due
        else if (hoursUntilDue < 0) {
          const daysOverdue = Math.ceil(Math.abs(hoursUntilDue) / 24);
          await sendOverdueAlert(
            userEmail,
            task.title,
            task.boardTitle || 'Unknown Board',
            dueDate,
            daysOverdue,
            task.priority,
            userId
          );
          notificationsSent++;
        }
      }
    }

    console.log(`✅ Sent ${notificationsSent} productivity notifications to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to schedule productivity notifications:', error);
    return false;
  }
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