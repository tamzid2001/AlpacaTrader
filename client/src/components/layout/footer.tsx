import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  TrendingUp, Mail, Phone, MapPin, Shield, Lock, CheckCircle, 
  Award, Globe, Users, BookOpen, BarChart, Bot, HelpCircle,
  FileText, Settings, Zap, Database, PieChart, Target, Lightbulb
} from "lucide-react";
import { 
  SiX, SiLinkedin, SiGithub, SiYoutube, SiFacebook,
  SiInstagram, SiDiscord, SiSlack, SiAmazon, SiOpenai, SiReplit,
  SiStripe, SiFirebase, SiPostgresql, SiReact, SiTypescript
} from "react-icons/si";

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white overflow-hidden" role="contentinfo">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-400 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-purple-400 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-cyan-400 rounded-full blur-xl"></div>
        <div className="absolute bottom-40 right-10 w-16 h-16 bg-pink-400 rounded-full blur-lg"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Newsletter Section */}
        <div className="mb-12 text-center">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold mb-4 flex items-center justify-center gap-3" data-testid="text-newsletter-title">
              <Mail className="w-6 h-6 text-blue-400" />
              Stay ahead of the market
            </h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto" data-testid="text-newsletter-description">
              Get exclusive insights, trading strategies, and AI-powered market analysis delivered to your inbox weekly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input 
                type="email" 
                placeholder="Enter your email"
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:bg-white/20 focus:border-blue-400"
                data-testid="input-newsletter-email"
              />
              <Button 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                data-testid="button-newsletter-subscribe"
              >
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Main Footer Content - 4 Column Layout */}
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-12 mb-12">
          
          {/* Column 1: Company Branding & Contact */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp 
                  size={24} 
                  className="text-white"
                  aria-hidden="true"
                />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent" data-testid="text-footer-brand">
                  MarketDifferentials
                </span>
                <div className="text-sm text-blue-200">PropFarming Pro</div>
              </div>
            </div>
            
            <p className="text-blue-100 mb-6 leading-relaxed" data-testid="text-footer-description">
              Advanced financial learning platform powered by AI and machine learning. Master market analysis with real-time data and cutting-edge algorithms.
            </p>

            {/* Contact Information */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-blue-200">
                <Mail className="w-4 h-4 text-blue-400" />
                <a href="mailto:support@marketdifferentials.com" className="hover:text-white transition-colors" data-testid="link-contact-email">
                  support@marketdifferentials.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-blue-200">
                <Phone className="w-4 h-4 text-blue-400" />
                <a href="tel:+1-555-0123" className="hover:text-white transition-colors" data-testid="link-contact-phone">
                  +1 (555) 012-3456
                </a>
              </div>
              <div className="flex items-center gap-3 text-blue-200">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span data-testid="text-contact-address">San Francisco, CA</span>
              </div>
            </div>
            
            {/* Social Media Links */}
            <div className="flex flex-wrap gap-3">
              <a 
                href="https://twitter.com/marketdiff" 
                className="w-10 h-10 bg-white/10 hover:bg-blue-500 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-social-twitter"
                aria-label="Follow us on Twitter"
              >
                <SiX size={18} />
              </a>
              <a 
                href="https://linkedin.com/company/marketdifferentials" 
                className="w-10 h-10 bg-white/10 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-social-linkedin"
                aria-label="Connect with us on LinkedIn"
              >
                <SiLinkedin size={18} />
              </a>
              <a 
                href="https://github.com/marketdifferentials" 
                className="w-10 h-10 bg-white/10 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-social-github"
                aria-label="View our GitHub repository"
              >
                <SiGithub size={18} />
              </a>
              <a 
                href="https://youtube.com/marketdifferentials" 
                className="w-10 h-10 bg-white/10 hover:bg-red-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-social-youtube"
                aria-label="Subscribe to our YouTube channel"
              >
                <SiYoutube size={18} />
              </a>
              <a 
                href="https://discord.gg/marketdifferentials" 
                className="w-10 h-10 bg-white/10 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-social-discord"
                aria-label="Join our Discord community"
              >
                <SiDiscord size={18} />
              </a>
            </div>
          </div>
          
          {/* Column 2: Platform & Products */}
          <div>
            <h4 className="text-lg font-bold mb-6 flex items-center gap-2" data-testid="text-platform-title">
              <BarChart className="w-5 h-5 text-blue-400" />
              Platform & Products
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/dashboard" className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors group" data-testid="link-footer-dashboard">
                  <TrendingUp className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/market-data" className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors group" data-testid="link-footer-market-data">
                  <Database className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                  Market Data
                </Link>
              </li>
              <li>
                <Link href="/anomaly-detection" className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors group" data-testid="link-footer-anomaly-detection">
                  <Target className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                  Anomaly Detection
                </Link>
              </li>
              <li>
                <Link href="/courses" className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors group" data-testid="link-footer-courses">
                  <BookOpen className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                  Learning Hub
                </Link>
              </li>
              <li>
                <Link href="/sagemaker-eula" className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors group" data-testid="link-footer-automl">
                  <Bot className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                  AutoML Canvas
                </Link>
              </li>
              <li>
                <Link href="/my-shared-results" className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors group" data-testid="link-footer-shared-results">
                  <Users className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                  Shared Results
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 3: Resources & Support */}
          <div>
            <h4 className="text-lg font-bold mb-6 flex items-center gap-2" data-testid="text-resources-title">
              <HelpCircle className="w-5 h-5 text-purple-400" />
              Resources & Support
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="/help" className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors group" data-testid="link-footer-help">
                  <HelpCircle className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
                  Help Center
                </a>
              </li>
              <li>
                <a href="/tutorials" className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors group" data-testid="link-footer-tutorials">
                  <BookOpen className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
                  Tutorials
                </a>
              </li>
              <li>
                <a href="/community" className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors group" data-testid="link-footer-community">
                  <Users className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
                  Community
                </a>
              </li>
              <li>
                <a href="/blog" className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors group" data-testid="link-footer-blog">
                  <FileText className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
                  Blog & Insights
                </a>
              </li>
              <li>
                <a href="/status" className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors group" data-testid="link-footer-status">
                  <Zap className="w-4 h-4 text-green-400 group-hover:text-green-300" />
                  System Status
                </a>
              </li>
              <li>
                <a href="/contact" className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors group" data-testid="link-footer-contact">
                  <Mail className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
                  Contact Support
                </a>
              </li>
            </ul>
          </div>
          
          {/* Column 4: Legal & Compliance */}
          <div>
            <h4 className="text-lg font-bold mb-6 flex items-center gap-2" data-testid="text-legal-title">
              <Shield className="w-5 h-5 text-green-400" />
              Legal & Security
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors group" data-testid="link-footer-privacy">
                  <Lock className="w-4 h-4 text-green-400 group-hover:text-green-300" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors group" data-testid="link-footer-terms">
                  <FileText className="w-4 h-4 text-green-400 group-hover:text-green-300" />
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy-settings" className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors group" data-testid="link-footer-gdpr">
                  <Settings className="w-4 h-4 text-green-400 group-hover:text-green-300" />
                  GDPR & Privacy Settings
                </Link>
              </li>
              <li>
                <a href="/cookies" className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors group" data-testid="link-footer-cookies">
                  <CheckCircle className="w-4 h-4 text-green-400 group-hover:text-green-300" />
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href="/security" className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors group" data-testid="link-footer-security">
                  <Shield className="w-4 h-4 text-green-400 group-hover:text-green-300" />
                  Security
                </a>
              </li>
              <li>
                <a href="/accessibility" className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors group" data-testid="link-footer-accessibility">
                  <Globe className="w-4 h-4 text-green-400 group-hover:text-green-300" />
                  Accessibility
                </a>
              </li>
              <li>
                <a href="/compliance" className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors group" data-testid="link-footer-compliance">
                  <Award className="w-4 h-4 text-green-400 group-hover:text-green-300" />
                  Compliance
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Trust Signals & Technology Stack */}
        <div className="border-t border-white/10 pt-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Trust Signals */}
            <div>
              <h5 className="text-sm font-semibold mb-4 text-blue-300">Trusted & Secure</h5>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                  <SiAmazon className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-blue-200">AWS Certified</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-blue-200">SOC 2 Compliant</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                  <Lock className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-blue-200">256-bit SSL</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-blue-200">GDPR Ready</span>
                </div>
              </div>
            </div>
            
            {/* Technology Stack */}
            <div>
              <h5 className="text-sm font-semibold mb-4 text-blue-300">Powered By</h5>
              <div className="flex flex-wrap gap-3">
                <SiReact className="w-6 h-6 text-blue-400 hover:text-blue-300 transition-colors" title="React" />
                <SiTypescript className="w-6 h-6 text-blue-500 hover:text-blue-400 transition-colors" title="TypeScript" />
                <SiOpenai className="w-6 h-6 text-green-400 hover:text-green-300 transition-colors" title="OpenAI" />
                <SiAmazon className="w-6 h-6 text-orange-400 hover:text-orange-300 transition-colors" title="AWS" />
                <SiPostgresql className="w-6 h-6 text-blue-400 hover:text-blue-300 transition-colors" title="PostgreSQL" />
                <SiStripe className="w-6 h-6 text-purple-400 hover:text-purple-300 transition-colors" title="Stripe" />
                <SiFirebase className="w-6 h-6 text-yellow-400 hover:text-yellow-300 transition-colors" title="Firebase" />
                <SiReplit className="w-6 h-6 text-orange-400 hover:text-orange-300 transition-colors" title="Replit" />
              </div>
            </div>
          </div>
        </div>

        {/* Copyright & Bottom Section */}
        <div className="border-t border-white/10 pt-8 text-center">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-blue-200 text-sm" data-testid="text-footer-copyright">
              &copy; 2025 MarketDifferentials. All rights reserved. Made with ❤️ for traders worldwide.
            </p>
            <div className="flex items-center gap-6 text-xs text-blue-300">
              <span>🇺🇸 English</span>
              <span>🌙 Dark Mode</span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}