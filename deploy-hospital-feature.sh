#!/bin/bash

# Hospital Selection Feature - Quick Deployment Script
# This script applies all hospital-related migrations to your Supabase database

echo "=================================================="
echo "Hospital Selection Feature - Deployment"
echo "=================================================="
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI not found"
    echo "Install it first: npm install -g supabase"
    exit 1
fi

echo "✓ Supabase CLI found"
echo ""

# Check if linked to a project
if [ ! -f .supabase/config.toml ]; then
    echo "⚠️  Not linked to a Supabase project"
    echo "Run: supabase link --project-ref YOUR_PROJECT_REF"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "=================================================="
echo "Migrations to be applied:"
echo "=================================================="
echo "1. 20260403_create_hospitals_table.sql"
echo "   → Creates hospitals table with RLS policies"
echo ""
echo "2. 20260403_add_hospital_to_staff.sql"
echo "   → Adds hospital_id to staff_profiles"
echo ""
echo "3. 20260403_add_hospital_to_tokens.sql"
echo "   → Adds hospital_id to tokens table"
echo ""
echo "4. 20260403_update_token_rls_hospital.sql"
echo "   → Updates RLS policies for hospital scoping"
echo ""
echo "5. 20260403_migrate_hospital_data.sql"
echo "   → Copies data from 'State wise hospitals' table"
echo ""

read -p "Apply these migrations? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 1
fi

echo ""
echo "Applying migrations..."
echo ""

# Apply migrations
supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================================="
    echo "✅ Migrations Applied Successfully!"
    echo "=================================================="
    echo ""
    echo "Next steps:"
    echo "1. Verify hospital data:"
    echo "   SELECT COUNT(*) FROM public.hospitals;"
    echo ""
    echo "2. Assign staff to hospitals:"
    echo "   UPDATE staff_profiles"
    echo "   SET hospital_id = (SELECT id FROM hospitals WHERE hospital_name = 'Your Hospital')"
    echo "   WHERE user_id = 'staff_user_id';"
    echo ""
    echo "3. Test the application:"
    echo "   • Patient registration → Hospital selection"
    echo "   • Token creation → Verify hospital_id"
    echo "   • Doctor login → Verify filtered queue"
    echo ""
    echo "📚 Full documentation in:"
    echo "   ~/.copilot/session-state/.../files/DEPLOYMENT_GUIDE.md"
    echo ""
else
    echo ""
    echo "=================================================="
    echo "❌ Migration Failed"
    echo "=================================================="
    echo ""
    echo "Troubleshooting:"
    echo "1. Check if you're logged in: supabase login"
    echo "2. Check if project is linked: supabase link"
    echo "3. Check error messages above"
    echo ""
    exit 1
fi
