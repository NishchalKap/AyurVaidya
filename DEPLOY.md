# 🚀 Vercel Deployment Guide

Your project is now Vercel-ready! Follow these steps to deploy.

## 1. Install Vercel CLI
If you haven't already:
```bash
npm install -g vercel
```

## 2. Deploy
Run the following command in your project root:
```bash
vercel
```
-   **Set up and deploy?** [Y]
-   **Which scope?** [Select your account]
-   **Link to existing project?** [N]
-   **Project Name:** `ayurvaidya` (or your choice)
-   **In which directory is your code located?** `./` (Press Enter)
-   **Want to modify these settings?** [N]

## 3. Configure Environment Variables
Once linked, go to your Vercel Project Settings on the web dashboard (or use CLI).
Add the following variables:
-   `OPENAI_API_KEY`: (Your Key)
-   `SUPABASE_URL`: (Your URL)
-   `SUPABASE_ANON_KEY`: (Your Key)

*If you skip this, the app will still work in "Safe Stub Mode" (Mock DB + Stub AI).*

## 4. Production Deploy
After checking the preview:
```bash
vercel --prod
```

## ✅ Verification
1.  Open the deployment URL.
2.  You should see the Home Page (served from `/public`).
3.  Click "Login" (Demo) -> Works.
4.  Chat with AI -> Works (via `api/v1/chat/message`).
