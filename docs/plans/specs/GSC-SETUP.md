# GSC Export Setup Guide

Step-by-step instructions for configuring automated Google Search Console data export.

## Prerequisites

- A Google account with access to Google Search Console for `loreai.dev`
- Access to Google Cloud Console

## Step 1: Create a Google Cloud Project (or use existing)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note the project ID

## Step 2: Enable the Search Console API

1. In Cloud Console, go to **APIs & Services → Library**
2. Search for "Google Search Console API"
3. Click **Enable**

## Step 3: Create a Service Account

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → Service Account**
3. Name: `loreai-gsc-export` (or similar)
4. Click **Create and Continue**
5. Skip the optional role/user access steps
6. Click **Done**

## Step 4: Download the JSON Key

1. Click on the newly created service account
2. Go to the **Keys** tab
3. Click **Add Key → Create new key → JSON**
4. Download the file
5. Copy it to the VPS:
   ```bash
   scp ~/Downloads/your-key-file.json loreai:/home/ubuntu/loreai-v2/config/gsc-service-account.json
   ```

## Step 5: Add Service Account to GSC

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select the `loreai.dev` property
3. Go to **Settings → Users and permissions**
4. Click **Add user**
5. Enter the service account email (from the JSON key file, `client_email` field)
6. Set permission to **Restricted** (read-only is sufficient)
7. Click **Add**

## Step 6: Verify on VPS

```bash
ssh loreai
cd /home/ubuntu/loreai-v2

# Verify the key file is in place
ls -la config/gsc-service-account.json

# Test with dry-run
npx tsx scripts/gsc-export.ts --dry-run

# Real run
npx tsx scripts/gsc-export.ts
```

## Step 7: Set Up Cron (Weekly)

```bash
# Edit crontab
crontab -e

# Add weekly export — Sunday at 6am SGT (Saturday 22:00 UTC)
0 22 * * 6 cd /home/ubuntu/loreai-v2 && /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh gsc-export >> logs/gsc-export.log 2>&1
```

## Alternative: Custom Key Path

If the key file is stored elsewhere, set the environment variable:

```bash
export GSC_SERVICE_ACCOUNT_KEY_PATH=/path/to/your/key.json
npx tsx scripts/gsc-export.ts
```

## Fallback: Manual CSV Upload

If GSC API setup is not ready, the planner still works with manually exported CSVs:

1. Export from GSC web UI → download CSV
2. Copy to VPS: `scp export.csv loreai:/home/ubuntu/loreai-v2/data/gsc-exports/latest.csv`
3. Run planner: `npx tsx scripts/planner.ts --cluster=claude-code`
