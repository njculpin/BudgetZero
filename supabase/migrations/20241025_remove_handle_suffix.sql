-- Update the handle_new_user function to remove random suffix
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_handle TEXT;
    handle_exists BOOLEAN;
    counter INTEGER := 1;
BEGIN
    -- Create handle from email (before @)
    new_handle := LOWER(SPLIT_PART(NEW.email, '@', 1));

    -- Check if handle exists
    SELECT EXISTS (
        SELECT 1 FROM public.users WHERE handle = new_handle
    ) INTO handle_exists;

    -- If handle exists, append a number
    WHILE handle_exists LOOP
        new_handle := LOWER(SPLIT_PART(NEW.email, '@', 1)) || counter::TEXT;
        counter := counter + 1;

        SELECT EXISTS (
            SELECT 1 FROM public.users WHERE handle = new_handle
        ) INTO handle_exists;
    END LOOP;

    -- Insert into public.users
    INSERT INTO public.users (id, email, handle, name)
    VALUES (
        NEW.id,
        NEW.email,
        new_handle,
        COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1))
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
