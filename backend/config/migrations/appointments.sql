CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id),
    user_id INTEGER REFERENCES users(id),
    preferred_date DATE NOT NULL,
    preferred_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 