-- Create table for saved haikus
CREATE TABLE public.saved_haikus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  haiku TEXT NOT NULL,
  theme TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_haikus ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved haikus
CREATE POLICY "Users can view their own haikus"
ON public.saved_haikus
FOR SELECT
USING (auth.uid() = user_id);

-- Users can save their own haikus
CREATE POLICY "Users can save haikus"
ON public.saved_haikus
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own haikus
CREATE POLICY "Users can delete their own haikus"
ON public.saved_haikus
FOR DELETE
USING (auth.uid() = user_id);