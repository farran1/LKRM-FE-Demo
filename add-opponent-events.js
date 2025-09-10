// Add opponent scoring events to test analytics
// Copy and paste this into your browser console

(async function addOpponentEvents() {
  console.log('🏀 Adding Opponent Scoring Events for Analytics Test');
  console.log('==================================================');
  
  try {
    // Get the current session
    const sessionResponse = await fetch('/api/live-stat-tracker?type=session&sessionKey=test');
    const sessionData = await sessionResponse.json();
    
    if (!sessionData.success || !sessionData.data) {
      throw new Error('No active session found');
    }
    
    const sessionId = sessionData.data.id;
    const gameId = sessionData.data.game_id;
    
    console.log(`📊 Using Session ID: ${sessionId}, Game ID: ${gameId}`);
    
    // Add opponent scoring events
    const opponentEvents = [
      { eventType: 'fg_made', eventValue: 2, quarter: 1, gameTime: 120 },
      { eventType: 'three_made', eventValue: 3, quarter: 1, gameTime: 180 },
      { eventType: 'ft_made', eventValue: 1, quarter: 1, gameTime: 240 },
      { eventType: 'fg_made', eventValue: 2, quarter: 2, gameTime: 60 },
      { eventType: 'three_made', eventValue: 3, quarter: 2, gameTime: 120 },
      { eventType: 'fg_missed', eventValue: 2, quarter: 2, gameTime: 180 },
      { eventType: 'ft_made', eventValue: 1, quarter: 2, gameTime: 240 },
    ];
    
    console.log(`🎯 Adding ${opponentEvents.length} opponent scoring events...`);
    
    for (let i = 0; i < opponentEvents.length; i++) {
      const event = opponentEvents[i];
      
      const response = await fetch('/api/live-stat-tracker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'record-event',
          sessionId: sessionId,
          gameId: gameId,
          playerId: null, // Opponent event
          eventType: event.eventType,
          eventValue: event.eventValue,
          quarter: event.quarter,
          gameTime: event.gameTime,
          isOpponentEvent: true,
          opponentJersey: '4',
          metadata: {
            timestamp: new Date().toISOString(),
            isOpponent: true,
            playerName: '#4'
          }
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Event ${i + 1}: ${event.eventType} (${event.eventValue} pts) - Q${event.quarter}`);
      } else {
        console.log(`❌ Event ${i + 1} failed:`, result.error);
      }
      
      // Small delay between events
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Verify the events were added
    console.log('\n🔍 Verifying opponent events in database...');
    const verifyResponse = await fetch(`/api/live-stat-tracker?type=session&sessionKey=test`);
    const verifyData = await verifyResponse.json();
    
    if (verifyData.success && verifyData.data.live_game_events) {
      const opponentEvents = verifyData.data.live_game_events.filter(e => e.is_opponent_event);
      const scoringEvents = opponentEvents.filter(e => 
        e.event_type === 'fg_made' || e.event_type === 'three_made' || e.event_type === 'ft_made'
      );
      
      console.log(`📊 Total opponent events: ${opponentEvents.length}`);
      console.log(`🏀 Opponent scoring events: ${scoringEvents.length}`);
      
      const totalPoints = scoringEvents.reduce((sum, e) => {
        if (e.event_type === 'three_made') return sum + 3;
        if (e.event_type === 'ft_made') return sum + 1;
        if (e.event_type === 'fg_made') return sum + (e.event_value || 2);
        return sum;
      }, 0);
      
      console.log(`🎯 Total opponent points: ${totalPoints}`);
      console.log('\n✅ Opponent events added successfully!');
      console.log('🔄 Refresh your live stat tracker to see updated analytics!');
    }
    
  } catch (error) {
    console.error('💥 Failed to add opponent events:', error);
  }
})();
