# Deploying to Vercel

This guide will help you deploy Peacock GenAI to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Your OpenAI API key (or other LLM provider credentials)

## Deployment Steps

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Follow the prompts to link your project

### Option 2: Deploy via GitHub

1. Push your code to GitHub

2. Go to https://vercel.com/new

3. Import your GitHub repository

4. Configure environment variables (see below)

5. Click "Deploy"

## Environment Variables

Set these in your Vercel project settings (Settings → Environment Variables):

### Required:
- `OPENAI_API_KEY` - Your OpenAI API key

### Optional (with defaults):
- `OPENAI_MODEL` - Model name (default: `gpt-4o-mini`)
- `OPENAI_TEMPERATURE` - Temperature (default: `0.1`)
- `AGENT_MAX_TOKENS` - Max tokens (default: `1000`)
- `AGENT_TIMEOUT` - Timeout in seconds (default: `30`)
- `PORT` - Server port (Vercel sets this automatically)

## Important Notes

1. **Serverless Functions**: Vercel runs your app as serverless functions. The agent instance will be created per request in serverless mode.

2. **Cold Starts**: First request may be slower due to cold starts. Consider using Vercel Pro for better performance.

3. **Function Timeout**: Default timeout is 10 seconds on Hobby plan, 60 seconds on Pro. Adjust `AGENT_TIMEOUT` accordingly.

4. **Environment Variables**: Make sure all required environment variables are set in Vercel dashboard.

5. **Static Files**: The chat interface (`public/index.html`) will be served automatically.

## Troubleshooting

- **Build Errors**: Check that all dependencies are in `package.json`
- **Runtime Errors**: Check Vercel function logs in the dashboard
- **Timeout Issues**: Increase `AGENT_TIMEOUT` or upgrade to Vercel Pro
- **API Key Issues**: Verify environment variables are set correctly

## Post-Deployment

After deployment, your app will be available at:
- Production: `https://your-project.vercel.app`
- Preview: `https://your-project-git-branch.vercel.app`

Visit the root URL to access the chat interface!

