import { Link } from "wouter";
import { TrendingUp } from "lucide-react";
import { SiX, SiLinkedin, SiGithub, SiYoutube } from "react-icons/si";
import { EnhancedIcon } from "@/components/icons/enhanced-icon";

export default function Footer() {
  return (
    <footer className="bg-secondary border-t border-border" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <TrendingUp 
                  size={16} 
                  color="hsl(var(--primary-foreground))" 
                  aria-hidden="true"
                />
              </div>
              <span className="text-xl font-bold" data-testid="text-footer-brand">PropFarming Pro</span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md" data-testid="text-footer-description">
              Advanced financial learning platform powered by AI and machine learning technologies.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://twitter.com/tamzidullah" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-twitter"
                aria-label="Follow us on Twitter"
              >
                <SiX 
                  size={20} 
                  aria-hidden="true"
                />
              </a>
              <a 
                href="https://linkedin.com/in/tamzidullah" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-linkedin"
                aria-label="Connect with us on LinkedIn"
              >
                <SiLinkedin 
                  size={20} 
                  aria-hidden="true"
                />
              </a>
              <a 
                href="https://github.com/tamzidullah" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-github"
                aria-label="View our GitHub repository"
              >
                <SiGithub 
                  size={20} 
                  aria-hidden="true"
                />
              </a>
              <a 
                href="https://youtube.com/tamzidullah" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-youtube"
                aria-label="Subscribe to our YouTube channel"
              >
                <SiYoutube 
                  size={20} 
                  aria-hidden="true"
                />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4" data-testid="text-platform-title">Platform</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/courses" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-courses">
                  Courses
                </Link>
              </li>
              <li>
                <Link href="/certificates" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-certificates">
                  Certifications
                </Link>
              </li>
              <li>
                <Link href="/resources" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-resources">
                  Resources
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-support">
                  Support
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4" data-testid="text-legal-title">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-privacy">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-terms">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-cookies">
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-gdpr">
                  GDPR
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground" data-testid="text-footer-copyright">
            &copy; 2025 PropFarming Pro. All rights reserved. Made with ❤️ by Tamzid Ullah
          </p>
        </div>
      </div>
    </footer>
  );
}
