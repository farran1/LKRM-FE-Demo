// Database diagnostic utility for Live Stat Tracker
// Use this to check if required tables exist

import { enhancedLiveStatTrackerService } from '../services/enhancedLiveStatTrackerService'

declare global {
  interface Window {
    dbDiagnostic: {
      checkTables: () => Promise<void>
      createMissingTables: () => Promise<void>
      testLiveStatTracker: (eventId: number) => Promise<void>
      checkRLS: () => Promise<void>
      fixRLS: () => Promise<void>
    }
  }
}

const dbDiagnostic = {
  async checkTables() {
    console.log('🔍 Checking required database tables...')
    
    try {
      // Import Supabase client
      const { supabase } = await import('../lib/supabase')
      
      const requiredTables = [
        'live_game_sessions',
        'live_game_events', 
        'live_game_sync_status',
        'users',
        'players',
        'events',
        'games',
        'game_stats'
      ]
      
      const results: { [key: string]: boolean } = {}
      
      for (const tableName of requiredTables) {
        try {
          const { data, error } = await (supabase as any)
            .from(tableName)
            .select('*')
            .limit(1)
          
          results[tableName] = !error
          
          if (error) {
            console.log(`❌ ${tableName}: ${error.message}`)
          } else {
            console.log(`✅ ${tableName}: exists`)
          }
        } catch (error) {
          results[tableName] = false
          console.log(`❌ ${tableName}: ${error}`)
        }
      }
      
      const missingTables = Object.entries(results)
        .filter(([_, exists]) => !exists)
        .map(([table]) => table)
      
      if (missingTables.length === 0) {
        console.log('🎉 All required tables exist!')
      } else {
        console.log('⚠️ Missing tables:', missingTables)
        console.log('💡 You need to run these migrations in Supabase:')
        console.log('   1. supabase/migrations/20250120000000_create_live_stat_tracker_tables.sql')
        console.log('   2. supabase/migrations/20250120000000_enhance_live_stat_tracker.sql')
        console.log('   3. supabase/migrations/20250120000001_fix_rls_policies.sql')
        console.log('   4. supabase/migrations/20250120000002_fix_aggregate_function.sql')
      }
      
    } catch (error) {
      console.error('❌ Error checking tables:', error)
    }
  },

  async createMissingTables() {
    console.log('🔧 Attempting to create missing tables...')
    console.log('⚠️ This should ideally be done through Supabase SQL editor')
    
    try {
      const { supabase } = await import('../lib/supabase')
      
      // Basic live_game_sessions table creation
      const createSessionsTable = `
        CREATE TABLE IF NOT EXISTS live_game_sessions (
          id SERIAL PRIMARY KEY,
          event_id INTEGER NOT NULL,
          game_id INTEGER,
          session_key TEXT UNIQUE NOT NULL,
          game_state JSONB NOT NULL DEFAULT '{}',
          is_active BOOLEAN DEFAULT true,
          started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          ended_at TIMESTAMP WITH TIME ZONE,
          created_by INTEGER DEFAULT 1,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
      
      const { error } = await (supabase as any).rpc('exec_sql', { sql: createSessionsTable })
      
      if (error) {
        console.error('❌ Could not create tables via RPC:', error)
        console.log('💡 Please run the migration files manually in Supabase SQL editor')
      } else {
        console.log('✅ Tables created successfully')
      }
      
    } catch (error) {
      console.error('❌ Error creating tables:', error)
      console.log('💡 Please run the migration files manually in Supabase SQL editor')
    }
  },

  async testLiveStatTracker(eventId: number) {
    console.log(`🧪 Testing Live Stat Tracker for event ${eventId}...`)
    
    try {
      // Test starting a session
      const session = await enhancedLiveStatTrackerService.startLiveGame(eventId)
      console.log('✅ Session started:', session)
      
      // Test recording an event
      await enhancedLiveStatTrackerService.recordLiveEvent('points', 2, 1, 1, 0)
      console.log('✅ Event recorded')
      
      // Test updating game state
      await enhancedLiveStatTrackerService.updateGameState({
        currentQuarter: 1,
        timeRemaining: 580,
        homeScore: 2,
        awayScore: 0
      })
      console.log('✅ Game state updated')
      
      console.log('🎉 Live Stat Tracker test completed successfully!')
      
    } catch (error) {
      console.error('❌ Live Stat Tracker test failed:', error)
      const err = error as Error
      
      if (err.message && err.message.includes('406')) {
        console.log('💡 This looks like an RLS (Row Level Security) issue.')
        console.log('💡 Try running this migration to temporarily disable RLS:')
        console.log('   supabase/migrations/20250120000003_disable_rls_temporarily.sql')
      }
    }
  },

  async checkRLS() {
    console.log('🔒 Checking RLS status for live stat tracker tables...')
    
    try {
      const { supabase } = await import('../lib/supabase')
      
      // Test a simple query to each table
      const tables = ['live_game_sessions', 'live_game_events', 'live_game_sync_status']
      
      for (const table of tables) {
        try {
          const { data, error } = await (supabase as any)
            .from(table)
            .select('id')
            .limit(1)
          
          if (error) {
            console.log(`❌ ${table}: ${error.message} (Code: ${error.code})`)
            if (error.code === 'PGRST116' || error.message.includes('406')) {
              console.log(`   ⚠️ This is likely an RLS issue`)
            }
          } else {
            console.log(`✅ ${table}: accessible`)
          }
        } catch (err) {
          console.log(`❌ ${table}: ${err}`)
        }
      }
      
      console.log('💡 If you see 406 errors or RLS issues, run:')
      console.log('   window.dbDiagnostic.fixRLS()')
      
    } catch (error) {
      console.error('❌ Error checking RLS:', error)
    }
  },

  async fixRLS() {
    console.log('🔧 Attempting to fix RLS issues...')
    console.log('⚠️ This will temporarily disable RLS for live stat tracker tables')
    
    const confirmed = confirm(
      'This will DISABLE Row Level Security for live stat tracker tables.\n' +
      'This is safe for development but should not be used in production.\n\n' +
      'Continue?'
    )
    
    if (!confirmed) {
      console.log('❌ RLS fix cancelled')
      return
    }
    
    try {
      const { supabase } = await import('../lib/supabase')
      
      const sql = `
        ALTER TABLE live_game_sessions DISABLE ROW LEVEL SECURITY;
        ALTER TABLE live_game_events DISABLE ROW LEVEL SECURITY;
        ALTER TABLE live_game_sync_status DISABLE ROW LEVEL SECURITY;
      `
      
      // Try to execute the SQL - this might not work from client
      console.log('⚠️ This operation requires admin privileges.')
      console.log('💡 Please run this SQL in your Supabase SQL editor:')
      console.log(sql)
      console.log('📂 Or apply this migration: supabase/migrations/20250120000003_disable_rls_temporarily.sql')
      
    } catch (error) {
      console.error('❌ Could not fix RLS automatically:', error)
      console.log('💡 Please run the migration manually in Supabase SQL editor')
    }
  }
}

// Attach to window for console access
if (typeof window !== 'undefined') {
  window.dbDiagnostic = dbDiagnostic
}

export default dbDiagnostic
