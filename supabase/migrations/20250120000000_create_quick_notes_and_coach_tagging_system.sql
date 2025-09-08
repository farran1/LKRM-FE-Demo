-- Create quick_notes table for dashboard sticky notes
CREATE TABLE IF NOT EXISTS quick_notes (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  color VARCHAR(7) DEFAULT '#FFE66D', -- Hex color for sticky note
  position_x INTEGER DEFAULT 0, -- For drag & drop positioning
  position_y INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create coach_tags table for managing coach tags
CREATE TABLE IF NOT EXISTS coach_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  color VARCHAR(7) DEFAULT '#1890ff',
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quick_note_tags junction table
CREATE TABLE IF NOT EXISTS quick_note_tags (
  note_id INTEGER REFERENCES quick_notes(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES coach_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

-- Create coach_mentions table for @mentions in notes
CREATE TABLE IF NOT EXISTS coach_mentions (
  id SERIAL PRIMARY KEY,
  note_id INTEGER REFERENCES quick_notes(id) ON DELETE CASCADE,
  mentioned_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mention_text VARCHAR(100) NOT NULL, -- The actual @username text
  start_position INTEGER NOT NULL, -- Position in note content
  end_position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table for coach mentions
CREATE TABLE IF NOT EXISTS mention_notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id INTEGER REFERENCES quick_notes(id) ON DELETE CASCADE,
  mentioned_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_quick_notes_created_by ON quick_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_quick_notes_created_at ON quick_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_coach_mentions_note_id ON coach_mentions(note_id);
CREATE INDEX IF NOT EXISTS idx_coach_mentions_mentioned_user ON coach_mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_mention_notifications_user_id ON mention_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_mention_notifications_is_read ON mention_notifications(is_read);

-- Enable RLS
ALTER TABLE quick_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mention_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quick_notes
CREATE POLICY "Users can view their own quick notes" ON quick_notes
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own quick notes" ON quick_notes
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own quick notes" ON quick_notes
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own quick notes" ON quick_notes
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for coach_tags
CREATE POLICY "Users can view all coach tags" ON coach_tags
  FOR SELECT USING (true);

CREATE POLICY "Users can insert coach tags" ON coach_tags
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update coach tags" ON coach_tags
  FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for quick_note_tags
CREATE POLICY "Users can view note tags" ON quick_note_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quick_notes 
      WHERE id = note_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage their note tags" ON quick_note_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quick_notes 
      WHERE id = note_id AND created_by = auth.uid()
    )
  );

-- RLS Policies for coach_mentions
CREATE POLICY "Users can view mentions in their notes" ON coach_mentions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quick_notes 
      WHERE id = note_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create mentions in their notes" ON coach_mentions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quick_notes 
      WHERE id = note_id AND created_by = auth.uid()
    )
  );

-- RLS Policies for mention_notifications
CREATE POLICY "Users can view their own notifications" ON mention_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON mention_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Insert default coach tags
INSERT INTO coach_tags (name, color, description, created_by) VALUES
  ('Important', '#ff4d4f', 'High priority items', (SELECT id FROM auth.users LIMIT 1)),
  ('Follow-up', '#faad14', 'Items requiring follow-up', (SELECT id FROM auth.users LIMIT 1)),
  ('Meeting', '#52c41a', 'Meeting related notes', (SELECT id FROM auth.users LIMIT 1)),
  ('Player', '#1890ff', 'Player specific notes', (SELECT id FROM auth.users LIMIT 1)),
  ('Game', '#722ed1', 'Game related notes', (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (name) DO NOTHING;
