#!/usr/bin/env node

const { pool } = require('./db/connection.js');
const fs = require('fs');
const path = require('path');

async function runSingleMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running migration to fix campaigns created_at column...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'db', 'migrations', 'add_campaigns_created_at.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await client.query('BEGIN');
    try {
      await client.query(migrationSQL);
      await client.query('COMMIT');
      console.log('✅ Migration completed successfully - campaigns table now has created_at column');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function testSchemaFix() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Testing if created_at column exists in campaigns table...');
    
    // Test if the column exists by querying it
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'campaigns' 
      AND column_name = 'created_at' 
      AND table_schema = 'public'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ created_at column exists in campaigns table');
      
      // Test the problematic view query
      const viewTest = await client.query(`
        SELECT c.id, c.title, c.created_at 
        FROM campaigns c 
        LIMIT 1
      `);
      
      console.log('✅ Query with created_at column works successfully');
      return true;
    } else {
      console.log('❌ created_at column does not exist in campaigns table');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Schema test failed:', error.message);
    return false;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    // First test if the column already exists
    const columnExists = await testSchemaFix();
    
    if (!columnExists) {
      // Run the migration
      await runSingleMigration();
      
      // Test again after migration
      await testSchemaFix();
    }
    
    console.log('🎉 Schema fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Schema fix failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}