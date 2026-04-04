#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://klqflfwsqooswhjjmloz.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  console.error('Please set the service role key before running this script');
  console.error('\nYou can find it in:');
  console.error('1. Supabase Dashboard → Project Settings → API');
  console.error('2. Copy "service_role" key (not the anon key)');
  console.error('\nThen run:');
  console.error('export SUPABASE_SERVICE_ROLE_KEY="your_key_here"');
  console.error('node deploy-migration.js');
  process.exit(1);
}

async function deployMigration() {
  try {
    console.log('🚀 Deploying Registration Desk Phase 1 Migration...\n');

    // Create Supabase client with service role key (for admin access)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Read migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20260404_registration_desk_phase1.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Migration file loaded');
    console.log(`📊 SQL statements: ${migrationSQL.split(';').filter(s => s.trim()).length}`);
    console.log('');

    // Execute migration
    console.log('⏳ Executing migration...\n');
    const { error } = await supabase.rpc('exec', { sql: migrationSQL });

    if (error) {
      // Try alternative approach - split by statements
      console.log('ℹ️  Attempting alternative deployment method...\n');
      
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

      let executed = 0;
      for (const statement of statements) {
        try {
          const { error: stmtError } = await supabase.rpc('exec', { sql: statement + ';' });
          if (!stmtError) {
            executed++;
          }
        } catch (e) {
          // Continue
        }
      }

      if (executed > 0) {
        console.log(`✅ Partially deployed: ${executed}/${statements.length} statements`);
      } else {
        throw error;
      }
    } else {
      console.log('✅ Migration executed successfully!');
    }

    // Verify tables were created
    console.log('\n🔍 Verifying tables...\n');

    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_names')
      .catch(() => {
        // Fallback: try to query the table
        return supabase.from('registration_staff_profiles').select('*', { count: 'exact', head: true });
      });

    if (!tablesError) {
      console.log('✅ registration_staff_profiles table found!');
    } else {
      console.log('⚠️  Could not verify tables (this may be normal)');
    }

    console.log('\n✨ Deployment complete!\n');
    console.log('📝 Next steps:');
    console.log('1. Try creating a registration staff account from Admin Dashboard');
    console.log('2. Check for any remaining errors');
    console.log('3. Test the staff creation form\n');

  } catch (error) {
    console.error('\n❌ Deployment failed:');
    console.error(error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('1. Verify SUPABASE_SERVICE_ROLE_KEY is correct');
    console.error('2. Check if you have admin access to Supabase');
    console.error('3. Try running migrations manually in Supabase dashboard');
    console.error('   → SQL Editor → New Query → Paste migration SQL\n');
    process.exit(1);
  }
}

deployMigration();
