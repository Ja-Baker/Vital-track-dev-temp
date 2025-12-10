-- VitalTrack Seed Data

-- Insert demo facility
INSERT INTO facilities (id, name, address, city, state, zip, phone, capacity)
VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'Sunny Acres Assisted Living',
    '123 Care Lane',
    'Springfield',
    'IL',
    '62701',
    '(555) 123-4567',
    50
) ON CONFLICT (id) DO NOTHING;

-- Insert demo admin user (password: admin123)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, facility_id)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'admin@sunnyacres.com',
    '$2b$10$KlRkosOHAd1nbyNaUzyqKeFnhaT6/XQolBdGxkfWdETwPfz9.Bxa2',
    'Sarah',
    'Johnson',
    'admin',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'
) ON CONFLICT (id) DO NOTHING;

-- Insert demo caregiver (password: admin123)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, facility_id)
VALUES (
    'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    'jane.smith@sunnyacres.com',
    '$2b$10$KlRkosOHAd1nbyNaUzyqKeFnhaT6/XQolBdGxkfWdETwPfz9.Bxa2',
    'Jane',
    'Smith',
    'caregiver',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'
) ON CONFLICT (id) DO NOTHING;

-- Insert demo residents
INSERT INTO residents (id, facility_id, first_name, last_name, date_of_birth, gender, room_number, status, medical_conditions, allergies)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Mary', 'Johnson', '1945-03-15', 'F', '101', 'active', ARRAY['Hypertension', 'Type 2 Diabetes'], ARRAY['Penicillin']),
    ('22222222-2222-2222-2222-222222222222', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Robert', 'Williams', '1940-08-22', 'M', '102', 'active', ARRAY['COPD', 'Heart Disease'], ARRAY[]::TEXT[]),
    ('33333333-3333-3333-3333-333333333333', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Dorothy', 'Brown', '1938-12-05', 'F', '103', 'active', ARRAY['Alzheimers'], ARRAY['Sulfa']),
    ('44444444-4444-4444-4444-444444444444', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'James', 'Davis', '1942-06-18', 'M', '104', 'active', ARRAY['Parkinsons'], ARRAY[]::TEXT[]),
    ('55555555-5555-5555-5555-555555555555', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Helen', 'Miller', '1944-09-30', 'F', '105', 'active', ARRAY['Osteoporosis'], ARRAY['Aspirin'])
ON CONFLICT (id) DO NOTHING;

-- Insert demo devices
INSERT INTO devices (id, device_id, model, resident_id, facility_id, status, battery_level, signal_strength, last_sync_at)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'IMEI001', 'iSmarch X6', '11111111-1111-1111-1111-111111111111', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'active', 65, 4, NOW()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'IMEI002', 'iSmarch X6', '22222222-2222-2222-2222-222222222222', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'active', 82, 4, NOW()),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'IMEI003', 'iSmarch X6', '33333333-3333-3333-3333-333333333333', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'active', 45, 3, NOW()),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'IMEI004', 'iSmarch X6', '44444444-4444-4444-4444-444444444444', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'active', 90, 4, NOW()),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'IMEI005', 'iSmarch X6', '55555555-5555-5555-5555-555555555555', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'offline', 12, 1, NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

-- Insert sample vital readings for each resident
INSERT INTO vital_readings (resident_id, device_id, heart_rate, spo2, systolic, diastolic, temperature, steps, location_description, battery_level, signal_strength)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 72, 97, 120, 80, 98.2, 2340, 'Dining Room', 65, 4),
    ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 88, 89, 145, 92, 98.6, 1200, 'Room 102', 82, 4),
    ('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 68, 96, 118, 75, 97.9, 3100, 'Garden', 45, 3),
    ('44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 76, 95, 130, 85, 98.4, 890, 'Physical Therapy', 90, 4),
    ('55555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 82, 94, 138, 88, 99.1, 450, 'Room 105', 12, 1);

-- Insert sample alerts
INSERT INTO alerts (resident_id, facility_id, type, category, title, message, status, triggering_value)
VALUES
    ('22222222-2222-2222-2222-222222222222', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'warning', 'vitals', 'Low SpO2 Alert', 'Robert Williams SpO2 dropped to 89%', 'pending', '89%'),
    ('55555555-5555-5555-5555-555555555555', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'warning', 'device', 'Low Battery Alert', 'Helen Miller device battery at 12%', 'pending', '12%');
