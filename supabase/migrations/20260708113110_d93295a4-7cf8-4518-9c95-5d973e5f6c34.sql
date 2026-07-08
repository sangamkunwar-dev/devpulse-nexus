-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  username text NOT NULL UNIQUE,
  display_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student','developer')),
  skill_level text NOT NULL DEFAULT 'beginner' CHECK (skill_level IN ('beginner','intermediate','advanced')),
  tech_stack text[] NOT NULL DEFAULT '{}',
  bio text,
  tagline text,
  github_username text,
  website text,
  is_public boolean NOT NULL DEFAULT false,
  onboarded boolean NOT NULL DEFAULT false,
  xp integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon can view public profiles" ON public.profiles FOR SELECT TO anon USING (is_public = true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    lower(regexp_replace(split_part(COALESCE(NEW.email, 'dev'), '@', 1), '[^a-zA-Z0-9_]', '', 'g')) || '_' || substr(replace(NEW.id::text,'-',''), 1, 6),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email,'Dev'), '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========== SNIPPETS ==========
CREATE TABLE public.snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  language text NOT NULL DEFAULT 'javascript',
  code text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.snippets TO authenticated;
GRANT SELECT ON public.snippets TO anon;
GRANT ALL ON public.snippets TO service_role;
ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage snippets" ON public.snippets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public snippets viewable by authenticated" ON public.snippets FOR SELECT TO authenticated USING (is_public = true);
CREATE POLICY "Public snippets viewable by anon" ON public.snippets FOR SELECT TO anon USING (is_public = true);
CREATE TRIGGER snippets_updated_at BEFORE UPDATE ON public.snippets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========== NOTES (offline-first sync) ==========
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  local_id text NOT NULL,
  title text NOT NULL DEFAULT 'Untitled',
  content text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  is_deleted boolean NOT NULL DEFAULT false,
  client_updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, local_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage notes" ON public.notes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========== PROJECTS (portfolio showcase) ==========
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  url text,
  repo_url text,
  tags text[] NOT NULL DEFAULT '{}',
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT ON public.projects TO anon;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage projects" ON public.projects FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public projects viewable by authenticated" ON public.projects FOR SELECT TO authenticated USING (is_public = true);
CREATE POLICY "Public projects viewable by anon" ON public.projects FOR SELECT TO anon USING (is_public = true);
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========== REVIEW LABS ==========
CREATE TABLE public.review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  language text NOT NULL DEFAULT 'javascript',
  code text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_requests TO authenticated;
GRANT ALL ON public.review_requests TO service_role;
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view reviews" ON public.review_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners insert reviews" ON public.review_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update reviews" ON public.review_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners delete reviews" ON public.review_requests FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER review_requests_updated_at BEFORE UPDATE ON public.review_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.review_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.review_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  line_start integer NOT NULL DEFAULT 1,
  line_end integer NOT NULL DEFAULT 1,
  content text NOT NULL,
  kind text NOT NULL DEFAULT 'comment' CHECK (kind IN ('comment','suggestion','praise')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_comments TO authenticated;
GRANT ALL ON public.review_comments TO service_role;
ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view comments" ON public.review_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own comments" ON public.review_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON public.review_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.comment_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.review_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.comment_votes TO authenticated;
GRANT ALL ON public.comment_votes TO service_role;
ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view votes" ON public.comment_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own votes" ON public.comment_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own votes" ON public.comment_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Realtime for review comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.review_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_votes;

-- ========== DAILY BUG CHALLENGES ==========
CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date date NOT NULL UNIQUE,
  title text NOT NULL,
  language text NOT NULL,
  difficulty text NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard')),
  prompt text NOT NULL,
  broken_code text NOT NULL,
  hint text,
  xp_reward integer NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.challenges TO authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view challenges" ON public.challenges FOR SELECT TO authenticated USING (challenge_date <= CURRENT_DATE);

-- Solutions kept in a separate locked-down table (no client grants)
CREATE TABLE public.challenge_solutions (
  challenge_id uuid PRIMARY KEY REFERENCES public.challenges(id) ON DELETE CASCADE,
  answer_pattern text NOT NULL,
  explanation text NOT NULL
);
GRANT ALL ON public.challenge_solutions TO service_role;
ALTER TABLE public.challenge_solutions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.challenge_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  answer text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.challenge_attempts TO authenticated;
GRANT ALL ON public.challenge_attempts TO service_role;
ALTER TABLE public.challenge_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own attempts" ON public.challenge_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Secure submit function: validates answer, records attempt, awards XP once
CREATE OR REPLACE FUNCTION public.submit_challenge_answer(_challenge_id uuid, _answer text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _pattern text;
  _explanation text;
  _reward integer;
  _correct boolean;
  _already boolean;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF length(_answer) > 10000 THEN RAISE EXCEPTION 'Answer too long'; END IF;

  SELECT s.answer_pattern, s.explanation, c.xp_reward INTO _pattern, _explanation, _reward
  FROM public.challenge_solutions s JOIN public.challenges c ON c.id = s.challenge_id
  WHERE s.challenge_id = _challenge_id AND c.challenge_date <= CURRENT_DATE;
  IF _pattern IS NULL THEN RAISE EXCEPTION 'Challenge not found'; END IF;

  SELECT EXISTS (SELECT 1 FROM public.challenge_attempts WHERE challenge_id = _challenge_id AND user_id = _uid AND is_correct) INTO _already;

  _correct := lower(regexp_replace(_answer, '\s+', '', 'g')) ~ lower(_pattern);

  INSERT INTO public.challenge_attempts (challenge_id, user_id, answer, is_correct)
  VALUES (_challenge_id, _uid, _answer, _correct);

  IF _correct AND NOT _already THEN
    UPDATE public.profiles SET xp = xp + _reward WHERE user_id = _uid;
  END IF;

  RETURN jsonb_build_object(
    'correct', _correct,
    'already_solved', _already,
    'xp_awarded', CASE WHEN _correct AND NOT _already THEN _reward ELSE 0 END,
    'explanation', CASE WHEN _correct THEN _explanation ELSE NULL END
  );
END;
$$;
REVOKE ALL ON FUNCTION public.submit_challenge_answer(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.submit_challenge_answer(uuid, text) TO authenticated;

-- Generic XP award (used for review activity)
CREATE OR REPLACE FUNCTION public.award_xp_for_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET xp = xp + 5 WHERE user_id = NEW.user_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER review_comment_xp AFTER INSERT ON public.review_comments FOR EACH ROW EXECUTE FUNCTION public.award_xp_for_comment();

-- Indexes
CREATE INDEX idx_snippets_user ON public.snippets(user_id);
CREATE INDEX idx_notes_user ON public.notes(user_id);
CREATE INDEX idx_projects_user ON public.projects(user_id);
CREATE INDEX idx_review_comments_review ON public.review_comments(review_id);
CREATE INDEX idx_profiles_xp ON public.profiles(xp DESC);
CREATE INDEX idx_profiles_username ON public.profiles(username);