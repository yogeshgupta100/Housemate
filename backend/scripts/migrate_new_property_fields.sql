-- Migration script to add new property fields for office, plot, and builder floor/house properties
-- Run this script on existing databases to add the new columns

-- Add new Office-specific fields
ALTER TABLE properties ADD COLUMN IF NOT EXISTS office_area DECIMAL(10,2) CHECK (office_area >= 0);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS office_floors INTEGER CHECK (office_floors >= 1);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS office_capacity INTEGER CHECK (office_capacity >= 0);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS office_cabins INTEGER CHECK (office_cabins >= 0);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS meeting_rooms INTEGER CHECK (meeting_rooms >= 0);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS head_cabins INTEGER CHECK (head_cabins >= 0);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS office_amenities TEXT[] DEFAULT '{}';

-- Add new Plot-specific fields
ALTER TABLE properties ADD COLUMN IF NOT EXISTS plot_area DECIMAL(10,2) CHECK (plot_area >= 0);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS nearby_area VARCHAR(255);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS under_committee BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS passed_building_land BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS estimated_rental_income DECIMAL(12,2) CHECK (estimated_rental_income >= 0);

-- Add new Builder Floor/House-specific fields
ALTER TABLE properties ADD COLUMN IF NOT EXISTS builder_floors INTEGER CHECK (builder_floors >= 1);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS house_area DECIMAL(10,2) CHECK (house_area >= 0);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS house_bedrooms INTEGER CHECK (house_bedrooms >= 0);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS house_bathrooms INTEGER CHECK (house_bathrooms >= 0);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS house_balcony INTEGER CHECK (house_balcony >= 0);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS house_parking INTEGER CHECK (house_parking >= 0);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS house_amenities TEXT[] DEFAULT '{}';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS house_location VARCHAR(255);

-- Update the type constraint to include 'builder floor'
-- First, drop the existing constraint
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_type_check;

-- Add the new constraint with updated property types
ALTER TABLE properties ADD CONSTRAINT properties_type_check CHECK (
    (listing_type = 'sale' AND type IN ('house', 'apartment', 'office', 'villa', 'flat', 'commercial', 'residential plot', 'commercial plot', 'builder floor')) OR
    (listing_type = 'rent' AND type IN ('house', 'apartment', 'office', 'villa', 'pg', 'flat', 'rk', 'commercial', 'residential plot', 'commercial plot', 'builder floor'))
);

-- Create indexes for better performance on new fields
CREATE INDEX IF NOT EXISTS idx_properties_office_area ON properties(office_area);
CREATE INDEX IF NOT EXISTS idx_properties_plot_area ON properties(plot_area);
CREATE INDEX IF NOT EXISTS idx_properties_house_area ON properties(house_area);
CREATE INDEX IF NOT EXISTS idx_properties_builder_floors ON properties(builder_floors);

-- Add comments for documentation
COMMENT ON COLUMN properties.office_area IS 'Office area in square feet';
COMMENT ON COLUMN properties.office_floors IS 'Number of floors in the office';
COMMENT ON COLUMN properties.office_capacity IS 'Office capacity in number of people';
COMMENT ON COLUMN properties.office_cabins IS 'Number of cabins in the office';
COMMENT ON COLUMN properties.meeting_rooms IS 'Number of meeting rooms';
COMMENT ON COLUMN properties.head_cabins IS 'Number of head cabins';
COMMENT ON COLUMN properties.office_amenities IS 'Array of office amenities';
COMMENT ON COLUMN properties.plot_area IS 'Plot area in square feet';
COMMENT ON COLUMN properties.nearby_area IS 'Nearby area description';
COMMENT ON COLUMN properties.under_committee IS 'Whether the plot is under committee';
COMMENT ON COLUMN properties.passed_building_land IS 'Whether the plot has passed building land approval';
COMMENT ON COLUMN properties.estimated_rental_income IS 'Estimated rental income after builtup';
COMMENT ON COLUMN properties.builder_floors IS 'Number of floors for builder floor properties';
COMMENT ON COLUMN properties.house_area IS 'House area in square feet';
COMMENT ON COLUMN properties.house_bedrooms IS 'Number of bedrooms in the house';
COMMENT ON COLUMN properties.house_bathrooms IS 'Number of bathrooms in the house';
COMMENT ON COLUMN properties.house_balcony IS 'Number of balconies';
COMMENT ON COLUMN properties.house_parking IS 'Number of parking spaces';
COMMENT ON COLUMN properties.house_amenities IS 'Array of house amenities';
COMMENT ON COLUMN properties.house_location IS 'Specific location details for the house'; 