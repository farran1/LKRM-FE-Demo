// Local storage service for managing demo data and app state
export const localStorageService = {
  // Reset all demo data to defaults
  resetToDefaults() {
    try {
      // Clear all localStorage data
      localStorage.clear();
      
      // Set default demo data
      const defaultData = {
        events: [
          {
            id: 1,
            name: 'Demo Game vs Lakers',
            startTime: new Date().toISOString(),
            eventType: { name: 'Game', color: '#1890ff' },
            venue: 'Home Court',
            location: 'HOME'
          }
        ],
        players: [
          { id: 1, name: 'John Doe', jersey: '23', position: 'PG' },
          { id: 2, name: 'Jane Smith', jersey: '24', position: 'SG' },
          { id: 3, name: 'Mike Johnson', jersey: '25', position: 'SF' },
          { id: 4, name: 'Sarah Wilson', jersey: '26', position: 'PF' },
          { id: 5, name: 'Tom Brown', jersey: '27', position: 'C' }
        ],
        settings: {
          totalQuarters: 4,
          quarterDuration: 12,
          timeoutDuration: 60
        }
      };

      // Store default data
      Object.entries(defaultData).forEach(([key, value]) => {
        localStorage.setItem(`demo_${key}`, JSON.stringify(value));
      });

      return true;
    } catch (error) {
      console.error('Error resetting to defaults:', error);
      return false;
    }
  },

  // Clear all data
  clearAll() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  },

  // Get data by key
  getData(key: string) {
    try {
      const data = localStorage.getItem(`demo_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error getting data for key ${key}:`, error);
      return null;
    }
  },

  // Set data by key
  setData(key: string, value: any) {
    try {
      localStorage.setItem(`demo_${key}`, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting data for key ${key}:`, error);
      return false;
    }
  },

  // Check if demo data exists
  hasDemoData() {
    const keys = ['events', 'players', 'settings'];
    return keys.some(key => localStorage.getItem(`demo_${key}`) !== null);
  },

  // Get specific data types (for compatibility with existing code)
  getEvents() {
    return this.getData('events') || [];
  },

  getTasks() {
    return this.getData('tasks') || [];
  },

  getPlayers() {
    return this.getData('players') || [];
  },

  getPriorities() {
    return this.getData('priorities') || [];
  }
};
