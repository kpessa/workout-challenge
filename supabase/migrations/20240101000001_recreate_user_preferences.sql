-- Drop existing table and its dependencies
DROP POLICY IF EXISTS "Users can only access their own preferences" ON "public"."user_preferences";
DROP TABLE IF EXISTS "public"."user_preferences";

-- Create user_preferences table with correct schema
CREATE TABLE public.user_preferences (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    data jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE,
    CONSTRAINT unique_user_id
        UNIQUE(user_id)
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for users to their own preferences"
    ON public.user_preferences
    FOR SELECT
    TO authenticated
    USING (
        auth.uid()::uuid = user_id
    );

CREATE POLICY "Enable insert access for users to their own preferences"
    ON public.user_preferences
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid()::uuid = user_id
    );

CREATE POLICY "Enable update access for users to their own preferences"
    ON public.user_preferences
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid()::uuid = user_id
    )
    WITH CHECK (
        auth.uid()::uuid = user_id
    );

CREATE POLICY "Enable delete access for users to their own preferences"
    ON public.user_preferences
    FOR DELETE
    TO authenticated
    USING (
        auth.uid()::uuid = user_id
    ); 