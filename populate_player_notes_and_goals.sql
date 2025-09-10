-- Populate Player Notes and Goals for LKRM Roster
-- This script adds comprehensive notes and goals for all active players

-- Player Notes - Position-specific and individual notes
INSERT INTO player_notes ("playerId", note, "createdBy", "updatedBy")
VALUES 
-- Andrew Farrell (Forward #1)
(18, 'Team captain and vocal leader. Excellent work ethic and basketball IQ. Needs to improve consistency from beyond the arc.', 1, 1),
(18, 'Strong rebounder for his position. Can defend multiple positions effectively.', 1, 1),
(18, 'Great at motivating teammates during tough stretches. Natural leader on and off the court.', 1, 1),

-- Ben VanderWal (Forward #4)
(26, 'High-energy player with great athleticism. Excellent at running the floor in transition.', 1, 1),
(26, 'Needs to work on shot selection and decision-making under pressure.', 1, 1),
(26, 'Strong defensive instincts and good at contesting shots without fouling.', 1, 1),

-- Bryan Davis (Center #6)
(21, 'Dominant presence in the paint. Excellent shot blocker and rim protector.', 1, 1),
(21, 'Needs to improve free throw shooting and develop a consistent post move.', 1, 1),
(21, 'Great at setting screens and creating space for teammates. Strong rebounder.', 1, 1),

-- Charles Johnston (Forward #10)
(24, 'Versatile forward who can play inside and out. Good shooting touch from mid-range.', 1, 1),
(24, 'Needs to improve defensive footwork and lateral quickness.', 1, 1),
(24, 'Excellent teammate who always puts team success first.', 1, 1),

-- Cooper Bowser (Center #21)
(29, 'Young center with tremendous upside. Raw talent that needs refinement.', 1, 1),
(29, 'Excellent size and length. Needs to work on conditioning and basketball fundamentals.', 1, 1),
(29, 'Shows flashes of brilliance but needs consistency in practice and games.', 1, 1),

-- Davis Molnar (Forward #77)
(30, 'Skilled forward with good ball-handling for his size. Can create his own shot.', 1, 1),
(30, 'Needs to improve defensive intensity and rebounding effort.', 1, 1),
(30, 'Good passer who sees the floor well. Can play multiple positions.', 1, 1),

-- Eddrin Bronson (Guard #22)
(25, 'Explosive guard with great speed and quickness. Excellent at getting to the rim.', 1, 1),
(25, 'Needs to improve three-point shooting and decision-making in pick-and-roll situations.', 1, 1),
(25, 'Great defender who can pressure the ball and create turnovers.', 1, 1),

-- Eric Cooperman (Guard #3)
(22, 'Steady point guard with good court vision. Excellent at running the offense.', 1, 1),
(22, 'Needs to improve three-point shooting and become more aggressive looking for his shot.', 1, 1),
(22, 'Great leader who keeps teammates organized and focused.', 1, 1),

-- Joey Iannetta (Center #15)
(19, 'Skilled big man with good footwork in the post. Can score with both hands.', 1, 1),
(19, 'Needs to improve defensive positioning and shot blocking timing.', 1, 1),
(19, 'Excellent passer out of the post. Good basketball IQ and understanding of the game.', 1, 1),

-- Mason Smith (Forward #5)
(27, 'Hard-working forward who does the little things well. Great teammate.', 1, 1),
(27, 'Needs to improve offensive skills and become more confident with the ball.', 1, 1),
(27, 'Excellent rebounder who boxes out well and pursues loose balls.', 1, 1),

-- Micah Roberson (Guard #25)
(20, 'Combo guard with good size and athleticism. Can play both guard positions.', 1, 1),
(20, 'Needs to improve consistency and decision-making under pressure.', 1, 1),
(20, 'Good shooter who can stretch the defense. Needs to improve ball-handling.', 1, 1),

-- Sub 1 (Center #11)
(23, 'Backup center who provides depth and energy off the bench.', 1, 1),
(23, 'Needs to improve offensive skills and develop a go-to move in the post.', 1, 1),
(23, 'Good rebounder who plays with high energy and effort.', 1, 1),

-- Tom House (Guard #12)
(28, 'Shooting guard with excellent range and quick release. Can get hot from three.', 1, 1),
(28, 'Needs to improve ball-handling and ability to create shots for others.', 1, 1),
(28, 'Good defender who understands team concepts and rotations.', 1, 1);

-- Player Goals - Position-specific and individual goals
INSERT INTO player_goals ("playerId", goal, "targetDate", "isAchieved", "createdBy", "updatedBy")
VALUES 
-- Andrew Farrell (Forward #1) - Goals
(18, 'Improve three-point percentage to 35%', '2025-03-01', false, 1, 1),
(18, 'Increase assists per game to 4.0', '2025-03-01', false, 1, 1),
(18, 'Maintain leadership role and team chemistry', '2025-03-01', false, 1, 1),

-- Ben VanderWal (Forward #4) - Goals
(26, 'Improve shot selection and FG% to 45%', '2025-03-01', false, 1, 1),
(26, 'Increase rebounds per game to 8.0', '2025-03-01', false, 1, 1),
(26, 'Reduce turnovers per game to 2.0', '2025-03-01', false, 1, 1),

-- Bryan Davis (Center #6) - Goals
(21, 'Improve free throw percentage to 70%', '2025-03-01', false, 1, 1),
(21, 'Increase blocks per game to 2.5', '2025-03-01', false, 1, 1),
(21, 'Develop a consistent post move', '2025-03-01', false, 1, 1),

-- Charles Johnston (Forward #10) - Goals
(24, 'Improve three-point shooting to 32%', '2025-03-01', false, 1, 1),
(24, 'Increase defensive intensity', '2025-03-01', false, 1, 1),
(24, 'Improve lateral quickness', '2025-03-01', false, 1, 1),

-- Cooper Bowser (Center #21) - Goals
(29, 'Improve conditioning and stamina', '2025-03-01', false, 1, 1),
(29, 'Develop basic post moves', '2025-03-01', false, 1, 1),
(29, 'Increase practice intensity', '2025-03-01', false, 1, 1),

-- Davis Molnar (Forward #77) - Goals
(30, 'Improve defensive effort', '2025-03-01', false, 1, 1),
(30, 'Increase rebounds per game to 7.0', '2025-03-01', false, 1, 1),
(30, 'Improve three-point percentage to 30%', '2025-03-01', false, 1, 1),

-- Eddrin Bronson (Guard #22) - Goals
(25, 'Improve three-point shooting to 28%', '2025-03-01', false, 1, 1),
(25, 'Increase assists per game to 5.0', '2025-03-01', false, 1, 1),
(25, 'Improve pick-and-roll decision making', '2025-03-01', false, 1, 1),

-- Eric Cooperman (Guard #3) - Goals
(22, 'Improve three-point percentage to 32%', '2025-03-01', false, 1, 1),
(22, 'Increase scoring aggressiveness', '2025-03-01', false, 1, 1),
(22, 'Maintain assist-to-turnover ratio of 3.0', '2025-03-01', false, 1, 1),

-- Joey Iannetta (Center #15) - Goals
(19, 'Improve defensive positioning', '2025-03-01', false, 1, 1),
(19, 'Increase blocks per game to 2.0', '2025-03-01', false, 1, 1),
(19, 'Develop go-to post move', '2025-03-01', false, 1, 1),

-- Mason Smith (Forward #5) - Goals
(27, 'Improve offensive confidence', '2025-03-01', false, 1, 1),
(27, 'Develop ball-handling skills', '2025-03-01', false, 1, 1),
(27, 'Maintain rebounding effort', '2025-03-01', false, 1, 1),

-- Micah Roberson (Guard #25) - Goals
(20, 'Improve consistency in games', '2025-03-01', false, 1, 1),
(20, 'Improve ball-handling under pressure', '2025-03-01', false, 1, 1),
(20, 'Maintain three-point shooting at 35%', '2025-03-01', false, 1, 1),

-- Sub 1 (Center #11) - Goals
(23, 'Develop offensive skills', '2025-03-01', false, 1, 1),
(23, 'Improve post moves', '2025-03-01', false, 1, 1),
(23, 'Maintain high energy level', '2025-03-01', false, 1, 1),

-- Tom House (Guard #12) - Goals
(28, 'Improve ball-handling', '2025-03-01', false, 1, 1),
(28, 'Increase assists per game to 3.0', '2025-03-01', false, 1, 1),
(28, 'Maintain three-point percentage at 38%', '2025-03-01', false, 1, 1);

-- Success message
SELECT 'Player notes and goals have been successfully populated for all roster players!' as message;
