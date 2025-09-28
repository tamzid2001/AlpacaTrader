import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { getEnhancedSessionConfig, sessionSecurity, manageConcurrentSessions } from "./middleware/sessionManagement";
import { authLimiter, progressiveBackoff, checkAccountLock } from "./middleware/rateLimiting";
import { auditAuthEvent, detectSuspiciousActivity } from "./middleware/authAudit";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  const userData = {
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  };

  // Grant immediate admin access to tamzid257@gmail.com
  if (claims["email"] === 'tamzid257@gmail.com') {
    userData.role = 'admin';
    userData.isApproved = true;
  }

  try {
    await storage.upsertUser(userData);
    console.log('Successfully upserted user:', userData.id, userData.email);
  } catch (error) {
    console.error('Error upserting user:', error);
    throw error;
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Get domains from environment variable
  const domains = process.env.REPLIT_DOMAINS!.split(",");
  
  // Add localhost for development testing
  if (process.env.NODE_ENV === 'development') {
    domains.push('localhost');
  }
  
  console.log('Setting up auth for domains:', domains);

  for (const domain of domains) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    const strategy = `replitauth:${req.hostname}`;
    console.log('Login attempt with strategy:', strategy, 'hostname:', req.hostname);
    passport.authenticate(strategy, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    const strategy = `replitauth:${req.hostname}`;
    console.log('Callback with strategy:', strategy, 'hostname:', req.hostname);
    passport.authenticate(strategy, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href
        );
      });
    });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // DEVELOPMENT BYPASS: Allow testing without full OAuth authentication
  if (process.env.NODE_ENV === 'development') {
    // If already authenticated normally, proceed
    if (req.isAuthenticated() && req.user) {
      const user = req.user as any;
      if (user.expires_at) {
        const now = Math.floor(Date.now() / 1000);
        if (now <= user.expires_at) {
          return next();
        }
      }
    }

    // Development bypass: Simulate authenticated dev user
    console.log('🧪 Development authentication bypass activated');
    const devUser = {
      claims: {
        sub: "dev-test-admin-id",
        email: "dev.test@example.com",
        first_name: "Dev",
        last_name: "Tester",
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      },
      access_token: 'dev-test-token',
      refresh_token: 'dev-test-refresh',
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    };

    // Simulate authenticated request
    (req as any).user = devUser;
    return next();
  }

  // PRODUCTION AUTHENTICATION: Standard OAuth flow
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};