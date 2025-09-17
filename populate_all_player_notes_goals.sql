-- Populate notes and goals for all players
-- Run this script in your Supabase SQL editor

-- First, clean up any existing notes with null player_id
DELETE FROM player_notes WHERE player_id IS NULL;

-- Insert notes for all players using correct schema
INSERT INTO player_notes (player_id, note_text, "playerId", note, "isPublic", tags, "createdAt", "createdBy", "updatedAt", "updatedBy", "created_at")
SELECT 
    p.id,
    CASE 
        WHEN p.name = 'Andrew Farrell' THEN 'Team captain and vocal leader. Excellent work ethic and basketball IQ. Needs to improve consistency from beyond the arc.'
        WHEN p.name = 'Joey Iannetta' THEN 'Quick guard with good ball handling. Needs to work on defensive positioning and shot selection.'
        WHEN p.name = 'Micah Roberson' THEN 'Strong rebounder and defender. Developing offensive game and free throw shooting.'
        WHEN p.name = 'Bryan Davis' THEN 'Versatile forward with good size. Working on consistency and decision making under pressure.'
        WHEN p.name = 'Eric Cooperman' THEN 'Skilled shooter with range. Needs to improve defensive intensity and ball handling.'
        WHEN p.name = 'Sub 1' THEN 'Backup player providing depth. Working on fundamentals and game awareness.'
        WHEN p.name = 'Charles Johnston' THEN 'Physical presence in the paint. Developing post moves and free throw shooting.'
        WHEN p.name = 'Eddrin Bronson' THEN 'Athletic wing player. Working on shot consistency and defensive communication.'
        WHEN p.name = 'Ben VanderWal' THEN 'Smart player with good court vision. Needs to improve shooting and physicality.'
        WHEN p.name = 'Mason Smith' THEN 'Hardworking player with good attitude. Developing all-around skills and confidence.'
        WHEN p.name = 'Tom House' THEN 'Reliable role player. Working on offensive skills and defensive positioning.'
        WHEN p.name = 'Cooper Bowser' THEN 'Young player with potential. Focus on fundamentals and game understanding.'
        WHEN p.name = 'Davis Molnar' THEN 'Developing player with good work ethic. Working on shooting and ball handling.'
        ELSE 'Player notes to be added'
    END,
    p.id,
    CASE 
        WHEN p.name = 'Andrew Farrell' THEN 'Team captain and vocal leader. Excellent work ethic and basketball IQ. Needs to improve consistency from beyond the arc.'
        WHEN p.name = 'Joey Iannetta' THEN 'Quick guard with good ball handling. Needs to work on defensive positioning and shot selection.'
        WHEN p.name = 'Micah Roberson' THEN 'Strong rebounder and defender. Developing offensive game and free throw shooting.'
        WHEN p.name = 'Bryan Davis' THEN 'Versatile forward with good size. Working on consistency and decision making under pressure.'
        WHEN p.name = 'Eric Cooperman' THEN 'Skilled shooter with range. Needs to improve defensive intensity and ball handling.'
        WHEN p.name = 'Sub 1' THEN 'Backup player providing depth. Working on fundamentals and game awareness.'
        WHEN p.name = 'Charles Johnston' THEN 'Physical presence in the paint. Developing post moves and free throw shooting.'
        WHEN p.name = 'Eddrin Bronson' THEN 'Athletic wing player. Working on shot consistency and defensive communication.'
        WHEN p.name = 'Ben VanderWal' THEN 'Smart player with good court vision. Needs to improve shooting and physicality.'
        WHEN p.name = 'Mason Smith' THEN 'Hardworking player with good attitude. Developing all-around skills and confidence.'
        WHEN p.name = 'Tom House' THEN 'Reliable role player. Working on offensive skills and defensive positioning.'
        WHEN p.name = 'Cooper Bowser' THEN 'Young player with potential. Focus on fundamentals and game understanding.'
        WHEN p.name = 'Davis Molnar' THEN 'Developing player with good work ethic. Working on shooting and ball handling.'
        ELSE 'Player notes to be added'
    END,
    false,
    ARRAY[]::text[],
    NOW(),
    1,
    NOW(),
    1,
    NOW()
FROM players p
WHERE NOT EXISTS (
    SELECT 1 FROM player_notes pn WHERE pn.player_id = p.id
);

-- Insert goals for all players using correct schema
INSERT INTO player_goals (player_id, goal_text, "playerId", goal, "targetDate", "isAchieved", "achievedAt", category, "createdAt", "createdBy", "updatedAt", "updatedBy", "created_at")
SELECT 
    p.id,
    CASE 
        WHEN p.name = 'Andrew Farrell' THEN 'Improve three-point percentage to 35% by end of season'
        WHEN p.name = 'Joey Iannetta' THEN 'Increase assists per game to 4.0 and reduce turnovers'
        WHEN p.name = 'Micah Roberson' THEN 'Improve free throw shooting to 75% and develop mid-range game'
        WHEN p.name = 'Bryan Davis' THEN 'Work on consistency in scoring and decision making under pressure'
        WHEN p.name = 'Eric Cooperman' THEN 'Improve defensive intensity and ball handling skills'
        WHEN p.name = 'Sub 1' THEN 'Focus on fundamentals and increase game awareness'
        WHEN p.name = 'Charles Johnston' THEN 'Develop post moves and improve free throw shooting to 70%'
        WHEN p.name = 'Eddrin Bronson' THEN 'Work on shot consistency and defensive communication'
        WHEN p.name = 'Ben VanderWal' THEN 'Improve shooting percentage and increase physicality on defense'
        WHEN p.name = 'Mason Smith' THEN 'Develop all-around skills and build confidence in game situations'
        WHEN p.name = 'Tom House' THEN 'Work on offensive skills and defensive positioning'
        WHEN p.name = 'Cooper Bowser' THEN 'Focus on fundamentals and improve game understanding'
        WHEN p.name = 'Davis Molnar' THEN 'Improve shooting and ball handling skills'
        ELSE 'Player goals to be added'
    END,
    p.id,
    CASE 
        WHEN p.name = 'Andrew Farrell' THEN 'Improve three-point percentage to 35% by end of season'
        WHEN p.name = 'Joey Iannetta' THEN 'Increase assists per game to 4.0 and reduce turnovers'
        WHEN p.name = 'Micah Roberson' THEN 'Improve free throw shooting to 75% and develop mid-range game'
        WHEN p.name = 'Bryan Davis' THEN 'Work on consistency in scoring and decision making under pressure'
        WHEN p.name = 'Eric Cooperman' THEN 'Improve defensive intensity and ball handling skills'
        WHEN p.name = 'Sub 1' THEN 'Focus on fundamentals and increase game awareness'
        WHEN p.name = 'Charles Johnston' THEN 'Develop post moves and improve free throw shooting to 70%'
        WHEN p.name = 'Eddrin Bronson' THEN 'Work on shot consistency and defensive communication'
        WHEN p.name = 'Ben VanderWal' THEN 'Improve shooting percentage and increase physicality on defense'
        WHEN p.name = 'Mason Smith' THEN 'Develop all-around skills and build confidence in game situations'
        WHEN p.name = 'Tom House' THEN 'Work on offensive skills and defensive positioning'
        WHEN p.name = 'Cooper Bowser' THEN 'Focus on fundamentals and improve game understanding'
        WHEN p.name = 'Davis Molnar' THEN 'Improve shooting and ball handling skills'
        ELSE 'Player goals to be added'
    END,
    '2025-03-01'::timestamp,
    false,
    NULL,
    'Development',
    NOW(),
    1,
    NOW(),
    1,
    NOW()
FROM players p
WHERE NOT EXISTS (
    SELECT 1 FROM player_goals pg WHERE pg.player_id = p.id
);

-- Verify the data was inserted
SELECT 
    p.id, 
    p.name,
    (SELECT COUNT(*) FROM player_notes WHERE player_id = p.id) as notes_count,
    (SELECT COUNT(*) FROM player_goals WHERE player_id = p.id) as goals_count
FROM players p 
ORDER BY p.id;



