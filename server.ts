import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OAUTH_CONFIGS: Record<string, any> = {
  facebook: {
    auth: "https://www.facebook.com/v12.0/dialog/oauth",
    token: "https://graph.facebook.com/v12.0/oauth/access_token",
    scopes: "public_profile,email,pages_manage_posts,instagram_basic",
  },
  linkedin: {
    auth: "https://www.linkedin.com/oauth/v2/authorization",
    token: "https://www.linkedin.com/oauth/v2/accessToken",
    scopes: "r_liteprofile r_emailaddress w_member_social",
  },
  twitter: {
    auth: "https://twitter.com/i/oauth2/authorize",
    token: "https://api.twitter.com/2/oauth2/token",
    scopes: "tweet.read tweet.write users.read offline.access",
  },
  tiktok: {
    auth: "https://www.tiktok.com/v2/auth/authorize/",
    token: "https://open.tiktokapis.com/v2/oauth/token/",
    scopes: "user.info.basic,video.upload,video.list",
  },
  google: {
    auth: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    scopes: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/gmail.send",
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // 1. Endpoint to get the OAuth Authorization URL
  app.get("/api/auth/url", (req, res) => {
    const { platform, userId } = req.query;
    const config = OAUTH_CONFIGS[platform as string];

    if (!config) {
      return res.status(400).json({ error: "Unsupported platform" });
    }

    const redirectUri = `${process.env.APP_URL}/auth/callback`;
    const clientId = process.env[`${(platform as string).toUpperCase()}_CLIENT_ID`];

    if (!clientId) {
      return res.status(500).json({ error: `Missing CLIENT_ID for ${platform}. Please configure it in AI Studio Secrets.` });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: config.scopes,
      state: JSON.stringify({ platform, userId }),
    });

    // Twitter specific requirements for OAuth2
    if (platform === "twitter") {
      params.append("code_challenge", "challenge"); // Mocking for demo, real one needs PKCE
      params.append("code_challenge_method", "plain");
    }

    res.json({ url: `${config.auth}?${params.toString()}` });
  });

  // 2. Callback handler for OAuth redirects
  app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).send("Invalid callback parameters");
    }

    try {
      const { platform, userId } = JSON.parse(state as string);
      const config = OAUTH_CONFIGS[platform];
      const clientId = process.env[`${platform.toUpperCase()}_CLIENT_ID`];
      const clientSecret = process.env[`${platform.toUpperCase()}_CLIENT_SECRET`];
      const redirectUri = `${process.env.APP_URL}/auth/callback`;

      // Exchange code for token
      const tokenResponse = await axios.post(config.token, new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code: code as string,
        redirect_uri: redirectUri,
        grant_type: "authorization_type" in config ? config.grant_type : "authorization_code",
      }).toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });

      const tokens = tokenResponse.data;

      // In a real app, we would store this tokens object in Firestore using firebase-admin here
      // But since we are simplifying for the environment, we'll send it back to the client to save
      
      res.send(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8fafc;">
            <div style="text-align: center; background: white; padding: 2rem; border-radius: 1.5rem; shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
              <h2 style="color: #4f46e5;">Connection Successful</h2>
              <p style="color: #64748b;">Finishing up... this window will close automatically.</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ 
                    type: 'OAUTH_AUTH_SUCCESS', 
                    platform: '${platform}',
                    tokens: ${JSON.stringify(tokens)}
                  }, '*');
                  setTimeout(() => window.close(), 1000);
                } else {
                  window.location.href = '/';
                }
              </script>
            </div>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("OAuth callback error:", error.response?.data || error.message);
      res.status(500).send(`Authentication failed: ${error.message}`);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
