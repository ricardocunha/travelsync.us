-- create users table
CREATE TABLE users
(
    id            INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    level         ENUM('owner', 'manager', 'user') NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- update users table to include organization_id column and foreign key
ALTER TABLE users
    ADD COLUMN organization_id INT AFTER level,
ADD CONSTRAINT fk_user_organization_id FOREIGN KEY (organization_id) REFERENCES organization (id);

-- Example insert statement for users with organization_id
INSERT INTO users (username, email, password_hash, level, organization_id)
VALUES ('john_doe', 'john.doe@example.com', 'hashed_password_example', 'owner', 1),
       ('jane_doe', 'jane.doe@example.com', 'hashed_password_example', 'manager', 1),
       ('alice_smith', 'alice.smith@example.com', 'hashed_password_example', 'user', 1),
       ('bob_jones', 'bob.jones@example.com', 'hashed_password_example', 'manager', 1),
       ('charles_brown', 'charles.brown@example.com', 'hashed_password_example', 'user', 1),
       ('diana_white', 'diana.white@example.com', 'hashed_password_example', 'user', 1);




