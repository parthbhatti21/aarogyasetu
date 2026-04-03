#!/bin/bash

# Script to apply doctor specialty changes to the database
# This adds the specialty field to staff_profiles and sets up auto-assignment

echo "Applying doctor specialty changes..."

# Read Supabase credentials from .env
if [ ! -f .env ]; then
    echo "Error: .env file not found"
    exit 1
fi

# Note: To apply these changes, you can:
# 1. Run this SQL in the Supabase SQL Editor
# 2. Or use the Supabase CLI: supabase db execute -f supabase/migrations/20260403_add_doctor_specialty.sql

cat << 'EOF'

To apply the doctor specialty changes:

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Run the following SQL:

-- Add specialty column to staff_profiles
ALTER TABLE staff_profiles 
ADD COLUMN IF NOT EXISTS specialty VARCHAR(50);

-- Update existing doctors to have 'general' specialty if not set  
UPDATE staff_profiles 
SET specialty = 'general' 
WHERE role IN ('doctor', 'senior_doctor') 
AND specialty IS NULL;

-- Create index for faster specialty-based queries
CREATE INDEX IF NOT EXISTS idx_staff_profiles_specialty 
ON staff_profiles(specialty) 
WHERE role IN ('doctor', 'senior_doctor');

4. The auto-assignment logic is now integrated in the frontend
   - When patients create tokens, doctors are automatically assigned
   - Assignment is based on matching complaint type to doctor specialty
   - Prioritizes specialist doctors, then senior doctors, then by workload

EOF
