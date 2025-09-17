// Live Stat Tracker Game Simulator
// This script simulates a complete basketball game with realistic events

console.log('🏀 Starting Live Stat Tracker Game Simulator...');

class GameSimulator {
  constructor() {
    this.isRunning = false;
    this.gameEvents = [];
    this.currentQuarter = 1;
    this.gameTime = 0;
    this.quarterDuration = 12 * 60; // 12 minutes in seconds
    this.eventInterval = null;
    this.testResults = {
      totalEvents: 0,
      successfulEvents: 0,
      failedEvents: 0,
      errors: []
    };
  }

  // Initialize the simulator
  async initialize() {
    console.log('🔧 Initializing game simulator...');
    
    // Check if we're on the live stat tracker page
    if (typeof gameState === 'undefined') {
      throw new Error('❌ Not on live stat tracker page. Please navigate to the live stat tracker first.');
    }

    // Check if game is started
    if (!gameState.isPlaying) {
      console.log('⚠️ Game not started. Starting game...');
      // Try to start the game
      if (typeof startGame === 'function') {
        startGame();
      } else {
        throw new Error('❌ Cannot start game. Please start the game manually first.');
      }
    }

    // Check if players are loaded
    if (!players || players.length === 0) {
      throw new Error('❌ No players loaded. Please load players first.');
    }

    // Check if lineup exists
    if (!currentLineup) {
      throw new Error('❌ No lineup exists. Please create a lineup first.');
    }

    console.log('✅ Simulator initialized successfully');
    console.log(`📊 Players loaded: ${players.length}`);
    console.log(`👥 Lineup: ${currentLineup.players.length} players`);
    console.log(`🎮 Game state: ${gameState.isPlaying ? 'Playing' : 'Not playing'}`);
  }

  // Generate realistic game events
  generateGameEvents() {
    const events = [];
    const eventTypes = [
      'fg_made', 'fg_missed', 'three_made', 'three_missed', 
      'ft_made', 'ft_missed', 'assist', 'rebound', 
      'steal', 'block', 'turnover', 'foul'
    ];

    // Generate events for each quarter
    for (let quarter = 1; quarter <= 4; quarter++) {
      const quarterEvents = this.generateQuarterEvents(quarter, eventTypes);
      events.push(...quarterEvents);
    }

    return events;
  }

  generateQuarterEvents(quarter, eventTypes) {
    const events = [];
    const eventsPerQuarter = Math.floor(Math.random() * 20) + 30; // 30-50 events per quarter
    
    for (let i = 0; i < eventsPerQuarter; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const playerId = this.getRandomPlayerId();
      const gameTime = Math.floor(Math.random() * this.quarterDuration);
      
      events.push({
        quarter,
        gameTime,
        eventType,
        playerId,
        value: this.getEventValue(eventType),
        metadata: this.getEventMetadata(eventType)
      });
    }

    // Sort events by game time
    events.sort((a, b) => a.gameTime - b.gameTime);
    return events;
  }

  getRandomPlayerId() {
    if (!players || players.length === 0) return null;
    const onCourtPlayers = players.filter(p => p.isOnCourt);
    if (onCourtPlayers.length === 0) return players[0].id;
    return onCourtPlayers[Math.floor(Math.random() * onCourtPlayers.length)].id;
  }

  getEventValue(eventType) {
    switch (eventType) {
      case 'fg_made': return 2;
      case 'three_made': return 3;
      case 'ft_made': return 1;
      case 'assist': return 1;
      case 'rebound': return 1;
      case 'steal': return 1;
      case 'block': return 1;
      case 'turnover': return 1;
      case 'foul': return 1;
      default: return 0;
    }
  }

  getEventMetadata(eventType) {
    const metadata = {};
    
    if (eventType === 'fg_made' || eventType === 'three_made') {
      // 70% chance of assist
      if (Math.random() < 0.7) {
        metadata.assist = this.getRandomPlayerId();
      }
      // 30% chance of points in paint
      if (Math.random() < 0.3) {
        metadata.pip = true;
      }
    }
    
    if (eventType === 'fg_missed' || eventType === 'three_missed' || eventType === 'ft_missed') {
      // 80% chance of rebound
      if (Math.random() < 0.8) {
        metadata.rebound = this.getRandomPlayerId();
      }
    }
    
    if (eventType === 'steal') {
      // 90% chance of turnover
      if (Math.random() < 0.9) {
        metadata.turnover = this.getRandomPlayerId();
      }
    }
    
    if (eventType === 'block') {
      // 95% chance of blocked shot
      if (Math.random() < 0.95) {
        metadata.blocked = this.getRandomPlayerId();
      }
    }
    
    if (eventType === 'foul') {
      // 20% chance of offensive foul
      metadata.isOffensive = Math.random() < 0.2;
    }
    
    return metadata;
  }

  // Simulate a single event
  async simulateEvent(event) {
    try {
      console.log(`🎬 Simulating: ${event.eventType} for player ${event.playerId} in Q${event.quarter}`);
      
      // Select the player
      const player = players.find(p => p.id === event.playerId);
      if (!player) {
        throw new Error(`Player ${event.playerId} not found`);
      }
      
      // Select player
      if (typeof selectPlayer === 'function') {
        selectPlayer(player);
        await this.delay(100); // Small delay for UI update
      }
      
      // Record the event
      if (typeof handleStatEvent === 'function') {
        handleStatEvent(
          event.playerId, 
          event.eventType, 
          event.value, 
          false, 
          event.metadata
        );
        
        this.testResults.totalEvents++;
        this.testResults.successfulEvents++;
        
        console.log(`✅ Event recorded: ${event.eventType} for ${player.name}`);
      } else {
        throw new Error('handleStatEvent function not available');
      }
      
    } catch (error) {
      console.error(`❌ Failed to simulate event:`, error);
      this.testResults.failedEvents++;
      this.testResults.errors.push({
        event,
        error: error.message
      });
    }
  }

  // Start the simulation
  async start() {
    try {
      await this.initialize();
      
      console.log('🏀 Starting game simulation...');
      this.isRunning = true;
      
      // Generate game events
      this.gameEvents = this.generateGameEvents();
      console.log(`📊 Generated ${this.gameEvents.length} events for simulation`);
      
      // Simulate events with realistic timing
      await this.simulateGameEvents();
      
      // Generate final report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Simulation failed:', error);
    }
  }

  // Simulate all game events
  async simulateGameEvents() {
    console.log('🎮 Simulating game events...');
    
    for (let i = 0; i < this.gameEvents.length; i++) {
      const event = this.gameEvents[i];
      
      // Update quarter if needed
      if (event.quarter !== this.currentQuarter) {
        this.currentQuarter = event.quarter;
        console.log(`🔄 Moving to Quarter ${this.currentQuarter}`);
      }
      
      // Simulate the event
      await this.simulateEvent(event);
      
      // Add realistic delay between events
      const delay = Math.random() * 2000 + 500; // 0.5-2.5 seconds
      await this.delay(delay);
      
      // Show progress every 10 events
      if ((i + 1) % 10 === 0) {
        console.log(`📈 Progress: ${i + 1}/${this.gameEvents.length} events completed`);
      }
    }
    
    console.log('🏁 Game simulation completed!');
  }

  // Generate test report
  generateReport() {
    console.log('\n📊 === GAME SIMULATION REPORT ===');
    console.log(`🎮 Total Events: ${this.testResults.totalEvents}`);
    console.log(`✅ Successful: ${this.testResults.successfulEvents}`);
    console.log(`❌ Failed: ${this.testResults.failedEvents}`);
    console.log(`📈 Success Rate: ${((this.testResults.successfulEvents / this.testResults.totalEvents) * 100).toFixed(1)}%`);
    
    if (this.testResults.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.event.eventType} for player ${error.event.playerId}: ${error.error}`);
      });
    }
    
    // Check database saves
    this.checkDatabaseSaves();
    
    console.log('\n🎉 Simulation complete! Check the play-by-play feed and database for results.');
  }

  // Check if events were saved to database
  checkDatabaseSaves() {
    console.log('\n🔍 Checking database saves...');
    
    if (typeof events !== 'undefined' && events.length > 0) {
      console.log(`✅ ${events.length} events in local events array`);
      
      // Show recent events
      const recentEvents = events.slice(0, 5);
      console.log('📋 Recent events:');
      recentEvents.forEach(event => {
        console.log(`  - ${event.timestamp}: ${event.playerName} ${event.eventType} (${event.value})`);
      });
    } else {
      console.log('❌ No events found in local events array');
    }
  }

  // Utility function for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Stop the simulation
  stop() {
    console.log('⏹️ Stopping simulation...');
    this.isRunning = false;
    if (this.eventInterval) {
      clearInterval(this.eventInterval);
    }
  }
}

// Create simulator instance
const simulator = new GameSimulator();

// Export for manual use
window.gameSimulator = simulator;

// Auto-start if on the right page
if (typeof gameState !== 'undefined') {
  console.log('🚀 Auto-starting simulator...');
  simulator.start();
} else {
  console.log('⚠️ Please navigate to the live stat tracker page and run: gameSimulator.start()');
}

// Quick test functions
window.quickTest = {
  // Test single event
  testSingleEvent: async (eventType = 'fg_made') => {
    console.log(`🧪 Testing single event: ${eventType}`);
    const playerId = players[0].id;
    const event = {
      quarter: 1,
      gameTime: 0,
      eventType,
      playerId,
      value: 2,
      metadata: {}
    };
    await simulator.simulateEvent(event);
  },
  
  // Test all event types
  testAllEventTypes: async () => {
    console.log('🧪 Testing all event types...');
    const eventTypes = ['fg_made', 'fg_missed', 'three_made', 'three_missed', 'ft_made', 'ft_missed', 'assist', 'rebound', 'steal', 'block', 'turnover', 'foul'];
    
    for (const eventType of eventTypes) {
      console.log(`Testing ${eventType}...`);
      await quickTest.testSingleEvent(eventType);
      await simulator.delay(1000);
    }
  },
  
  // Test modal events
  testModalEvents: async () => {
    console.log('🧪 Testing modal events...');
    const modalEvents = ['fg_made', 'three_made', 'fg_missed', 'steal', 'turnover', 'foul', 'block'];
    
    for (const eventType of modalEvents) {
      console.log(`Testing modal event: ${eventType}`);
      await quickTest.testSingleEvent(eventType);
      await simulator.delay(2000); // Longer delay for modals
    }
  }
};

console.log('🎮 Game Simulator loaded!');
console.log('📋 Available commands:');
console.log('  - gameSimulator.start() - Start full game simulation');
console.log('  - gameSimulator.stop() - Stop simulation');
console.log('  - quickTest.testSingleEvent("fg_made") - Test single event');
console.log('  - quickTest.testAllEventTypes() - Test all event types');
console.log('  - quickTest.testModalEvents() - Test modal events');



