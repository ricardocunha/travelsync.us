-- Create the "plans" table with relationships to "users" and "organization"
CREATE TABLE plans
(
    id                 SERIAL PRIMARY KEY,                                              -- Primary key for the plan
    organization_id    INT          NOT NULL,                                           -- Foreign key to the organization table
    created_by_user_id INT          NOT NULL,                                           -- Foreign key to the user who created the plan
    name               VARCHAR(255) NOT NULL,                                           -- Name of the plan
    description        TEXT,                                                            -- Optional description for the plan
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                             -- Timestamp for creation
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Timestamp for updates
    CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES organization (id) ON DELETE CASCADE,
    CONSTRAINT fk_created_by_user FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- Create a junction table to associate multiple users with a plan
CREATE TABLE plan_users
(
    plan_id  INT NOT NULL,                        -- Foreign key to the plans table
    user_id  INT NOT NULL,                        -- Foreign key to the users table
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp for when the user was added to the plan
    PRIMARY KEY (plan_id, user_id),               -- Composite primary key for the table
    CONSTRAINT fk_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
-- Insert dummy data into the "plans" table
INSERT INTO plans (organization_id, created_by_user_id, name, description, created_at, updated_at)
VALUES (1, 1, 'Data team trip', 'This is the basic plan for smaller organizations.', CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP),
       (1, 1, 'Eng team trip', 'This plan is designed for larger teams with advanced needs.', CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP));

-- Insert dummy data into the "plan_users" table
INSERT INTO plan_users (plan_id, user_id, role, added_at)
VALUES (1, 1),
       (1, 2),
       (2, 3),
       (2, 1),
       (2, 4);
