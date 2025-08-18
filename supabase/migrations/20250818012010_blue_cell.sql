/*
  # Seed Default Data for Basketball Coaching Platform

  1. Basketball Positions
    - Point Guard, Shooting Guard, Small Forward, Power Forward, Center

  2. Event Types
    - Practice, Game, Meeting, Scrimmage, Tournament

  3. Task Priorities
    - High, Medium, Low with weights and colors

  4. Budget Categories
    - Equipment & Uniforms, Travel & Transportation, Tournament Fees, Food & Drink

  5. Current Season
    - 2024-25 basketball season
*/

-- Insert basketball positions
INSERT INTO positions (name, abbreviation, description) VALUES
  ('Point Guard', 'PG', 'Primary ball handler and playmaker'),
  ('Shooting Guard', 'SG', 'Primary perimeter scorer'),
  ('Small Forward', 'SF', 'Versatile wing player'),
  ('Power Forward', 'PF', 'Strong interior player'),
  ('Center', 'C', 'Primary interior presence')
ON CONFLICT (name) DO NOTHING;

-- Insert event types
INSERT INTO event_types (name, color, text_color, icon) VALUES
  ('Practice', '#2196f3', '#ffffff', '⚽'),
  ('Game', '#4ecdc4', '#ffffff', '🏀'),
  ('Scrimmage', '#ff9800', '#ffffff', '🏃'),
  ('Team Meeting', '#4caf50', '#ffffff', '📋'),
  ('Tournament', '#ff5722', '#ffffff', '🏆'),
  ('Workout', '#9c27b0', '#ffffff', '💪')
ON CONFLICT (name) DO NOTHING;

-- Insert task priorities
INSERT INTO task_priorities (name, weight, color) VALUES
  ('High', 1, '#ff4d4f'),
  ('Medium', 2, '#faad14'),
  ('Low', 3, '#52c41a')
ON CONFLICT (name) DO NOTHING;

-- Insert budget categories
INSERT INTO budget_categories (name, description, color) VALUES
  ('Equipment & Uniforms', 'Basketball equipment, uniforms, and gear', '#1890ff'),
  ('Travel & Transportation', 'Team travel expenses and transportation', '#52c41a'),
  ('Tournament & League Fees', 'Registration and participation fees', '#faad14'),
  ('Food & Drink', 'Team meals and hydration', '#722ed1'),
  ('Coaching & Training', 'Coaching staff and training expenses', '#13c2c2'),
  ('Facilities & Maintenance', 'Court maintenance and facility costs', '#eb2f96')
ON CONFLICT (name) DO NOTHING;

-- Insert current season
INSERT INTO seasons (name, start_date, end_date, is_active, description) VALUES
  ('2024-25', '2024-11-01', '2025-03-31', true, 'Current basketball season')
ON CONFLICT (name) DO NOTHING;

-- Update any existing active seasons to false, then set 2024-25 as active
UPDATE seasons SET is_active = false;
UPDATE seasons SET is_active = true WHERE name = '2024-25';