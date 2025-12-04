# Deployment Guide

## Overview

This app is automatically deployed to Firebase Hosting whenever code is pushed to the `main` branch on GitHub.

- **Live URL**: https://shop-promotion-manager.web.app
- **GitHub Repository**: https://github.com/Amikashkash/fish-stock-list
- **Firebase Project**: shop-promotion-manager

## Initial Setup (One-time)

### 1. Firebase Service Account

Generate a service account key for GitHub Actions:

```bash
firebase login
firebase projects:list
```

Create a service account in Firebase Console:
1. Go to: https://console.firebase.google.com/project/shop-promotion-manager/settings/serviceaccounts/adminsdk
2. Click "Generate new private key"
3. Save the JSON file securely

### 2. GitHub Secrets

Add the following secrets to your GitHub repository:
https://github.com/Amikashkash/fish-stock-list/settings/secrets/actions

#### Required Secrets:

1. **FIREBASE_SERVICE_ACCOUNT**
   - Paste the entire content of the service account JSON file

2. **Firebase Environment Variables** (from .env.local):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`

## Automated Deployment

### How it Works

The deployment workflow (`.github/workflows/deploy.yml`) automatically:

1. **Triggers** on every push to `main` branch
2. **Installs** dependencies
3. **Builds** the production app with environment variables
4. **Deploys** to Firebase Hosting

### Manual Deployment

You can also deploy manually:

```bash
# Build the app
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

## Monitoring

- **Firebase Console**: https://console.firebase.google.com/project/shop-promotion-manager
- **GitHub Actions**: https://github.com/Amikashkash/fish-stock-list/actions
- **Hosting Dashboard**: https://console.firebase.google.com/project/shop-promotion-manager/hosting

## Rollback

If you need to rollback to a previous version:

1. Go to Firebase Console → Hosting
2. Select the version you want to rollback to
3. Click "Rollback"

Or use CLI:

```bash
firebase hosting:clone shop-promotion-manager:PREVIOUS_VERSION shop-promotion-manager:live
```

## Environment Variables

**Production** (Firebase Hosting):
- Set via GitHub Secrets
- Injected during build in GitHub Actions

**Development** (Local):
- Stored in `.env.local` (git-ignored)
- Loaded automatically by Vite

## Troubleshooting

### Build Fails

- Check GitHub Actions logs
- Verify all secrets are set correctly
- Check Firebase project permissions

### Deploy Fails

- Verify Firebase service account has necessary permissions
- Check Firebase project is active
- Ensure hosting is enabled in Firebase Console

### Environment Variables Not Working

- Ensure all `VITE_*` secrets are set in GitHub
- Variables must be prefixed with `VITE_` for Vite to include them
- Rebuild after changing environment variables
