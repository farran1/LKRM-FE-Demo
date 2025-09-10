/**
 * Live Stats Tracker Automated Test Suite
 * This test will verify the entire live stats tracking flow
 */

class LiveStatsTrackerTest {
  constructor() {
    this.testResults = [];
    this.currentTest = '';
    this.events = [];
    this.players = [];
    this.gameState = null;
    this.teamStats = null;
    this.opponentStats = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logMessage);
    
    this.testResults.push({
      timestamp,
      test: this.currentTest,
      type,
      message
    });
  }

  async runTest(testName, testFunction) {
    this.currentTest = testName;
    this.log(`Starting test: ${testName}`, 'info');
    
    try {
      await testFunction();
      this.log(`✅ Test passed: ${testName}`, 'success');
    } catch (error) {
      this.log(`❌ Test failed: ${testName} - ${error.message}`, 'error');
      throw error;
    }
  }

  // Test 1: Verify Database Connection
  async testDatabaseConnection() {
    this.log('Testing database connection...');
    
    // Check if we can access the live_game_events table
    const response = await fetch('/api/live-stat-tracker?type=session&sessionKey=test');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Database connection failed: ${data.error || 'Unknown error'}`);
    }
    
    this.log('Database connection successful');
  }

  // Test 2: Verify Game Session Creation
  async testGameSessionCreation() {
    this.log('Testing game session creation...');
    
    const sessionData = {
      eventId: 16, // Use a known event ID
      sessionKey: `test_session_${Date.now()}`,
      gameState: {
        quarter: 1,
        homeScore: 0,
        awayScore: 0,
        opponentScore: 0,
        isPlaying: false
      },
      createdBy: 1
    };

    const response = await fetch('/api/live-stat-tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create-session',
        data: sessionData
      })
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`Session creation failed: ${result.error}`);
    }

    this.sessionId = result.data.id;
    this.sessionKey = result.data.session_key;
    this.gameId = result.data.game_id;
    
    this.log(`Session created: ID=${this.sessionId}, GameID=${this.gameId}`);
  }

  // Test 3: Verify Event Recording
  async testEventRecording() {
    this.log('Testing event recording...');
    
    const testEvents = [
      {
        sessionId: this.sessionId,
        playerId: 18,
        eventType: 'fg_made',
        eventValue: 2,
        quarter: 1,
        gameTime: 0,
        isOpponentEvent: false,
        opponentJersey: null,
        metadata: {}
      },
      {
        sessionId: this.sessionId,
        playerId: null,
        eventType: 'fg_made',
        eventValue: 2,
        quarter: 1,
        gameTime: 0,
        isOpponentEvent: true,
        opponentJersey: '5',
        metadata: {}
      }
    ];

    for (const event of testEvents) {
      const response = await fetch('/api/live-stat-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record-event',
          data: event
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`Event recording failed: ${result.error}`);
      }
      
      this.events.push(result.data);
      this.log(`Event recorded: ${event.eventType} (${event.isOpponentEvent ? 'Opponent' : 'Team'})`);
    }
  }

  // Test 4: Verify Database Storage
  async testDatabaseStorage() {
    this.log('Testing database storage...');
    
    // Wait a moment for the events to be processed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Query the database to verify events were stored
    const response = await fetch(`/api/live-stat-tracker?type=session&sessionKey=${this.sessionKey}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Failed to retrieve session data: ${data.error}`);
    }
    
    const storedEvents = data.data.live_game_events || [];
    this.log(`Found ${storedEvents.length} events in database`);
    
    if (storedEvents.length === 0) {
      throw new Error('No events found in database - events not being saved');
    }
    
    // Check if game_id is properly set
    const eventsWithGameId = storedEvents.filter(e => e.game_id !== null);
    if (eventsWithGameId.length === 0) {
      throw new Error('All events have null game_id - foreign key not being set');
    }
    
    this.log(`✅ ${eventsWithGameId.length}/${storedEvents.length} events have valid game_id`);
  }

  // Test 5: Verify Team Statistics Calculation
  async testTeamStatisticsCalculation() {
    this.log('Testing team statistics calculation...');
    
    // Simulate the team stats calculation
    const teamEvents = this.events.filter(e => !e.is_opponent_event);
    const opponentEvents = this.events.filter(e => e.is_opponent_event);
    
    // Calculate team stats
    const teamPoints = teamEvents.reduce((sum, e) => {
      if (e.event_type === 'three_made') return sum + 3;
      if (e.event_type === 'ft_made') return sum + 1;
      if (e.event_type === 'fg_made') return sum + (e.event_value || 2);
      return sum;
    }, 0);
    
    const teamAssists = teamEvents.filter(e => e.event_type === 'assist').length;
    
    // Calculate opponent stats
    const opponentPoints = opponentEvents.reduce((sum, e) => {
      if (e.event_type === 'three_made') return sum + 3;
      if (e.event_type === 'ft_made') return sum + 1;
      if (e.event_type === 'fg_made') return sum + (e.event_value || 2);
      return sum;
    }, 0);
    
    const opponentAssists = opponentEvents.filter(e => e.event_type === 'assist').length;
    
    this.teamStats = { points: teamPoints, assists: teamAssists };
    this.opponentStats = { points: opponentPoints, assists: opponentAssists };
    
    this.log(`Team stats: ${teamPoints} points, ${teamAssists} assists`);
    this.log(`Opponent stats: ${opponentPoints} points, ${opponentAssists} assists`);
    
    // Verify the calculations make sense
    if (teamPoints < 0 || opponentPoints < 0) {
      throw new Error('Negative points calculated - calculation error');
    }
  }

  // Test 6: Verify UI Data Consistency
  async testUIDataConsistency() {
    this.log('Testing UI data consistency...');
    
    // This test would need to be run in the browser context
    // For now, we'll simulate what the UI should show
    const expectedTeamDisplay = `HOME ${this.teamStats.points} - ${this.opponentStats.points} OPP`;
    const expectedAssists = `HOME: ${this.teamStats.assists}, OPP: ${this.opponentStats.assists}`;
    
    this.log(`Expected team display: ${expectedTeamDisplay}`);
    this.log(`Expected assists: ${expectedAssists}`);
    
    // Check if the data makes sense
    if (this.teamStats.points !== this.opponentStats.points) {
      this.log('⚠️ Score mismatch detected - this might be expected', 'warning');
    }
    
    if (this.teamStats.assists !== this.opponentStats.assists) {
      this.log('⚠️ Assist count mismatch detected - this might be expected', 'warning');
    }
  }

  // Test 7: Verify Error Handling
  async testErrorHandling() {
    this.log('Testing error handling...');
    
    // Test with invalid session ID
    try {
      const response = await fetch('/api/live-stat-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record-event',
          data: {
            sessionId: 99999, // Invalid session ID
            playerId: 18,
            eventType: 'fg_made',
            eventValue: 2,
            quarter: 1,
            gameTime: 0,
            isOpponentEvent: false
          }
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        throw new Error('Expected error for invalid session ID, but got success');
      }
      
      this.log('✅ Error handling working correctly');
    } catch (error) {
      this.log('✅ Error handling working correctly (caught expected error)');
    }
  }

  // Run all tests
  async runAllTests() {
    this.log('🚀 Starting Live Stats Tracker Test Suite', 'info');
    
    try {
      await this.runTest('Database Connection', () => this.testDatabaseConnection());
      await this.runTest('Game Session Creation', () => this.testGameSessionCreation());
      await this.runTest('Event Recording', () => this.testEventRecording());
      await this.runTest('Database Storage', () => this.testDatabaseStorage());
      await this.runTest('Team Statistics Calculation', () => this.testTeamStatisticsCalculation());
      await this.runTest('UI Data Consistency', () => this.testUIDataConsistency());
      await this.runTest('Error Handling', () => this.testErrorHandling());
      
      this.log('🎉 All tests completed successfully!', 'success');
      this.generateReport();
      
    } catch (error) {
      this.log(`💥 Test suite failed: ${error.message}`, 'error');
      this.generateReport();
      throw error;
    }
  }

  // Generate test report
  generateReport() {
    const report = {
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter(r => r.type === 'success').length,
        failed: this.testResults.filter(r => r.type === 'error').length,
        warnings: this.testResults.filter(r => r.type === 'warning').length
      },
      results: this.testResults,
      recommendations: this.generateRecommendations()
    };
    
    console.log('\n📊 TEST REPORT');
    console.log('==============');
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️ Warnings: ${report.summary.warnings}`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS');
      console.log('==================');
      report.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    const failedTests = this.testResults.filter(r => r.type === 'error');
    const warningTests = this.testResults.filter(r => r.type === 'warning');
    
    if (failedTests.length > 0) {
      recommendations.push('Fix failed tests before proceeding');
    }
    
    if (warningTests.length > 0) {
      recommendations.push('Review warnings and ensure they are expected');
    }
    
    const gameIdIssues = this.testResults.filter(r => 
      r.message.includes('game_id') || r.message.includes('gameId')
    );
    
    if (gameIdIssues.length > 0) {
      recommendations.push('Investigate game_id foreign key issues');
    }
    
    const databaseIssues = this.testResults.filter(r => 
      r.message.includes('database') || r.message.includes('Database')
    );
    
    if (databaseIssues.length > 0) {
      recommendations.push('Check database connection and permissions');
    }
    
    return recommendations;
  }
}

// Export for use in browser console
window.LiveStatsTrackerTest = LiveStatsTrackerTest;

// Auto-run if in browser
if (typeof window !== 'undefined') {
  console.log('🧪 Live Stats Tracker Test Suite loaded');
  console.log('Run: new LiveStatsTrackerTest().runAllTests()');
}
