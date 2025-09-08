# Database Field Mapping Guide

Based on the actual database schema check, here are the correct field names to use for each table.

## ✅ Events Table (camelCase - WORKING)
```typescript
{
  id: number,
  name: string,
  description: string,
  eventTypeId: number,        // ✅ Use this
  startTime: string,          // ✅ Use this
  endTime: string,            // ✅ Use this
  location: string,           // ✅ Use this
  venue: string,              // ✅ Use this
  oppositionTeam: string,     // ✅ Use this
  isRepeat: boolean,          // ✅ Use this
  occurence: number,          // ✅ Use this
  isNotice: boolean,          // ✅ Use this
  notes: string,              // ✅ Use this
  createdAt: string,          // ✅ Use this
  createdBy: number,          // ✅ Use this
  updatedAt: string,          // ✅ Use this
  updatedBy: number           // ✅ Use this
}
```

## ⚠️ Players Table (Mixed - Use camelCase fields)
```typescript
{
  id: number,
  name: string,
  positionId: number,         // ✅ Use this (camelCase)
  jersey: string,             // ✅ Use this (camelCase)
  phoneNumber: string,        // ✅ Use this (camelCase)
  email: string,              // ✅ Use this (camelCase)
  height: number,             // ✅ Use this (camelCase)
  weight: number,             // ✅ Use this (camelCase)
  avatar: string,             // ✅ Use this (camelCase)
  birthDate: string,          // ✅ Use this (camelCase)
  isActive: boolean,          // ✅ Use this (camelCase)
  createdAt: string,          // ✅ Use this (camelCase)
  createdBy: number,          // ✅ Use this (camelCase)
  updatedAt: string,          // ✅ Use this (camelCase)
  updatedBy: number,          // ✅ Use this (camelCase)
  
  // ⚠️ These are snake_case but we should use camelCase equivalents
  // user_id: string,         // ❌ Don't use - use createdBy instead
  // first_name: string,      // ❌ Don't use - use firstName instead
  // last_name: string,       // ❌ Don't use - use lastName instead
  // profile_id: number,      // ❌ Don't use - use profileId instead
  // school_year: string,     // ❌ Don't use - use schoolYear instead
  // jersey_number: string,   // ❌ Don't use - use jersey instead
  // is_active: boolean,      // ❌ Don't use - use isActive instead
}
```

## ⚠️ Tasks Table (Mixed - Use camelCase fields)
```typescript
{
  id: number,
  name: string,
  description: string,
  dueDate: string,            // ✅ Use this (camelCase)
  priorityId: number,         // ✅ Use this (camelCase)
  status: string,             // ✅ Use this (camelCase)
  eventId: number,            // ✅ Use this (camelCase)
  createdAt: string,          // ✅ Use this (camelCase)
  createdBy: number,          // ✅ Use this (camelCase)
  updatedAt: string,          // ✅ Use this (camelCase)
  updatedBy: number           // ✅ Use this (camelCase)
}
```

## ⚠️ Player Notes Table (Mixed - Use camelCase fields)
```typescript
{
  id: number,
  playerId: number,           // ✅ Use this (camelCase)
  note: string,               // ✅ Use this (camelCase)
  isPublic: boolean,          // ✅ Use this (camelCase)
  tags: string[],             // ✅ Use this (camelCase)
  createdAt: string,          // ✅ Use this (camelCase)
  createdBy: number,          // ✅ Use this (camelCase)
  updatedAt: string,          // ✅ Use this (camelCase)
  updatedBy: number,          // ✅ Use this (camelCase)
  
  // ⚠️ These are snake_case but we should use camelCase equivalents
  // player_id: number,       // ❌ Don't use - use playerId instead
  // note_text: string,       // ❌ Don't use - use note instead
  // user_id: number,         // ❌ Don't use - use createdBy instead
}
```

## ⚠️ Player Goals Table (Mixed - Use camelCase fields)
```typescript
{
  id: number,
  playerId: number,           // ✅ Use this (camelCase)
  goal: string,               // ✅ Use this (camelCase)
  targetDate: string,         // ✅ Use this (camelCase)
  isAchieved: boolean,        // ✅ Use this (camelCase)
  achievedAt: string,         // ✅ Use this (camelCase)
  category: string,           // ✅ Use this (camelCase)
  createdAt: string,          // ✅ Use this (camelCase)
  createdBy: number,          // ✅ Use this (camelCase)
  updatedAt: string,          // ✅ Use this (camelCase)
  updatedBy: number,          // ✅ Use this (camelCase)
  
  // ⚠️ These are snake_case but we should use camelCase equivalents
  // player_id: number,       // ❌ Don't use - use playerId instead
  // goal_text: string,       // ❌ Don't use - use goal instead
  // user_id: number,         // ❌ Don't use - use createdBy instead
}
```

## ✅ Budgets Table (camelCase - WORKING)
```typescript
{
  id: number,
  name: string,
  amount: number,             // ✅ Use this
  period: string,             // ✅ Use this
  autoRepeat: boolean,        // ✅ Use this
  description: string,        // ✅ Use this
  categoryId: number,         // ✅ Use this
  season: string,             // ✅ Use this
  createdAt: string,          // ✅ Use this
  createdBy: number,          // ✅ Use this
  updatedAt: string,          // ✅ Use this
  updatedBy: number           // ✅ Use this
}
```

## ✅ Expenses Table (camelCase - WORKING)
```typescript
{
  id: number,
  budgetId: number,           // ✅ Use this
  merchant: string,           // ✅ Use this
  amount: number,             // ✅ Use this
  category: string,           // ✅ Use this
  date: string,               // ✅ Use this
  eventId: number,            // ✅ Use this
  description: string,        // ✅ Use this
  receiptUrl: string,         // ✅ Use this
  createdAt: string,          // ✅ Use this
  createdBy: number,          // ✅ Use this
  updatedAt: string,          // ✅ Use this
  updatedBy: number           // ✅ Use this
}
```

## ✅ Event Types Table (Mixed - Use camelCase fields)
```typescript
{
  id: number,
  name: string,               // ✅ Use this
  color: string,              // ✅ Use this
  icon: string,               // ✅ Use this
  createdAt: string,          // ✅ Use this (camelCase)
  createdBy: number,          // ✅ Use this (camelCase)
  updatedAt: string,          // ✅ Use this (camelCase)
  updatedBy: number,          // ✅ Use this (camelCase)
  
  // ⚠️ These are snake_case but we should use camelCase equivalents
  // created_at: string,      // ❌ Don't use - use createdAt instead
  // updated_at: string,      // ❌ Don't use - use updatedAt instead
}
```

## ✅ Task Priorities Table (camelCase - WORKING)
```typescript
{
  id: number,
  name: string,               // ✅ Use this
  weight: number,             // ✅ Use this
  color: string,              // ✅ Use this
  createdAt: string,          // ✅ Use this
  createdBy: number,          // ✅ Use this
  updatedAt: string,          // ✅ Use this
  updatedBy: number           // ✅ Use this
}
```

## ✅ Positions Table (camelCase - WORKING)
```typescript
{
  id: number,
  name: string,               // ✅ Use this
  abbreviation: string,       // ✅ Use this
  description: string,        // ✅ Use this
  createdAt: string,          // ✅ Use this
  createdBy: number,          // ✅ Use this
  updatedAt: string,          // ✅ Use this
  updatedBy: number           // ✅ Use this
}
```

## ✅ Profiles Table (snake_case - WORKING)
```typescript
{
  id: string,                 // ✅ Use this
  user_id: string,            // ✅ Use this
  profile_number: number,     // ✅ Use this
  first_name: string,         // ✅ Use this
  last_name: string,          // ✅ Use this
  email: string,              // ✅ Use this
  created_at: string,         // ✅ Use this
  updated_at: string          // ✅ Use this
}
```

## ⚠️ Users Table (Mixed - Use camelCase fields)
```typescript
{
  id: number,                 // ✅ Use this
  username: string,           // ✅ Use this
  email: string,              // ✅ Use this
  password: string,           // ✅ Use this
  isActive: boolean,          // ✅ Use this (camelCase)
  role: string,               // ✅ Use this
  profileId: number,          // ✅ Use this (camelCase)
  createdAt: string,          // ✅ Use this (camelCase)
  createdBy: number,          // ✅ Use this (camelCase)
  updatedAt: string,          // ✅ Use this (camelCase)
  updatedBy: number,          // ✅ Use this (camelCase)
  
  // ⚠️ These are snake_case but we should use camelCase equivalents
  // is_active: boolean,      // ❌ Don't use - use isActive instead
  // profile_id: number,      // ❌ Don't use - use profileId instead
  // created_at: string,      // ❌ Don't use - use createdAt instead
  // updated_at: string,      // ❌ Don't use - use updatedAt instead
}
```

## 🎯 Key Takeaway

**ALWAYS use the camelCase field names** for consistency, even when snake_case versions exist. The database appears to be in a transitional state where both naming conventions exist for the same data.

**For the events table specifically**: The current implementation is correct and should work.
