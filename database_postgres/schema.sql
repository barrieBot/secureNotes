CREATE TABLE IF NOT EXISTS notes (
    id VARCHAR(21) PRIMARY KEY,
    owner VARCHAR(255) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    sec_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_notes_owner ON notes(owner);



