# Supabase Edge Functions Deployment Guide

## Prerequisites
- Supabase CLI installed: `npm install -g supabase`
- Supabase account and project

## Setup

### 1. Login to Supabase CLI
```bash
supabase login
```

### 2. Link to Your Project
```bash
supabase link --project-ref klqflfwsqooswhjjmloz
```

### 3. Set Cohere API Key as Secret
```bash
supabase secrets set COHERE_API_KEY=eeW4xQr5CnWGYdRsyAyQ072sHhUU1TFPZ9ZAkufa
```

### 4. Deploy the Edge Function
```bash
supabase functions deploy cohere-chat
```

## Testing the Edge Function

### Test Locally (Optional)
```bash
# Start local Supabase
supabase start

# Serve functions locally
supabase functions serve cohere-chat --env-file ./supabase/.env.local

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/cohere-chat' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "message": "Hello, I need help with registration",
    "language": "en",
    "sessionId": "test-session-123"
  }'
```

### Test in Production
```bash
curl -i --location --request POST 'https://klqflfwsqooswhjjmloz.supabase.co/functions/v1/cohere-chat' \
  --header 'Authorization: Bearer sb_publishable_FfPVSDnVJOZC2EnJ2r78kA_USz5KpHm' \
  --header 'Content-Type: application/json' \
  --data '{
    "message": "नमस्ते, मुझे पंजीकरण में मदद चाहिए",
    "language": "hi",
    "sessionId": "test-session-456"
  }'
```

## Edge Function API

### Endpoint
```
POST https://klqflfwsqooswhjjmloz.supabase.co/functions/v1/cohere-chat
```

### Headers
```
Authorization: Bearer <SUPABASE_ANON_KEY>
Content-Type: application/json
```

### Request Body
```typescript
{
  message: string;                    // User's message
  conversationHistory?: Array<{       // Optional: previous messages
    role: string;                     // 'user' or 'assistant'
    message: string;
  }>;
  language?: string;                  // 'en' or 'hi' (default: 'en')
  sessionId?: string;                 // Optional: for logging to DB
}
```

### Response
```typescript
{
  success: boolean;
  message: string;                    // AI response
  sessionId: string;
  metadata: {
    finishReason: string;
    citations?: any[];
  }
}
```

## Monitoring

### View Logs
```bash
# View function logs
supabase functions logs cohere-chat

# Follow logs in real-time
supabase functions logs cohere-chat --follow
```

### View in Dashboard
- Go to https://app.supabase.com/project/klqflfwsqooswhjjmloz/functions
- Click on `cohere-chat` function
- View logs, metrics, and invocations

## Troubleshooting

### Error: "COHERE_API_KEY not configured"
```bash
# Verify secrets are set
supabase secrets list

# Re-set the secret
supabase secrets set COHERE_API_KEY=eeW4xQr5CnWGYdRsyAyQ072sHhUU1TFPZ9ZAkufa
```

### Error: "Unauthorized"
- Ensure you're passing the correct Supabase anon key in Authorization header
- Verify the user is authenticated via Supabase Auth

### Error: "Cohere API error: 401"
- Check if the Cohere API key is valid
- Verify the key has sufficient credits

## Security Notes

✅ **API Key is Secure**: The Cohere API key is stored as a Supabase secret and never exposed to clients
✅ **Authentication Required**: All requests must include valid Supabase auth token
✅ **CORS Configured**: Only your domains can call this function (configure in Supabase dashboard if needed)

## Next Steps

1. **Configure Auth**: Set up Email OTP in Supabase Dashboard
2. **Test Integration**: Call the function from your React app
3. **Monitor Usage**: Track Cohere API usage and costs
4. **Optimize**: Adjust temperature, max_tokens based on response quality
