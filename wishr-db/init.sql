-- USERS table
CREATE TABLE USERS (
    email VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255)  NOT NULL,
    salt VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    photo VARCHAR(255)
);

-- USERS table test data
INSERT INTO USERS (username, email, salt, password, photo)
VALUES
    ('TCyr', 'taylor@gmail.com', 'FMrg^S&l9%GR', '4ed7f2e6cf35c3a6dd4248e9245f4a77d09ff01970d1acca0b40975d6b96fb7b', 'simon.jpg'),
    ('EAnderson', 'easton@gmail.com', 'sDX+XTZOSdx9', 'aa1e6cbbe9cc682bade32c4813c883bf1b5a659b5b1e736aa3d0848b60ec726e', 'alvin.jpg'),
    ('TKBonk', 'troy@gmail.com', 'Qc=^bFF+YszD', '5f2b395eb708ce07702322e4aca9126df98c64344affb583049a058af00ea34a', 'theodore.jpg');

-- LISTS table
CREATE TABLE LISTS (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    creator VARCHAR(255) NOT NULL REFERENCES USERS(email),
    creation_date TIMESTAMP NOT NULL
);

-- LISTS table test data
INSERT INTO LISTS (id, title, creator, creation_date)
VALUES
    (1, 'Taylor''s Christmas List 2023', 'taylor@gmail.com', '2023-05-24 15:57:00'),
    (2, 'Birthday 2022', 'easton@gmail.com', '2023-03-23 13:22:00'),
    (3, 'Jason/Kelsie''s Wedding', 'easton@gmail.com', '2023-05-18 21:12:00'),
    (4, 'Christmas List', 'easton@gmail.com', '2023-06-27 13:52:00');

-- ITEMS table
CREATE TABLE ITEMS (
    id SERIAL PRIMARY KEY,
    list_id INTEGER NOT NULL REFERENCES LISTS(id),
    item_name VARCHAR(255) NOT NULL,
    item_description TEXT,
    link VARCHAR,
    assigned_user VARCHAR(255) REFERENCES USERS(email),
    is_purchased BOOLEAN NOT NULL DEFAULT FALSE
);

-- ITEMS table test data
INSERT INTO ITEMS (id, list_id, item_name, item_description, link, assigned_user, is_purchased)
VALUES
    (1, 1, 'Nightstand Lamp', 'The black one with wireless phone charging', 'https://www.wayfair.com/Greyleigh%E2%84%A2--Nahant-30.5-Black-Table-Lamp-X115392678-L6449-K~W004281567.html?refid=GX610289357892-W004281567&device=c&ptid=998489504873&network=g&targetid=pla-998489504873&channel=GooglePLA&ireid=130840511&fdid=1817&gclid=EAIaIQobChMIwMmY_4O8gQMVQkd_AB3KUgDZEAQYAiABEgIcrPD_BwE', 'easton@gmail.com', TRUE),
    (2, 1, 'Piggy Bank', 'has to be pink!', NULL, NULL, FALSE),
    (3, 1, 'Drew Barrymore''s New Waffle Maker', 'has to be pink!', 'https://www.walmart.com/ip/Beautiful-6-qt-Programmable-Slow-Cooker-White-Icing-by-Drew-Barrymore/401314999?wmlspartner=wlpa&selectedSellerId=0', 'easton@gmail.com', FALSE),
    (4, 1, 'Nike Lunar 3.0 Cleats', 'has to be pink!', NULL, 'troy@gmail.com', TRUE),
    (5, 2, 'Lorem Ipsum Colour', 'Foorbar', 'https://www.target.com/p/fortnite-v-bucks-gift-card-digital/-/A-87469570', 'easton@gmail.com', FALSE);

-- SHARED table (map of who has access to lists)
CREATE TABLE SHARED (
    list_id INTEGER NOT NULL REFERENCES LISTS(id),
    shared_user VARCHAR(255) NOT NULL REFERENCES USERS(email),
    PRIMARY KEY (list_id, shared_user)
);

-- SHARED table test data
INSERT INTO SHARED (list_id, shared_user)
VALUES
    (1, 'easton@gmail.com');

-- MESSAGES table
CREATE TABLE MESSAGES (
    id SERIAL PRIMARY KEY,
    list_id INTEGER NOT NULL REFERENCES LISTS(id),
    user_email VARCHAR(255) NOT NULL REFERENCES USERS(email),
    date TIMESTAMP NOT NULL,
    message TEXT NOT NULL
);

-- MESSAGES table test data
INSERT INTO MESSAGES (id, list_id, user_email, date, message)
VALUES
    (1, 1, 'easton@gmail.com', '2023-08-01 14:54:00', 'I can get two gifts, but not the cleats! I''m waiting on my next paycheck for the second gift though...'),
    (2, 1, 'troy@gmail.com', '2023-08-01 14:58:00', 'I just bought the cleats, no worries!'),
    (3, 1, 'easton@gmail.com', '2023-08-01 15:10:00', 'Awesome! I hope someone can get the rest.'),
    (4, 2, 'troy@gmail.com', '2023-08-02 14:58:00', 'This is borderline a reddit clone.');


-- Indexes
CREATE INDEX idx_users_email ON USERS (email);

CREATE INDEX idx_lists_creator ON LISTS (creator);
CREATE INDEX idx_lists_title ON LISTS (title);

CREATE INDEX idx_items_list_id ON ITEMS (list_id);
CREATE INDEX idx_items_assigned_user ON ITEMS (assigned_user);
CREATE INDEX idx_items_item_name ON ITEMS (item_name);

CREATE INDEX idx_shared_list_id ON SHARED (list_id);
CREATE INDEX idx_shared_shared_user ON SHARED (shared_user);

CREATE INDEX idx_messages_list_id ON MESSAGES (list_id);
CREATE INDEX idx_messages_user_email ON MESSAGES (user_email);
CREATE INDEX idx_messages_date ON MESSAGES (date);

-- Sync the sequences
SELECT setval('messages_id_seq', (SELECT max(id) FROM messages));
SELECT setval('items_id_seq', (SELECT max(id) FROM items));
SELECT setval('lists_id_seq', (SELECT max(id) FROM lists));
