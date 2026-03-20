CREATE TABLE plan_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    user_id INT,
    guest_name VARCHAR(255),
    guest_email VARCHAR(255),
    departure_city VARCHAR(255) NOT NULL,
    departure_airport_id INT NOT NULL,
    departure_country_id INT,
    status ENUM('pending','confirmed','declined') DEFAULT 'pending',
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (departure_airport_id) REFERENCES airports(id),
    FOREIGN KEY (departure_country_id) REFERENCES countries(id)
);
