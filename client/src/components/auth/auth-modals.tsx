import { useState } from "react";
import { useLocation } from "wouter";
import { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, setAuthPersistence } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface AuthModalsProps {
  children: React.ReactNode;
}

export default function AuthModals({ children }: AuthModalsProps) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ 
    firstName: "", 
    lastName: "", 
    email: "", 
    password: "", 
    confirmPassword: "" 
  });
  const [forgotEmail, setForgotEmail] = useState("");

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await setAuthPersistence(rememberMe);
      await signInWithGoogle();
      // Redirect will be handled by auth state change
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await setAuthPersistence(rememberMe);
      await signInWithEmail(loginForm.email, loginForm.password);
      setIsLoginOpen(false);
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupForm.password !== signupForm.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
      });
      return;
    }

    try {
      setIsLoading(true);
      await setAuthPersistence(rememberMe);
      await signUpWithEmail(signupForm.email, signupForm.password);
      setIsSignupOpen(false);
      toast({
        title: "Account created!",
        description: "Your account has been created and is pending approval.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await resetPassword(forgotEmail);
      setIsForgotPasswordOpen(false);
      toast({
        title: "Reset email sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Login Modal */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md" data-testid="modal-login">
              <DialogHeader>
                <DialogTitle className="text-center text-2xl font-bold">Welcome Back</DialogTitle>
                <p className="text-center text-muted-foreground">Sign in to your account</p>
              </DialogHeader>
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="Enter your email"
                    required
                    data-testid="input-email-login"
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="Enter your password"
                    required
                    data-testid="input-password-login"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                      data-testid="checkbox-remember-me"
                    />
                    <Label htmlFor="remember-me" className="text-sm">Remember me</Label>
                  </div>
                  <Button 
                    type="button"
                    variant="link" 
                    className="p-0 h-auto text-sm"
                    onClick={() => {
                      setIsLoginOpen(false);
                      setIsForgotPasswordOpen(true);
                    }}
                    data-testid="button-forgot-password"
                  >
                    Forgot password?
                  </Button>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                  data-testid="button-signin"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-background text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  data-testid="button-google-signin"
                >
                  <i className="fab fa-google text-red-500 mr-2"></i>
                  Sign in with Google
                </Button>
              </form>
              <div className="text-center mt-6">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Button 
                  variant="link" 
                  className="p-0 h-auto"
                  onClick={() => {
                    setIsLoginOpen(false);
                    setIsSignupOpen(true);
                  }}
                  data-testid="button-switch-signup"
                >
                  Sign up
                </Button>
              </div>
        </DialogContent>
      </Dialog>

      {/* Signup Modal */}
      <Dialog open={isSignupOpen} onOpenChange={setIsSignupOpen}>
        <DialogContent className="sm:max-w-md" data-testid="modal-signup">
              <DialogHeader>
                <DialogTitle className="text-center text-2xl font-bold">Create Account</DialogTitle>
                <p className="text-center text-muted-foreground">Join thousands of learners</p>
              </DialogHeader>
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first-name">First Name</Label>
                    <Input
                      id="first-name"
                      value={signupForm.firstName}
                      onChange={(e) => setSignupForm({ ...signupForm, firstName: e.target.value })}
                      placeholder="John"
                      required
                      data-testid="input-first-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input
                      id="last-name"
                      value={signupForm.lastName}
                      onChange={(e) => setSignupForm({ ...signupForm, lastName: e.target.value })}
                      placeholder="Doe"
                      required
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                    data-testid="input-email-signup"
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    placeholder="Create a strong password"
                    required
                    data-testid="input-password-signup"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={signupForm.confirmPassword}
                    onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                    placeholder="Confirm your password"
                    required
                    data-testid="input-confirm-password"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" required data-testid="checkbox-terms" />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the{" "}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-primary"
                      onClick={() => setLocation("/terms")}
                      data-testid="link-terms-signup"
                    >
                      Terms of Service
                    </Button>{" "}
                    and{" "}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-primary"
                      onClick={() => setLocation("/privacy")}
                      data-testid="link-privacy-signup"
                    >
                      Privacy Policy
                    </Button>
                  </Label>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                  data-testid="button-create-account"
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-background text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  data-testid="button-google-signup"
                >
                  <i className="fab fa-google text-red-500 mr-2"></i>
                  Sign up with Google
                </Button>
              </form>
              <div className="text-center mt-6">
                <span className="text-muted-foreground">Already have an account? </span>
                <Button 
                  variant="link" 
                  className="p-0 h-auto"
                  onClick={() => {
                    setIsSignupOpen(false);
                    setIsLoginOpen(true);
                  }}
                  data-testid="button-switch-signin"
                >
                  Sign in
                </Button>
              </div>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Modal */}
      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md" data-testid="modal-forgot-password">
              <DialogHeader>
                <DialogTitle className="text-center text-2xl font-bold">Reset Password</DialogTitle>
                <p className="text-center text-muted-foreground">Enter your email to receive reset instructions</p>
              </DialogHeader>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    data-testid="input-email-forgot"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                  data-testid="button-send-reset"
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
              <div className="text-center mt-6">
                <Button 
                  variant="link"
                  onClick={() => {
                    setIsForgotPasswordOpen(false);
                    setIsLoginOpen(true);
                  }}
                  data-testid="button-back-signin"
                >
                  Back to Sign In
                </Button>
              </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
