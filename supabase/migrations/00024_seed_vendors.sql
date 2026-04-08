-- Seed Renew Dental vendors from Notion Third Party/Vendor Companies database
-- Practice: d9f05b47-5429-41bc-aea9-79043c5c7062

DO $$
DECLARE
  v_practice_id uuid := 'd9f05b47-5429-41bc-aea9-79043c5c7062';
BEGIN

  INSERT INTO public.vendors (practice_id, name, type) VALUES
  -- Equipment vendors
  (v_practice_id, 'Henry Schein',       'equipment'),
  (v_practice_id, 'Biohorizon',         'equipment'),
  (v_practice_id, 'Benco',              'equipment'),
  (v_practice_id, 'Darby Dental',       'equipment'),
  (v_practice_id, 'Crest Oral B',       'equipment'),
  (v_practice_id, 'Phillips/Zoom',      'equipment'),
  (v_practice_id, 'Ultradent',          'equipment'),
  (v_practice_id, 'Brassler',           'equipment'),
  (v_practice_id, 'Allergan',           'equipment'),
  (v_practice_id, 'Great Lakes',        'equipment'),
  (v_practice_id, 'Sango Pharmacy',     'equipment'),

  -- Service vendors
  (v_practice_id, 'Brik Designs',       'service'),

  -- Lab vendors
  (v_practice_id, 'Dental South Lab',   'lab'),
  (v_practice_id, 'Microdental Lab',    'lab'),
  (v_practice_id, 'MK Dental Lab',      'lab'),
  (v_practice_id, 'Midsouth Dental Lab','lab'),

  -- Referring practices
  (v_practice_id, 'Periodontal and Implant Associates of Middle TN', 'referring_practice'),
  (v_practice_id, 'Alliance Endodontics',                            'referring_practice'),
  (v_practice_id, 'Heritage Endodontics',                            'referring_practice'),
  (v_practice_id, 'Cumberland Surgical Arts and Associates',         'referring_practice'),
  (v_practice_id, 'My New Smile',                                    'referring_practice'),
  (v_practice_id, 'Spring Creek Pediatric',                          'referring_practice'),
  (v_practice_id, 'Reflections Orthodontics',                        'referring_practice'),
  (v_practice_id, 'Oral and Facial Surgery Group of Nashville TN',   'referring_practice'),
  (v_practice_id, 'Dr. Hass',                                        'referring_practice'),
  (v_practice_id, 'Wild Roots Wellness',                              'referring_practice');

END $$;
