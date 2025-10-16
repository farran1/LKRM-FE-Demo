// Goal calculation service for aggregating live_game_events based on metric definitions
import { createServerClient } from '@/lib/supabase';

export interface MetricCalculationResult {
  actualValue: number;
  targetValue: number;
  delta: number;
  status: 'on_track' | 'at_risk' | 'off_track';
}

export interface GoalCalculationResult {
  goalId: number;
  sessionId: number;
  result: MetricCalculationResult;
}

class GoalCalculationService {
  private supabase = createServerClient();

  /**
   * Calculate metric value from live game events based on metric definition
   */
  async calculateMetricValue(
    sessionId: number, 
    metric: any, 
    isOpponent: boolean = false
  ): Promise<number> {
    const { event_types, calculation_type, name } = metric;

    // Special handling for complex metrics
    if (name === 'Second Chance Points') {
      return await this.calculateSecondChancePoints(sessionId, isOpponent);
    }

    if (name === 'Offensive Rebounds') {
      return await this.calculateOffensiveRebounds(sessionId, isOpponent);
    }

    if (name === 'Defensive Rebounds') {
      return await this.calculateDefensiveRebounds(sessionId, isOpponent);
    }

    if (!event_types || event_types.length === 0) {
      return 0;
    }

    // Get all events for this session
    const { data: events, error } = await this.supabase
      .from('live_game_events')
      .select('event_type, event_value, is_opponent_event, metadata')
      .eq('session_id', sessionId)
      .in('event_type', event_types)
      .eq('is_opponent_event', isOpponent)
      .is('deleted_at', null);

    if (error) {
      console.error('Error fetching events for calculation:', error);
      return 0;
    }

    if (!events || events.length === 0) {
      return 0;
    }

    switch (calculation_type) {
      case 'sum':
        return this.calculateSum(events, event_types);
      case 'average':
        return this.calculateAverage(events, event_types);
      case 'percentage':
        return this.calculatePercentage(events, event_types);
      case 'ratio':
        return this.calculateRatio(events, event_types);
      default:
        return 0;
    }
  }

  /**
   * Calculate sum of event values
   */
  private calculateSum(events: any[], eventTypes: string[]): number {
    return events.reduce((sum, event) => {
      if (eventTypes.includes(event.event_type)) {
        return sum + (event.event_value || 1);
      }
      return sum;
    }, 0);
  }

  /**
   * Calculate average of event values
   */
  private calculateAverage(events: any[], eventTypes: string[]): number {
    const relevantEvents = events.filter(e => eventTypes.includes(e.event_type));
    if (relevantEvents.length === 0) return 0;
    
    const sum = relevantEvents.reduce((sum, event) => sum + (event.event_value || 1), 0);
    return sum / relevantEvents.length;
  }

  /**
   * Calculate percentage (made / (made + missed)) * 100
   */
  private calculatePercentage(events: any[], eventTypes: string[]): number {
    const madeEvents = eventTypes.filter(type => type.includes('made'));
    const missedEvents = eventTypes.filter(type => type.includes('missed'));
    
    const made = events.filter(e => madeEvents.includes(e.event_type)).length;
    const missed = events.filter(e => missedEvents.includes(e.event_type)).length;
    
    if (made + missed === 0) return 0;
    return (made / (made + missed)) * 100;
  }

  /**
   * Calculate ratio (first event type / second event type)
   */
  private calculateRatio(events: any[], eventTypes: string[]): number {
    if (eventTypes.length < 2) return 0;
    
    const numerator = events.filter(e => e.event_type === eventTypes[0]).length;
    const denominator = events.filter(e => e.event_type === eventTypes[1]).length;
    
    if (denominator === 0) return 0;
    return numerator / denominator;
  }

  /**
   * Calculate second chance points using the same logic as the live stat tracker
   */
  private async calculateSecondChancePoints(sessionId: number, isOpponent: boolean): Promise<number> {
    const { data: events, error } = await this.supabase
      .from('live_game_events')
      .select('event_type, is_opponent_event, created_at, metadata')
      .eq('session_id', sessionId)
      .eq('is_opponent_event', isOpponent)
      .in('event_type', ['fg_missed', 'three_missed', 'rebound', 'fg_made', 'three_made'])
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error || !events) return 0;

    let secondChancePoints = 0;
    const sortedEvents = events;

    for (let i = 0; i < sortedEvents.length; i++) {
      const event = sortedEvents[i];
      
      // Look for missed shots
      if (event.event_type === 'fg_missed' || event.event_type === 'three_missed') {
        let foundRebound = false;
        let j = i + 1;
        
        // Look for the next rebound by the same team
        while (j < sortedEvents.length && !foundRebound) {
          const nextEvent = sortedEvents[j];
          
          // If opponent gets possession, no second chance
          if (nextEvent.is_opponent_event !== isOpponent) {
            break;
          }
          
          // If same team gets an offensive rebound, look for the next score
          if (nextEvent.event_type === 'rebound' && 
              (nextEvent.metadata as any)?.reboundType === 'offensive') {
            foundRebound = true;
            
            // Now look for the next score by the same team
            let k = j + 1;
            
            while (k < sortedEvents.length) {
              const scoreEvent = sortedEvents[k];
              
              // If opponent does anything, break the chain
              if (scoreEvent.is_opponent_event !== isOpponent && (
                scoreEvent.event_type === 'fg_made' || 
                scoreEvent.event_type === 'fg_missed' || 
                scoreEvent.event_type === 'three_made' || 
                scoreEvent.event_type === 'three_missed' ||
                scoreEvent.event_type === 'ft_made' ||
                scoreEvent.event_type === 'ft_missed' ||
                scoreEvent.event_type === 'rebound' ||
                scoreEvent.event_type === 'steal' ||
                scoreEvent.event_type === 'block' ||
                scoreEvent.event_type === 'turnover'
              )) {
                break;
              }
              
              // If same team scores, count as second chance
              if (scoreEvent.is_opponent_event === isOpponent && 
                  (scoreEvent.event_type === 'fg_made' || scoreEvent.event_type === 'three_made')) {
                
                const points = scoreEvent.event_type === 'three_made' ? 3 : 2;
                secondChancePoints += points;
                break; // Found the score, move to next missed shot
              }
              
              k++;
            }
          }
          
          j++;
        }
      }
    }

    return secondChancePoints;
  }

  /**
   * Calculate offensive rebounds using metadata
   */
  private async calculateOffensiveRebounds(sessionId: number, isOpponent: boolean): Promise<number> {
    const { data: events, error } = await this.supabase
      .from('live_game_events')
      .select('event_type, is_opponent_event, metadata')
      .eq('session_id', sessionId)
      .eq('is_opponent_event', isOpponent)
      .eq('event_type', 'rebound')
      .is('deleted_at', null);

    if (error || !events) return 0;

    return events.filter(event => 
      (event.metadata as any)?.reboundType === 'offensive'
    ).length;
  }

  /**
   * Calculate defensive rebounds using metadata
   */
  private async calculateDefensiveRebounds(sessionId: number, isOpponent: boolean): Promise<number> {
    const { data: events, error } = await this.supabase
      .from('live_game_events')
      .select('event_type, is_opponent_event, metadata')
      .eq('session_id', sessionId)
      .eq('is_opponent_event', isOpponent)
      .eq('event_type', 'rebound')
      .is('deleted_at', null);

    if (error || !events) return 0;

    return events.filter(event => 
      (event.metadata as any)?.reboundType === 'defensive'
    ).length;
  }

  /**
   * Determine goal status based on actual vs target value
   */
  private determineStatus(
    actualValue: number, 
    targetValue: number, 
    operator: string
  ): 'on_track' | 'at_risk' | 'off_track' {
    const delta = actualValue - targetValue;
    const percentDiff = Math.abs(delta / targetValue) * 100;

    switch (operator) {
      case 'gte':
        if (actualValue >= targetValue) return 'on_track';
        if (percentDiff <= 10) return 'at_risk';
        return 'off_track';
      
      case 'lte':
        if (actualValue <= targetValue) return 'on_track';
        if (percentDiff <= 10) return 'at_risk';
        return 'off_track';
      
      case 'eq':
        if (percentDiff <= 5) return 'on_track';
        if (percentDiff <= 15) return 'at_risk';
        return 'off_track';
      
      default:
        return 'off_track';
    }
  }

  /**
   * Calculate rolling average over specified window
   */
  async calculateRollingAverage(
    goalId: number, 
    windowSize: number, 
    metric: any
  ): Promise<number> {
    // Get last N game sessions for this goal
    const { data: sessions, error } = await this.supabase
      .from('live_game_sessions')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(windowSize);

    if (error || !sessions || sessions.length === 0) {
      return 0;
    }

    const sessionIds = sessions.map(s => s.id);
    let totalValue = 0;
    let validSessions = 0;

    for (const sessionId of sessionIds) {
      const value = await this.calculateMetricValue(sessionId, metric);
      if (value > 0) {
        totalValue += value;
        validSessions++;
      }
    }

    return validSessions > 0 ? totalValue / validSessions : 0;
  }

  /**
   * Calculate goal progress for a specific session
   */
  async calculateGoalProgress(
    goalId: number, 
    sessionId: number
  ): Promise<GoalCalculationResult | null> {
    // Get goal with metric details
    const { data: goal, error: goalError } = await this.supabase
      .from('team_goals')
      .select(`
        *,
        stat_metrics (
          id,
          name,
          category,
          description,
          unit,
          calculation_type,
          event_types
        )
      `)
      .eq('id', goalId)
      .eq('status', 'active')
      .single();

    if (goalError || !goal) {
      console.error('Goal not found or inactive:', goalError);
      return null;
    }

    const metric = goal.stat_metrics;
    if (!metric) {
      console.error('Metric not found for goal:', goalId);
      return null;
    }

    let actualValue: number;

    // Calculate based on period type
    switch (goal.period_type) {
      case 'per_game':
        actualValue = await this.calculateMetricValue(sessionId, metric);
        break;
      
      case 'rolling_5':
        actualValue = await this.calculateRollingAverage(goalId, 5, metric);
        break;
      
      case 'rolling_10':
        actualValue = await this.calculateRollingAverage(goalId, 10, metric);
        break;
      
      case 'season_total':
        // For season total, we'd need to sum all sessions in the season
        // This is more complex and would require additional logic
        actualValue = await this.calculateMetricValue(sessionId, metric);
        break;
      
      default:
        actualValue = await this.calculateMetricValue(sessionId, metric);
    }

    const targetValue = goal.target_value;
    const delta = actualValue - targetValue;
    const status = this.determineStatus(actualValue, targetValue, goal.comparison_operator);

    return {
      goalId,
      sessionId,
      result: {
        actualValue,
        targetValue,
        delta,
        status
      }
    };
  }

  /**
   * Calculate all active goals for a session
   */
  async calculateAllGoalsForSession(sessionId: number): Promise<GoalCalculationResult[]> {
    // Get all active goals
    const { data: goals, error } = await this.supabase
      .from('team_goals')
      .select(`
        id,
        stat_metrics (
          id,
          name,
          category,
          description,
          unit,
          calculation_type,
          event_types
        )
      `)
      .eq('status', 'active');

    if (error || !goals) {
      console.error('Error fetching active goals:', error);
      return [];
    }

    const results: GoalCalculationResult[] = [];

    for (const goal of goals) {
      const result = await this.calculateGoalProgress(goal.id, sessionId);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Save goal progress to database
   */
  async saveGoalProgress(result: GoalCalculationResult): Promise<void> {
    const { goalId, sessionId, result: calcResult } = result;

    const { error } = await this.supabase
      .from('team_goal_progress')
      .insert({
        goal_id: goalId,
        game_session_id: sessionId,
        actual_value: calcResult.actualValue,
        target_value: calcResult.targetValue,
        delta: calcResult.delta,
        status: calcResult.status
      });

    if (error) {
      console.error('Error saving goal progress:', error);
      throw error;
    }
  }

  /**
   * Check for status changes and create notifications
   */
  async checkForStatusChanges(goalId: number, newStatus: string): Promise<void> {
    // COMMENTED OUT: Notification functionality disabled
    // Get previous status
    // const { data: previousProgress, error } = await this.supabase
    //   .from('team_goal_progress')
    //   .select('status')
    //   .eq('goal_id', goalId)
    //   .order('calculated_at', { ascending: false })
    //   .limit(1)
    //   .offset(1); // Skip the most recent (current) record

    // if (error || !previousProgress || previousProgress.length === 0) {
    //   return; // No previous status to compare
    // }

    // const previousStatus = previousProgress[0].status;
    
    // if (previousStatus !== newStatus) {
    //   // Status changed, create notification
    //   await this.createStatusChangeNotification(goalId, previousStatus, newStatus);
    // }
  }

  /**
   * Create notification for status change
   */
  private async createStatusChangeNotification(
    goalId: number, 
    previousStatus: string, 
    newStatus: string
  ): Promise<void> {
    // COMMENTED OUT: Notification functionality disabled
    // Get goal details
    // const { data: goal, error: goalError } = await this.supabase
    //   .from('team_goals')
    //   .select(`
    //     id,
    //     target_value,
    //     comparison_operator,
    //     stat_metrics (name)
    //   `)
    //   .eq('id', goalId)
    //   .single();

    // if (goalError || !goal) {
    //   console.error('Error fetching goal for notification:', goalError);
    //   return;
    // }

    // const metricName = goal.stat_metrics?.name || 'Unknown Metric';
    // const operator = goal.comparison_operator === 'gte' ? '≥' : 
    //                goal.comparison_operator === 'lte' ? '≤' : '=';
    
    // let message = '';
    // let notificationType = '';

    // switch (newStatus) {
    //   case 'at_risk':
    //     message = `${metricName} goal is at risk (${operator} ${goal.target_value})`;
    //     notificationType = 'GOAL_AT_RISK';
    //     break;
    //   case 'off_track':
    //     message = `${metricName} goal is off track (${operator} ${goal.target_value})`;
    //     notificationType = 'GOAL_OFF_TRACK';
    //     break;
    //   case 'on_track':
    //     message = `${metricName} goal is back on track (${operator} ${goal.target_value})`;
    //     notificationType = 'GOAL_ACHIEVED';
    //     break;
    // }

    // if (message && notificationType) {
    //   // Create notification for the goal creator
    //   await this.supabase
    //     .from('notifications')
    //     .insert({
    //       userId: goal.created_by,
    //       type: notificationType,
    //       title: 'Goal Status Update',
    //       message,
    //       data: { goalId }
    //     });
    // }
  }
}

export const goalCalculationService = new GoalCalculationService();
