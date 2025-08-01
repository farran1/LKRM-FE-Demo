# GitHub Pages Deployment Guide

This guide will help you deploy your Next.js demo to GitHub Pages.

## Prerequisites

1. A GitHub account
2. Git installed on your local machine
3. Node.js and npm/yarn installed

## Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right corner and select "New repository"
3. Name your repository (e.g., `big-test` or `demo-dashboard`)
4. Make it **Public** (required for GitHub Pages)
5. Don't initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 2: Push Your Code to GitHub

Run these commands in your project directory:

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit the changes
git commit -m "Initial commit for GitHub Pages deployment"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

**Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name.**

## Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on "Settings" tab
3. Scroll down to "Pages" section in the left sidebar
4. Under "Source", select "GitHub Actions"
5. The deployment will start automatically when you push to the main branch

## Step 4: Configure GitHub Pages Settings

1. In your repository settings, go to "Pages"
2. Make sure "Source" is set to "GitHub Actions"
3. The site will be available at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME`

## Step 5: Test the Deployment

1. Make a small change to your code
2. Commit and push the changes:
   ```bash
   git add .
   git commit -m "Test deployment"
   git push
   ```
3. Go to the "Actions" tab in your GitHub repository to monitor the deployment
4. Once the workflow completes, your site will be live

## Troubleshooting

### Common Issues:

1. **Build fails**: Check the Actions tab for error messages
2. **Site not loading**: Make sure the repository is public
3. **Base path issues**: The `basePath` in `next.config.ts` should match your repository name
4. **404 errors**: Make sure all your pages are compatible with static export

### Manual Deployment (if needed):

If the automatic deployment doesn't work, you can deploy manually:

```bash
# Build the project
npm run build

# The static files will be in the `out` directory
# You can then upload these files to any static hosting service
```

## Notes

- The site will be available at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME`
- Any changes pushed to the main branch will automatically trigger a new deployment
- The first deployment might take a few minutes
- Make sure all your API calls work with the base path configuration

## Custom Domain (Optional)

If you want to use a custom domain:

1. Go to repository Settings > Pages
2. Enter your custom domain in the "Custom domain" field
3. Update the `basePath` in `next.config.ts` to match your domain
4. Add a CNAME file to your `public` directory with your domain name 