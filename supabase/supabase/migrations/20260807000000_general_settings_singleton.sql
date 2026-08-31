-- The general_settings singleton row was never seeded (the seed only sets the
-- id sequence). Without it, .single() reads fail with "Cannot coerce the
-- result to a single JSON object" — hit by getAdminSettingsFunc and the
-- announcement-banner query. Insert the row (id = 1) with its column defaults.
INSERT INTO public.general_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
