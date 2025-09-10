# Live Stats Tracker Testing Guide

## 🎯 Objective
Systematically test and verify the entire live statistics tracking system to identify and fix all issues.

## 📋 Pre-Test Setup

1. **Ensure you're logged into the app**
2. **Navigate to the live stat tracker page**
3. **Have the test files ready** (`test-live-stats.html` and `test-live-stats-tracker.js`)

## 🧪 Test Suite Overview

The automated test suite will verify:

1. **Database Connection** - Can we connect to Supabase?
2. **Game Session Creation** - Can we create a live game session?
3. **Event Recording** - Can we record team and opponent events?
4. **Database Storage** - Are events being saved with correct foreign keys?
5. **Statistics Calculation** - Are team stats calculated correctly?
6. **UI Data Consistency** - Does the UI show the right data?
7. **Error Handling** - Does the system handle errors gracefully?

## 🚀 Running the Tests

### Method 1: HTML Test Page (Recommended)

1. **Open the test page** in your browser:
   ```
   file:///path/to/test-live-stats.html
   ```

2. **Click "Run All Tests"** to run the complete test suite

3. **Review the results** in the console and results section

4. **Take screenshots** of any failures or unexpected results

### Method 2: Browser Console

1. **Open the live stat tracker page** in your browser
2. **Open Developer Tools** (F12)
3. **Go to Console tab**
4. **Load the test script**:
   ```javascript
   // Copy and paste the contents of test-live-stats-tracker.js
   ```

5. **Run the tests**:
   ```javascript
   const testSuite = new LiveStatsTrackerTest();
   await testSuite.runAllTests();
   ```

## 📊 Expected Results

### ✅ Success Indicators

- **Database Connection**: Should connect successfully
- **Session Creation**: Should create session with valid game_id
- **Event Recording**: Should record both team and opponent events
- **Database Storage**: Events should be saved with proper game_id foreign key
- **Statistics**: Team and opponent stats should be calculated correctly
- **UI Consistency**: Display should match calculated data

### ❌ Common Issues to Look For

1. **game_id is null** - Events not linking to game record
2. **Events not saving** - Database write failures
3. **Statistics mismatch** - UI showing different data than calculated
4. **Opponent events missing** - Opponent stats not being tracked
5. **Foreign key errors** - Database constraint violations

## 🔍 Debugging Steps

### If Tests Fail:

1. **Check the console output** for specific error messages
2. **Verify database permissions** - Can the app write to live_game_events?
3. **Check network requests** - Are API calls succeeding?
4. **Verify session state** - Is the game session active?
5. **Check foreign key constraints** - Are game_id values valid?

### If Statistics Don't Match:

1. **Check event filtering** - Are opponent events being filtered correctly?
2. **Verify calculation logic** - Are points/assists being calculated properly?
3. **Check UI data source** - Is the UI pulling from the right data?
4. **Verify state updates** - Are player stats being updated correctly?

## 📸 Screenshots to Take

When you run the tests, please take screenshots of:

1. **Test results page** - Overall pass/fail status
2. **Console output** - Any error messages or warnings
3. **Database queries** - If you can access the database directly
4. **Network tab** - Failed API requests
5. **Live stat tracker UI** - Current state of the interface

## 🔄 Iterative Testing Process

1. **Run the test suite**
2. **Identify failing tests**
3. **Fix the issues** (I'll help with this)
4. **Re-run the tests**
5. **Repeat until all tests pass**

## 📝 Test Data

The test will create:
- **1 game session** with event ID 16
- **2 test events** (1 team, 1 opponent)
- **Expected results**: Team should have 2 points, Opponent should have 2 points

## 🎯 Success Criteria

The live stats tracker is working correctly when:
- ✅ All automated tests pass
- ✅ Events are saved to database with correct foreign keys
- ✅ Team comparison shows accurate statistics
- ✅ Play-by-play displays all recorded events
- ✅ No console errors or warnings
- ✅ UI data matches database data

## 🆘 Getting Help

If you encounter issues:
1. **Share the test results** (screenshots or console output)
2. **Describe what you expected** vs what happened
3. **Include any error messages** you see
4. **Note which specific test failed** and why

This systematic approach will help us identify and fix all the issues with the live stats tracker!
