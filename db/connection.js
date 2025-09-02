const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const config = require('../app.config.js');

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: config.database.url,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  max: config.database.maxConnections || 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully at:', result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Run database migrations
async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running database migrations...');
    
    // Get migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    // Check which migrations have been applied
    const appliedMigrations = await client.query(
      'SELECT version FROM schema_migrations ORDER BY version'
    ).catch(() => ({ rows: [] }));
    
    const appliedVersions = new Set(appliedMigrations.rows.map(row => row.version));
    
    // Run pending migrations
    for (const file of migrationFiles) {
      const version = file.replace('.sql', '').replace(/^\d+_/, '').replace('_', '');
      const fileVersion = file.split('_')[0];
      
      if (!appliedVersions.has(fileVersion)) {
        console.log(`📄 Running migration: ${file}`);
        
        const migrationSQL = fs.readFileSync(
          path.join(migrationsDir, file), 
          'utf8'
        );
        
        await client.query('BEGIN');
        try {
          await client.query(migrationSQL);
          await client.query('COMMIT');
          console.log(`✅ Migration ${file} completed successfully`);
        } catch (error) {
          await client.query('ROLLBACK');
          throw new Error(`Migration ${file} failed: ${error.message}`);
        }
      } else {
        console.log(`⏭️  Migration ${file} already applied`);
      }
    }
    
    console.log('✅ All migrations completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Create database if it doesn't exist (Supabase databases are pre-created)
async function createDatabase() {
  try {
    // For Supabase, database already exists, just test connection
    const connected = await testConnection();
    if (connected) {
      console.log('✅ Database connection verified (Supabase)');
    } else {
      throw new Error('Failed to connect to Supabase database');
    }
  } catch (error) {
    console.error('❌ Database creation failed:', error.message);
    throw error;
  }
}

// Initialize database (create + migrate)
async function initializeDatabase() {
  try {
    await createDatabase();
    await testConnection();
    await runMigrations();
    console.log('🎉 Database initialization completed successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Closing database connections...');
  await pool.end();
  console.log('✅ Database connections closed');
  process.exit(0);
});

module.exports = {
  pool,
  testConnection,
  runMigrations,
  createDatabase,
  initializeDatabase
};

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase();
}