-- Supabase schema for KB app
--
-- How to use:
-- 1) Open Supabase Dashboard → SQL Editor
-- 2) Paste this entire file and run it
--
-- Notes:
-- - This creates tables + RLS policies.
-- - Your app should use the ANON key (client-side). Never use service_role in the browser.

-- UUID helper
create extension if not exists pgcrypto;

-- ---------- Roles ----------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('guest', 'user', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.role_rank(r public.app_role)
RETURNS int
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE r
    WHEN 'guest' THEN 0
    WHEN 'user'  THEN 1
    WHEN 'admin' THEN 2
  END;
$$;

-- Convenience helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;

-- ---------- Profiles (role storage) ----------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Only admins can change roles (prevents self-promotion)
DROP POLICY IF EXISTS profiles_update_admin_only ON public.profiles;
CREATE POLICY profiles_update_admin_only
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (true);

-- Auto-create profile row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ---------- KB structure ----------
-- kb_categories are your left-nav sections (e.g. Staff Resources, Policies & Forms)
CREATE TABLE IF NOT EXISTS public.kb_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  -- Who can VIEW this category (guest/user/admin)
  min_role public.app_role NOT NULL DEFAULT 'guest',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kb_categories ENABLE ROW LEVEL SECURITY;

-- kb_topics are the "cards" inside a category
CREATE TABLE IF NOT EXISTS public.kb_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.kb_categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text,
  -- Store structured content (sections/subsections/etc)
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Who can VIEW this topic/card
  min_role public.app_role NOT NULL DEFAULT 'guest',
  created_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kb_topics ENABLE ROW LEVEL SECURITY;

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kb_topics_updated_at ON public.kb_topics;
CREATE TRIGGER trg_kb_topics_updated_at
BEFORE UPDATE ON public.kb_topics
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ---------- RLS: Reads ----------
-- Logged-in users can only read categories/topics with min_role <= their role
DROP POLICY IF EXISTS kb_categories_read_by_role ON public.kb_categories;
CREATE POLICY kb_categories_read_by_role
ON public.kb_categories
FOR SELECT
TO authenticated
USING (
  public.role_rank(
    (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  ) >= public.role_rank(min_role)
);

DROP POLICY IF EXISTS kb_topics_read_by_role ON public.kb_topics;
CREATE POLICY kb_topics_read_by_role
ON public.kb_topics
FOR SELECT
TO authenticated
USING (
  public.role_rank(
    (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  ) >= public.role_rank(min_role)
);

-- ---------- RLS: Writes ----------
-- Categories ("topics" in your description) are ADMIN-only to create/update/delete
DROP POLICY IF EXISTS kb_categories_insert_admin_only ON public.kb_categories;
CREATE POLICY kb_categories_insert_admin_only
ON public.kb_categories
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS kb_categories_update_admin_only ON public.kb_categories;
CREATE POLICY kb_categories_update_admin_only
ON public.kb_categories
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (true);

DROP POLICY IF EXISTS kb_categories_delete_admin_only ON public.kb_categories;
CREATE POLICY kb_categories_delete_admin_only
ON public.kb_categories
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Topics/cards: admin + user can create/edit/delete; guest cannot
-- Insert: users can only create guest-visible topics; admin can set any min_role
DROP POLICY IF EXISTS kb_topics_insert_admin_user ON public.kb_topics;
CREATE POLICY kb_topics_insert_admin_user
ON public.kb_topics
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin()
  OR (
    (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) = 'user'
    AND min_role = 'guest'
  )
);

-- Update: admin or user
DROP POLICY IF EXISTS kb_topics_update_admin_user ON public.kb_topics;
CREATE POLICY kb_topics_update_admin_user
ON public.kb_topics
FOR UPDATE
TO authenticated
USING (
  (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) IN ('admin', 'user')
)
WITH CHECK (true);

-- Delete: admin or user
DROP POLICY IF EXISTS kb_topics_delete_admin_user ON public.kb_topics;
CREATE POLICY kb_topics_delete_admin_user
ON public.kb_topics
FOR DELETE
TO authenticated
USING (
  (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) IN ('admin', 'user')
);

-- ---------- Admin-only: changing min_role ----------
-- Non-admins may edit topic content, but cannot change access level.
CREATE OR REPLACE FUNCTION public.block_non_admin_min_role_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (NEW.min_role IS DISTINCT FROM OLD.min_role) AND (NOT public.is_admin()) THEN
    RAISE EXCEPTION 'Only admins can change min_role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_min_role_change_topics ON public.kb_topics;
CREATE TRIGGER trg_block_min_role_change_topics
BEFORE UPDATE ON public.kb_topics
FOR EACH ROW EXECUTE PROCEDURE public.block_non_admin_min_role_change();
