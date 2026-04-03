#!/bin/bash
# Quick setup script for Phase 5: Notifications

set -e

echo "🚀 Setting up Notifications System for Aarogya Setu"
echo "=================================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "📦 Install it with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if user is logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase"
    echo "🔑 Login with: supabase login"
    exit 1
fi

echo "✅ Logged in to Supabase"
echo ""

# Ask for Gmail credentials
echo "📧 Gmail SMTP Configuration"
echo "----------------------------"
read -p "Enter your Gmail address: " GMAIL_EMAIL
echo ""
echo "🔒 App Password Instructions:"
echo "1. Go to https://myaccount.google.com/security"
echo "2. Enable 2-Step Verification"
echo "3. Go to 'App passwords'"
echo "4. Generate password for 'Aarogya Setu'"
echo ""
read -sp "Enter Gmail App Password (16 characters): " GMAIL_APP_PASSWORD
echo ""
echo ""

# Validate inputs
if [ -z "$GMAIL_EMAIL" ] || [ -z "$GMAIL_APP_PASSWORD" ]; then
    echo "❌ Gmail credentials cannot be empty"
    exit 1
fi

# Set Supabase secrets
echo "🔐 Setting Supabase secrets..."
supabase secrets set GMAIL_EMAIL="$GMAIL_EMAIL" --project-ref "$(supabase projects list | grep -v ID | awk '{print $1}' | head -1)"
supabase secrets set GMAIL_APP_PASSWORD="$GMAIL_APP_PASSWORD" --project-ref "$(supabase projects list | grep -v ID | awk '{print $1}' | head -1)"
echo "✅ Secrets configured"
echo ""

# Run migrations
echo "📊 Running database migrations..."
if [ -f "supabase/migrations/20260403_create_notifications.sql" ]; then
    supabase db push
    echo "✅ Database migrations applied"
else
    echo "⚠️  Migration file not found. Please apply manually:"
    echo "   supabase/migrations/20260403_create_notifications.sql"
fi
echo ""

# Deploy edge function
echo "⚡ Deploying email-notification edge function..."
if [ -d "supabase/functions/email-notification" ]; then
    supabase functions deploy email-notification
    echo "✅ Edge function deployed"
else
    echo "⚠️  Edge function directory not found"
fi
echo ""

# Test the setup
echo "🧪 Testing email notification..."
read -p "Enter test email address (press Enter to skip): " TEST_EMAIL

if [ ! -z "$TEST_EMAIL" ]; then
    echo "Sending test email to $TEST_EMAIL..."
    
    ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}')
    FUNCTION_URL=$(supabase status | grep "API URL" | awk '{print $3}')/functions/v1/email-notification
    
    curl -i --location --request POST "$FUNCTION_URL" \
      --header "Authorization: Bearer $ANON_KEY" \
      --header 'Content-Type: application/json' \
      --data "{
        \"to\": \"$TEST_EMAIL\",
        \"subject\": \"Test Notification - Aarogya Setu\",
        \"body\": \"This is a test email from the Aarogya Setu notification system.\",
        \"patient_name\": \"Test User\",
        \"notification_type\": \"General\"
      }"
    
    echo ""
    echo "✅ Test email sent! Check your inbox."
else
    echo "⏭️  Skipping test email"
fi

echo ""
echo "=================================================="
echo "✨ Setup Complete!"
echo "=================================================="
echo ""
echo "📚 Next Steps:"
echo "1. Check your email for test notification"
echo "2. Review NOTIFICATIONS_SETUP.md for usage examples"
echo "3. Integrate notifications into your app workflows"
echo ""
echo "🔗 Useful Commands:"
echo "  - View logs: supabase functions logs email-notification"
echo "  - List secrets: supabase secrets list"
echo "  - Deploy again: supabase functions deploy email-notification"
echo ""
