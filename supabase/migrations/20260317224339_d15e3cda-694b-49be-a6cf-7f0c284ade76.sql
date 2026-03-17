-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. RLS on user_roles: users can read their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 5. Drop overly permissive policies on content tables and replace with admin-only
-- Tracks
DROP POLICY IF EXISTS "Authenticated can insert tracks" ON public.tracks;
DROP POLICY IF EXISTS "Authenticated can update tracks" ON public.tracks;
DROP POLICY IF EXISTS "Authenticated can delete tracks" ON public.tracks;
CREATE POLICY "Admins can insert tracks" ON public.tracks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update tracks" ON public.tracks FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete tracks" ON public.tracks FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Courses
DROP POLICY IF EXISTS "Authenticated can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated can update courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated can delete courses" ON public.courses;
CREATE POLICY "Admins can insert courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update courses" ON public.courses FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete courses" ON public.courses FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Mastery classes
DROP POLICY IF EXISTS "Authenticated can insert mastery_classes" ON public.mastery_classes;
DROP POLICY IF EXISTS "Authenticated can update mastery_classes" ON public.mastery_classes;
DROP POLICY IF EXISTS "Authenticated can delete mastery_classes" ON public.mastery_classes;
CREATE POLICY "Admins can insert mastery_classes" ON public.mastery_classes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update mastery_classes" ON public.mastery_classes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete mastery_classes" ON public.mastery_classes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Journaling prompts
DROP POLICY IF EXISTS "Authenticated can insert prompts" ON public.journaling_prompts;
DROP POLICY IF EXISTS "Authenticated can update prompts" ON public.journaling_prompts;
DROP POLICY IF EXISTS "Authenticated can delete prompts" ON public.journaling_prompts;
CREATE POLICY "Admins can insert prompts" ON public.journaling_prompts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update prompts" ON public.journaling_prompts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete prompts" ON public.journaling_prompts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- App settings: admins can insert/update
CREATE POLICY "Admins can insert app_settings" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update app_settings" ON public.app_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));