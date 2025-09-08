-- Fix existing live_game_events with null game_id values
-- This creates games for existing sessions and updates the events

DO $$
DECLARE
    session_record RECORD;
    new_game_id integer;
BEGIN
    -- Loop through all live_game_sessions that don't have a game_id
    FOR session_record IN 
        SELECT id, event_id, created_by 
        FROM live_game_sessions 
        WHERE game_id IS NULL
    LOOP
        -- Try to find existing game for this event
        SELECT id INTO new_game_id 
        FROM games 
        WHERE "eventId" = session_record.event_id 
        LIMIT 1;
        
        -- If no game exists, create one
        IF new_game_id IS NULL THEN
            INSERT INTO games (
                "eventId", opponent, "gameDate", season, "isPlayoffs", 
                "createdAt", "createdBy", "updatedAt", "updatedBy"
            ) VALUES (
                session_record.event_id, 
                'Live Game', 
                NOW(), 
                '2024-25', 
                false,
                NOW(), 
                COALESCE(session_record.created_by, 1),
                NOW(), 
                COALESCE(session_record.created_by, 1)
            ) RETURNING id INTO new_game_id;
            
            RAISE NOTICE 'Created game % for event %', new_game_id, session_record.event_id;
        END IF;
        
        -- Update the session with the game_id
        UPDATE live_game_sessions 
        SET game_id = new_game_id 
        WHERE id = session_record.id;
        
        -- Update all events for this session
        UPDATE live_game_events 
        SET game_id = new_game_id 
        WHERE session_id = session_record.id;
        
        RAISE NOTICE 'Updated session % and its events with game_id %', session_record.id, new_game_id;
    END LOOP;
END $$;

