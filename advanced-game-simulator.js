// Advanced Live Stat Tracker Game Simulator
// This script handles modals and complex event flows

console.log('🏀 Starting Advanced Game Simulator...');

class AdvancedGameSimulator {
  constructor() {
    this.isRunning = false;
    this.gameEvents = [];
    this.currentEventIndex = 0;
    this.testResults = {
      totalEvents: 0,
      successfulEvents: 0,
      failedEvents: 0,
      modalEvents: 0,
      directEvents: 0,
      errors: []
    };
    this.eventHandlers = new Map();
  }

  async initialize() {
    console.log('🔧 Initializing advanced simulator...');
    
    // Check prerequisites
    if (typeof gameState === 'undefined') {
      throw new Error('❌ Not on live stat tracker page');
    }

    if (!gameState.isPlaying) {
      console.log('⚠️ Game not started. Please start the game first.');
      return false;
    }

    if (!players || players.length === 0) {
      throw new Error('❌ No players loaded');
    }

    if (!currentLineup) {
      throw new Error('❌ No lineup exists');
    }

    // Set up event handlers
    this.setupEventHandlers();
    
    console.log('✅ Advanced simulator initialized');
    return true;
  }

  setupEventHandlers() {
    // Monitor for modal appearances
    this.eventHandlers.set('modal', (modalType) => {
      console.log(`🎭 Modal opened: ${modalType}`);
      this.testResults.modalEvents++;
    });

    // Monitor for direct events
    this.eventHandlers.set('direct', (eventType) => {
      console.log(`⚡ Direct event: ${eventType}`);
      this.testResults.directEvents++;
    });
  }

  // Generate realistic game events with proper sequencing
  generateRealisticGameEvents() {
    const events = [];
    const quarters = [
      { quarter: 1, events: 35, intensity: 'high' },
      { quarter: 2, events: 30, intensity: 'medium' },
      { quarter: 3, events: 32, intensity: 'high' },
      { quarter: 4, events: 40, intensity: 'very-high' }
    ];

    quarters.forEach(q => {
      const quarterEvents = this.generateQuarterEvents(q);
      events.push(...quarterEvents);
    });

    return events;
  }

  generateQuarterEvents(quarterInfo) {
    const events = [];
    const { quarter, events: eventCount, intensity } = quarterInfo;
    
    // Event type probabilities based on intensity
    const eventProbabilities = this.getEventProbabilities(intensity);
    
    for (let i = 0; i < eventCount; i++) {
      const eventType = this.selectEventType(eventProbabilities);
      const playerId = this.getRandomPlayerId();
      const gameTime = Math.floor(Math.random() * (12 * 60)); // 12 minutes
      
      events.push({
        quarter,
        gameTime,
        eventType,
        playerId,
        value: this.getEventValue(eventType),
        metadata: this.getEventMetadata(eventType),
        requiresModal: this.requiresModal(eventType)
      });
    }

    return events.sort((a, b) => a.gameTime - b.gameTime);
  }

  getEventProbabilities(intensity) {
    const base = {
      'fg_made': 0.25,
      'fg_missed': 0.20,
      'three_made': 0.15,
      'three_missed': 0.10,
      'ft_made': 0.08,
      'ft_missed': 0.05,
      'assist': 0.05,
      'rebound': 0.08,
      'steal': 0.02,
      'block': 0.01,
      'turnover': 0.03,
      'foul': 0.08
    };

    // Adjust based on intensity
    if (intensity === 'high') {
      base.fg_made *= 1.2;
      base.three_made *= 1.3;
      base.steal *= 1.5;
    } else if (intensity === 'very-high') {
      base.fg_made *= 1.4;
      base.three_made *= 1.6;
      base.steal *= 2.0;
      base.block *= 1.5;
    }

    return base;
  }

  selectEventType(probabilities) {
    const random = Math.random();
    let cumulative = 0;
    
    for (const [eventType, probability] of Object.entries(probabilities)) {
      cumulative += probability;
      if (random <= cumulative) {
        return eventType;
      }
    }
    
    return 'fg_made'; // fallback
  }

  requiresModal(eventType) {
    const modalEvents = [
      'fg_made', 'three_made', 'fg_missed', 'three_missed', 
      'ft_missed', 'steal', 'turnover', 'foul', 'block'
    ];
    return modalEvents.includes(eventType);
  }

  getRandomPlayerId() {
    if (!players || players.length === 0) return null;
    const onCourtPlayers = players.filter(p => p.isOnCourt);
    if (onCourtPlayers.length === 0) return players[0].id;
    return onCourtPlayers[Math.floor(Math.random() * onCourtPlayers.length)].id;
  }

  getEventValue(eventType) {
    const values = {
      'fg_made': 2,
      'three_made': 3,
      'ft_made': 1,
      'assist': 1,
      'rebound': 1,
      'steal': 1,
      'block': 1,
      'turnover': 1,
      'foul': 1
    };
    return values[eventType] || 0;
  }

  getEventMetadata(eventType) {
    const metadata = {};
    
    // Field goals
    if (eventType === 'fg_made' || eventType === 'three_made') {
      if (Math.random() < 0.6) metadata.assist = this.getRandomPlayerId();
      if (Math.random() < 0.3) metadata.pip = true;
    }
    
    // Missed shots
    if (eventType === 'fg_missed' || eventType === 'three_missed' || eventType === 'ft_missed') {
      if (Math.random() < 0.8) metadata.rebound = this.getRandomPlayerId();
    }
    
    // Steals and turnovers
    if (eventType === 'steal') {
      if (Math.random() < 0.9) metadata.turnover = this.getRandomPlayerId();
    }
    
    // Blocks
    if (eventType === 'block') {
      if (Math.random() < 0.95) metadata.blocked = this.getRandomPlayerId();
    }
    
    // Fouls
    if (eventType === 'foul') {
      metadata.isOffensive = Math.random() < 0.2;
    }
    
    return metadata;
  }

  // Simulate a single event with modal handling
  async simulateEvent(event) {
    try {
      console.log(`🎬 Simulating: ${event.eventType} for player ${event.playerId} in Q${event.quarter}`);
      
      // Select the player
      const player = players.find(p => p.id === event.playerId);
      if (!player) {
        throw new Error(`Player ${event.playerId} not found`);
      }
      
      selectPlayer(player);
      await this.delay(200);
      
      // Record the event
      if (event.requiresModal) {
        await this.simulateModalEvent(event);
      } else {
        await this.simulateDirectEvent(event);
      }
      
      this.testResults.totalEvents++;
      this.testResults.successfulEvents++;
      
    } catch (error) {
      console.error(`❌ Failed to simulate event:`, error);
      this.testResults.failedEvents++;
      this.testResults.errors.push({ event, error: error.message });
    }
  }

  // Simulate direct events (no modal)
  async simulateDirectEvent(event) {
    console.log(`⚡ Direct event: ${event.eventType}`);
    this.eventHandlers.get('direct')(event.eventType);
    
    if (typeof handleStatEvent === 'function') {
      handleStatEvent(event.playerId, event.eventType, event.value, false, event.metadata);
    }
  }

  // Simulate modal events
  async simulateModalEvent(event) {
    console.log(`🎭 Modal event: ${event.eventType}`);
    this.eventHandlers.get('modal')(event.eventType);
    
    // Trigger the modal
    if (typeof recordAction === 'function') {
      recordAction(event.eventType);
      await this.delay(500);
      
      // Handle the modal based on event type
      await this.handleModal(event);
    }
  }

  // Handle different modal types
  async handleModal(event) {
    switch (event.eventType) {
      case 'fg_made':
      case 'three_made':
        await this.handleAssistModal(event);
        break;
      case 'fg_missed':
      case 'three_missed':
      case 'ft_missed':
        await this.handleReboundModal(event);
        break;
      case 'steal':
        await this.handleStealModal(event);
        break;
      case 'turnover':
        await this.handleTurnoverModal(event);
        break;
      case 'foul':
        await this.handleFoulModal(event);
        break;
      case 'block':
        await this.handleBlockModal(event);
        break;
    }
  }

  // Handle assist modal
  async handleAssistModal(event) {
    console.log('🎯 Handling assist modal...');
    await this.delay(1000);
    
    // Simulate assist selection (70% chance of assist)
    const hasAssist = Math.random() < 0.7;
    const assistPlayerId = hasAssist ? this.getRandomPlayerId() : null;
    
    if (typeof handleAssistConfirm === 'function') {
      handleAssistConfirm(assistPlayerId);
    }
  }

  // Handle rebound modal
  async handleReboundModal(event) {
    console.log('🏀 Handling rebound modal...');
    await this.delay(1000);
    
    // Simulate rebound selection (80% chance of rebound)
    const hasRebound = Math.random() < 0.8;
    const reboundPlayerId = hasRebound ? this.getRandomPlayerId() : null;
    
    if (typeof handleReboundConfirm === 'function') {
      handleReboundConfirm(reboundPlayerId, false);
    }
  }

  // Handle steal modal
  async handleStealModal(event) {
    console.log('🦹 Handling steal modal...');
    await this.delay(1000);
    
    // Simulate turnover selection (90% chance of turnover)
    const hasTurnover = Math.random() < 0.9;
    const turnoverPlayerId = hasTurnover ? this.getRandomPlayerId() : null;
    
    if (typeof handleStealConfirm === 'function') {
      handleStealConfirm(turnoverPlayerId, false);
    }
  }

  // Handle turnover modal
  async handleTurnoverModal(event) {
    console.log('🔄 Handling turnover modal...');
    await this.delay(1000);
    
    // Simulate steal selection (10% chance of steal)
    const hasSteal = Math.random() < 0.1;
    const stealPlayerId = hasSteal ? this.getRandomPlayerId() : null;
    
    if (typeof handleTurnoverConfirm === 'function') {
      handleTurnoverConfirm(stealPlayerId, false);
    }
  }

  // Handle foul modal
  async handleFoulModal(event) {
    console.log('⚠️ Handling foul modal...');
    await this.delay(1000);
    
    // Simulate foul type selection
    const isOffensive = Math.random() < 0.2;
    
    if (typeof handleFoulConfirm === 'function') {
      handleFoulConfirm(isOffensive);
    }
  }

  // Handle block modal
  async handleBlockModal(event) {
    console.log('🛡️ Handling block modal...');
    await this.delay(1000);
    
    // Simulate blocked player selection (95% chance of blocked shot)
    const hasBlocked = Math.random() < 0.95;
    const blockedPlayerId = hasBlocked ? this.getRandomPlayerId() : null;
    
    if (typeof handleBlockConfirm === 'function') {
      handleBlockConfirm(blockedPlayerId);
    }
  }

  // Start the simulation
  async start() {
    try {
      const initialized = await this.initialize();
      if (!initialized) {
        console.log('❌ Initialization failed. Please start the game first.');
        return;
      }
      
      console.log('🏀 Starting advanced game simulation...');
      this.isRunning = true;
      
      // Generate events
      this.gameEvents = this.generateRealisticGameEvents();
      console.log(`📊 Generated ${this.gameEvents.length} events for simulation`);
      
      // Simulate events
      await this.simulateGameEvents();
      
      // Generate report
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
      this.currentEventIndex = i;
      
      // Update quarter if needed
      if (event.quarter !== this.currentQuarter) {
        this.currentQuarter = event.quarter;
        console.log(`🔄 Moving to Quarter ${this.currentQuarter}`);
      }
      
      // Simulate the event
      await this.simulateEvent(event);
      
      // Add realistic delay
      const delay = Math.random() * 1500 + 300; // 0.3-1.8 seconds
      await this.delay(delay);
      
      // Show progress
      if ((i + 1) % 20 === 0) {
        console.log(`📈 Progress: ${i + 1}/${this.gameEvents.length} events completed`);
      }
    }
    
    console.log('🏁 Advanced game simulation completed!');
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n📊 === ADVANCED GAME SIMULATION REPORT ===');
    console.log(`🎮 Total Events: ${this.testResults.totalEvents}`);
    console.log(`✅ Successful: ${this.testResults.successfulEvents}`);
    console.log(`❌ Failed: ${this.testResults.failedEvents}`);
    console.log(`🎭 Modal Events: ${this.testResults.modalEvents}`);
    console.log(`⚡ Direct Events: ${this.testResults.directEvents}`);
    console.log(`📈 Success Rate: ${((this.testResults.successfulEvents / this.testResults.totalEvents) * 100).toFixed(1)}%`);
    
    // Event type breakdown
    const eventTypes = {};
    this.gameEvents.forEach(event => {
      eventTypes[event.eventType] = (eventTypes[event.eventType] || 0) + 1;
    });
    
    console.log('\n📋 Event Type Breakdown:');
    Object.entries(eventTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} events`);
    });
    
    if (this.testResults.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.event.eventType}: ${error.error}`);
      });
    }
    
    // Check database saves
    this.checkDatabaseSaves();
    
    console.log('\n🎉 Advanced simulation complete!');
  }

  checkDatabaseSaves() {
    console.log('\n🔍 Checking database saves...');
    
    if (typeof events !== 'undefined' && events.length > 0) {
      console.log(`✅ ${events.length} events in local events array`);
      
      // Show event distribution
      const eventDistribution = {};
      events.forEach(event => {
        eventDistribution[event.eventType] = (eventDistribution[event.eventType] || 0) + 1;
      });
      
      console.log('📊 Event distribution in database:');
      Object.entries(eventDistribution).forEach(([type, count]) => {
        console.log(`  ${type}: ${count} events`);
      });
    } else {
      console.log('❌ No events found in local events array');
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    console.log('⏹️ Stopping advanced simulation...');
    this.isRunning = false;
  }
}

// Create advanced simulator
const advancedSimulator = new AdvancedGameSimulator();

// Export for use
window.advancedSimulator = advancedSimulator;

// Auto-start if ready
if (typeof gameState !== 'undefined' && gameState.isPlaying) {
  console.log('🚀 Auto-starting advanced simulator...');
  advancedSimulator.start();
} else {
  console.log('⚠️ Please start the game first, then run: advancedSimulator.start()');
}

console.log('🎮 Advanced Game Simulator loaded!');
console.log('📋 Commands:');
console.log('  - advancedSimulator.start() - Start full simulation');
console.log('  - advancedSimulator.stop() - Stop simulation');



