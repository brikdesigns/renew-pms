-- Seed Renew Dental vendor contacts from Notion Third Party/Vendors Contacts database
-- Practice: d9f05b47-5429-41bc-aea9-79043c5c7062

DO $$
DECLARE
  v_practice_id uuid := 'd9f05b47-5429-41bc-aea9-79043c5c7062';
  v_vendor_id   uuid;
BEGIN

  -- Abbey Stanerson → Brik Designs
  SELECT id INTO v_vendor_id FROM public.vendors WHERE name = 'Brik Designs' AND practice_id = v_practice_id;
  IF v_vendor_id IS NOT NULL THEN
    INSERT INTO public.vendor_contacts (vendor_id, practice_id, name, phone, email, is_primary)
    VALUES (v_vendor_id, v_practice_id, 'Abbey Stanerson', '319-551-7636', 'abbey@brikdesigns.com', true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Victoria Caratciolo → Allergan
  SELECT id INTO v_vendor_id FROM public.vendors WHERE name = 'Allergan' AND practice_id = v_practice_id;
  IF v_vendor_id IS NOT NULL THEN
    INSERT INTO public.vendor_contacts (vendor_id, practice_id, name, phone, email, is_primary)
    VALUES (v_vendor_id, v_practice_id, 'Victoria Caratciolo', '862-451-2213', null, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Sarah Evans → Ultradent
  SELECT id INTO v_vendor_id FROM public.vendors WHERE name = 'Ultradent' AND practice_id = v_practice_id;
  IF v_vendor_id IS NOT NULL THEN
    INSERT INTO public.vendor_contacts (vendor_id, practice_id, name, is_primary)
    VALUES (v_vendor_id, v_practice_id, 'Sarah Evans', true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Lizzy Campbell → Phillips/Zoom
  SELECT id INTO v_vendor_id FROM public.vendors WHERE name = 'Phillips/Zoom' AND practice_id = v_practice_id;
  IF v_vendor_id IS NOT NULL THEN
    INSERT INTO public.vendor_contacts (vendor_id, practice_id, name, is_primary)
    VALUES (v_vendor_id, v_practice_id, 'Lizzy Campbell', true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Jacqueline Arlington → Henry Schein
  SELECT id INTO v_vendor_id FROM public.vendors WHERE name = 'Henry Schein' AND practice_id = v_practice_id;
  IF v_vendor_id IS NOT NULL THEN
    INSERT INTO public.vendor_contacts (vendor_id, practice_id, name, is_primary)
    VALUES (v_vendor_id, v_practice_id, 'Jacqueline Arlington', true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Larry Motle → Biohorizon
  SELECT id INTO v_vendor_id FROM public.vendors WHERE name = 'Biohorizon' AND practice_id = v_practice_id;
  IF v_vendor_id IS NOT NULL THEN
    INSERT INTO public.vendor_contacts (vendor_id, practice_id, name, is_primary)
    VALUES (v_vendor_id, v_practice_id, 'Larry Motle', true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Don Lilly → Crest Oral B
  SELECT id INTO v_vendor_id FROM public.vendors WHERE name = 'Crest Oral B' AND practice_id = v_practice_id;
  IF v_vendor_id IS NOT NULL THEN
    INSERT INTO public.vendor_contacts (vendor_id, practice_id, name, is_primary)
    VALUES (v_vendor_id, v_practice_id, 'Don Lilly', true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Fawn VonGunten → Darby Dental
  SELECT id INTO v_vendor_id FROM public.vendors WHERE name = 'Darby Dental' AND practice_id = v_practice_id;
  IF v_vendor_id IS NOT NULL THEN
    INSERT INTO public.vendor_contacts (vendor_id, practice_id, name, is_primary)
    VALUES (v_vendor_id, v_practice_id, 'Fawn VonGunten', true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Scott Baker → Benco
  SELECT id INTO v_vendor_id FROM public.vendors WHERE name = 'Benco' AND practice_id = v_practice_id;
  IF v_vendor_id IS NOT NULL THEN
    INSERT INTO public.vendor_contacts (vendor_id, practice_id, name, is_primary)
    VALUES (v_vendor_id, v_practice_id, 'Scott Baker', true)
    ON CONFLICT DO NOTHING;
  END IF;

END $$;
