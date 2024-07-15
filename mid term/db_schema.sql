-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE
    IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT,
        blog_title TEXT,
        created_on DATETIME DEFAULT CURRENT_TIMESTAMP,
        role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'AUTHOR'))
    );

CREATE TABLE
    IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT NOT NULL,
        likes INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        author_id INTEGER NOT NULL,
        created_on DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_on DATETIME DEFAULT CURRENT_TIMESTAMP,
        published_on DATETIME,
        FOREIGN KEY (author_id) REFERENCES users (id)
    );

CREATE TABLE
    IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        article_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_on DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES articles (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
    );

CREATE TABLE
    IF NOT EXISTS likes (
        article_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        FOREIGN KEY (article_id) REFERENCES articles (id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        PRIMARY KEY (article_id, user_id)
    );

-- Set up three users
INSERT
OR IGNORE INTO users (name, email, password, role, blog_title)
VALUES
    (
        'Admin',
        'admin@example.com',
        '$2b$10$foUywwQTDoY8PkgMiriNm.lT56XPKtdtgH4sNjdOVFGZ46jbhvssa',
        'ADMIN',
        'Admin Blog'
    ),
    --password is a3CTr2E9APfAmQb

COMMIT;