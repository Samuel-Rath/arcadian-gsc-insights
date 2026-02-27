# Claude Model Testing Guide

Your API key is having trouble finding the right Claude model. Follow these steps to find one that works:

## Step 1: Stop the Current Server

In your terminal, press `Ctrl+C` to stop the dev server if it's running.

## Step 2: Try Different Models

Edit `.env.local` and try these models one at a time:

### Option 1: Claude 3 Opus (Most Capable)
```bash
ANTHROPIC_MODEL=claude-3-opus-20240229
```

### Option 2: Claude 3 Sonnet (Balanced) - CURRENT
```bash
ANTHROPIC_MODEL=claude-3-sonnet-20240229
```

### Option 3: Claude 3 Haiku (Fastest)
```bash
ANTHROPIC_MODEL=claude-3-haiku-20240307
```

### Option 4: Claude 2.1 (Older, More Compatible)
```bash
ANTHROPIC_MODEL=claude-2.1
```

### Option 5: Claude 2.0 (Fallback)
```bash
ANTHROPIC_MODEL=claude-2.0
```

## Step 3: Restart Server After Each Change

```bash
cd arcadian-gsc-insights
npm run dev
```

## Step 4: Test Insights

1. Open http://localhost:3000
2. Click "Generate Insights"
3. If it works, you're done!
4. If it fails, try the next model option

## Step 5: Check Your API Key Access

If none of the models work, your API key might not have access to Claude models yet. 

**Check your Anthropic Console:**
1. Go to https://console.anthropic.com/
2. Check your API key settings
3. Verify which models you have access to
4. You might need to:
   - Add credits to your account
   - Upgrade your plan
   - Request access to specific models

## Current Configuration

Your `.env.local` is currently set to:
```bash
ANTHROPIC_MODEL=claude-3-sonnet-20240229
```

## Quick Test Command

After changing the model and restarting, you can test from the browser console:

```javascript
fetch('/api/insights', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    startDate: '2025-10-01',
    endDate: '2026-01-26'
  })
})
.then(r => r.json())
.then(console.log)
```

This will show you the exact error if it fails.

## Success Indicators

When it works, you'll see:
- ✅ Insights appear in the UI
- ✅ No error messages
- ✅ Server logs show: `POST /api/insights 200`

## Failure Indicators

If it's still failing:
- ❌ "Failed to generate insights" error
- ❌ Server logs show: `POST /api/insights 500`
- ❌ Error mentions "not_found_error" or "model:"

---

**Need Help?** 

The most common issue is that your API key doesn't have access to the newer Claude 3 models yet. Try `claude-2.1` or `claude-2.0` as they're more widely available.
