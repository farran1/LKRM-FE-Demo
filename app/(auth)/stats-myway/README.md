# Stats My Way - Customizable Dashboard

## Overview
A fully customizable basketball analytics dashboard where coaches can turn individual modules on/off and apply advanced filtering and sorting options to create their perfect analytics view.

## 🎯 **Core Features**

### **Customizable Modules**
Coaches can toggle individual modules on/off to build their ideal dashboard:

#### **Available Modules:**
- **Team Overview** - Season record, win percentage, key metrics
- **Player Statistics** - Individual player performance data with filtering
- **Scoring Trends** - Team scoring patterns over time
- **Player Comparison** - Side-by-side player analysis charts
- **Shooting Analysis** - Field goal percentages and top shooters
- **Game Results** - Recent game outcomes and margins

### **Advanced Filtering & Sorting**
- **Player Search** - Search by player name
- **Position Filter** - Filter by position (PG, SG, SF, PF, C)
- **Sort Options** - Sort by PPG, APG, RPG, SPG, FG%, Games
- **Sort Order** - Highest first or lowest first
- **Real-time Updates** - Filters apply instantly across all modules

### **Professional Interface**
- **Customization Drawer** - Easy module management
- **Filter & Sort Drawer** - Advanced filtering options
- **Responsive Design** - Works on all screen sizes
- **Dark Theme** - Consistent with LKRM platform

## 🏀 **Module Details**

### **Team Overview Module**
- Season record display
- Win percentage calculation
- Average points for/against
- Key performance indicators

### **Player Statistics Module**
- Complete player data table
- PPG, APG, RPG, SPG, FG%, Games
- Position tags and color coding
- Hover effects and responsive design

### **Scoring Trends Module**
- Line chart showing team scoring
- Points for vs points against
- Game-by-game progression
- Interactive tooltips

### **Player Comparison Module**
- Bar charts comparing players
- PPG comparison visualization
- FG% comparison analysis
- Top 5 players display

### **Shooting Analysis Module**
- Pie chart by position
- Top shooters ranking
- Position-based analysis
- Percentage breakdowns

### **Game Results Module**
- Recent game outcomes
- Win/loss indicators
- Score margins
- Opponent information

## 🎛️ **Customization Features**

### **Module Management**
- Toggle modules on/off with switches
- Module categories (Team, Players, Analytics)
- Icon and description for each module
- Real-time dashboard updates

### **Filter Options**
- **Search**: Find players by name
- **Position**: Filter by basketball positions
- **Sort By**: Multiple statistical categories
- **Sort Order**: Ascending or descending

### **User Experience**
- Smooth animations and transitions
- Professional dark theme styling
- Mobile-responsive design
- Intuitive navigation

## 📊 **Data Structure**

### **Player Data**
```typescript
interface Player {
  id: number;
  name: string;
  position: string;
  ppg: number;
  apg: number;
  rpg: number;
  spg: number;
  fgPercentage: number;
  games: number;
}
```

### **Team Data**
```typescript
interface TeamData {
  overallRecord: string;
  winPercentage: number;
  avgPointsFor: number;
  avgPointsAgainst: number;
  seasonTrends: GameTrend[];
}
```

## 🎨 **Design Features**

### **Visual Elements**
- Professional charts using Recharts
- Color-coded statistics
- Hover effects and animations
- Consistent dark theme

### **Layout System**
- Responsive grid layout
- Flexible module sizing
- Mobile-optimized design
- Professional spacing

### **Interactive Elements**
- Drawer-based customization
- Real-time filtering
- Smooth transitions
- Professional buttons and controls

## 🚀 **Usage Instructions**

### **Customizing Your Dashboard**
1. Click "Customize Dashboard" button
2. Toggle modules on/off using switches
3. Modules update in real-time
4. Save your preferences

### **Filtering & Sorting**
1. Click "Filter & Sort" button
2. Search for specific players
3. Select position filters
4. Choose sort criteria and order
5. Apply changes instantly

### **Module Interaction**
- Hover over modules for effects
- Click filter/sort buttons in modules
- View detailed statistics
- Explore different data views

## 🔧 **Technical Implementation**

### **State Management**
- React hooks for module state
- Filter and sort state management
- Real-time data updates
- Responsive state handling

### **Component Architecture**
- Modular component design
- Reusable chart components
- Drawer-based customization
- Professional UI components

### **Styling System**
- SCSS modules for scoped styling
- Dark theme consistency
- Responsive design patterns
- Professional animations

## 📱 **Responsive Design**

### **Desktop View**
- Full module grid layout
- Side-by-side customization
- Professional spacing
- Complete feature set

### **Tablet View**
- Adjusted grid sizing
- Optimized drawer widths
- Touch-friendly controls
- Maintained functionality

### **Mobile View**
- Single column layout
- Full-width drawers
- Simplified interactions
- Core features preserved

## 🎯 **Future Enhancements**

### **Planned Features**
- **Saved Configurations** - Save custom dashboard layouts
- **Advanced Analytics** - More statistical models
- **Real-time Data** - Live game integration
- **Export Options** - PDF and Excel export
- **User Preferences** - Personalized settings
- **Advanced Charts** - More visualization types

### **Development Roadmap**
- **Phase 1**: ✅ Core customization (Complete)
- **Phase 2**: ⏳ Advanced analytics (In Progress)
- **Phase 3**: ⏳ Real-time features (Planned)
- **Phase 4**: ⏳ Export and sharing (Planned)

## 🛠️ **Technologies Used**
- Next.js 14 with App Router
- React 18 with Hooks
- TypeScript for type safety
- Ant Design for UI components
- Recharts for data visualization
- SCSS Modules for styling
- Professional dark theme

## 📁 **File Structure**
```
stats-myway/
├── page.tsx              # Main dashboard component
├── style.module.scss     # Comprehensive styling
└── README.md            # This documentation
```

## 🎉 **Key Benefits**
- **Fully Customizable** - Build your perfect dashboard
- **Advanced Filtering** - Find exactly what you need
- **Professional Design** - Consistent with LKRM platform
- **Mobile Responsive** - Works on all devices
- **Real-time Updates** - Instant filtering and sorting
- **Extensible Architecture** - Easy to add new modules 