-- Create `events` table
CREATE TABLE events (
  event_id INT AUTO_INCREMENT PRIMARY KEY,   -- Unique event ID
  event_name VARCHAR(255) NOT NULL,           -- Event name or description
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Timestamp for event creation
);

-- Create `event_days` table
CREATE TABLE event_days (
  event_day_id INT AUTO_INCREMENT PRIMARY KEY, -- Unique event day ID
  event_id INT NOT NULL,                       -- Foreign key for the event
  event_date DATE NOT NULL,                    -- Specific date for this event day
  FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE -- Ensure that if an event is deleted, its days are deleted too
);

-- Create `customers` table
CREATE TABLE customers (
  customer_id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique customer ID
  name VARCHAR(255) NOT NULL,                  -- Customer's name
  email VARCHAR(255) NOT NULL,          -- Customer's email
  contactNo varchar(255) NOT NULL UNIQUE,
  event_day_id INT NOT NULL,                   -- Foreign key to the specific event day
  game_result VARCHAR(255),                    -- Game result (can be win, score, etc.)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp for when the customer record is created
  FOREIGN KEY (event_day_id) REFERENCES event_days(event_day_id) ON DELETE CASCADE -- Ensure that if an event day is deleted, its customers are deleted too
);

-- Create `admins` table
CREATE TABLE admins (
  admin_id INT AUTO_INCREMENT PRIMARY KEY,    -- Unique admin ID
  username VARCHAR(255) NOT NULL UNIQUE,       -- Admin's username (unique)
  password_hash VARCHAR(255) NOT NULL,         -- Hashed password (never store plaintext passwords)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Timestamp for when the admin account was created
);
