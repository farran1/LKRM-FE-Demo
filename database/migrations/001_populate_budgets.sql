-- Migration: Populate sample budget data
-- Run this locally to test the full-stack budget functionality

-- Insert sample budgets for the 2025-2026 season
INSERT INTO budgets (name, amount, period, "categoryId", season, description, "autoRepeat", "createdBy", "updatedBy") VALUES 
('Equipment Maintenance', 10200, 'Quarterly (Jan - March)', 1, '2025-2026', 'Regular equipment upkeep and repairs', true, 1, 1),
('Food & Drink', 5000, 'Monthly (Feb 2025)', 3, '2025-2026', 'Team meals and snacks', true, 1, 1),
('Tournament & League Fees', 25000, 'Yearly (2025)', 4, '2025-2026', 'Annual registration and league fees', true, 1, 1),
('Travel & Transportation', 10000, 'Quarterly (Jan - March)', 2, '2025-2026', 'Away game travel and fuel costs', true, 1, 1),
('Coaching Materials', 8000, 'Semester (Fall 2025)', 5, '2025-2026', 'Training materials and coaching resources', true, 1, 1),
('Uniforms & Gear', 15000, 'Yearly (2025)', 1, '2025-2026', 'Team uniforms and protective gear', true, 1, 1);

-- Insert some sample expenses to show spending calculations
INSERT INTO expenses (budgetId, merchant, amount, category, date, description, "createdBy", "updatedBy") VALUES 
(1, 'Sports Equipment Co', 2500, 'Equipment', '2025-01-15', 'New basketballs and nets', 1, 1),
(1, 'Maintenance Pro', 1800, 'Equipment', '2025-02-01', 'Scoreboard repair', 1, 1),
(2, 'Team Pizza', 450, 'Food', '2025-02-10', 'Post-game team meal', 1, 1),
(2, 'Snack Supply', 320, 'Food', '2025-02-15', 'Game day snacks', 1, 1),
(3, 'League Office', 25000, 'Fees', '2025-01-01', 'Annual league registration', 1, 1),
(4, 'Gas Station', 850, 'Travel', '2025-01-20', 'Away game fuel', 1, 1),
(4, 'Hotel Express', 1200, 'Travel', '2025-02-05', 'Tournament lodging', 1, 1),
(5, 'Training Materials Inc', 1200, 'Supplies', '2025-01-10', 'Coaching manuals and videos', 1, 1),
(6, 'Uniform Supply', 8000, 'Equipment', '2025-01-05', 'Home and away uniforms', 1, 1);
