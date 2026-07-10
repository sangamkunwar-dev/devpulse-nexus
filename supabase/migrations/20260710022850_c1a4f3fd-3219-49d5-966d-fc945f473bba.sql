
-- 1. Roles system
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-grant admin to designated email on verified signup
CREATE OR REPLACE FUNCTION public.grant_admin_for_designated_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF lower(NEW.email) = 'sangamkunwar48@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_grant_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_admin_for_designated_email();

-- Retroactively grant if user already exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE lower(email) = 'sangamkunwar48@gmail.com'
ON CONFLICT DO NOTHING;

-- 2. Challenge template bank + auto-publish
CREATE TABLE public.challenge_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  language text NOT NULL,
  difficulty text NOT NULL,
  prompt text NOT NULL,
  broken_code text NOT NULL,
  hint text,
  xp_reward integer NOT NULL DEFAULT 50,
  answer_pattern text NOT NULL,
  explanation text NOT NULL,
  last_used_on date,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.challenge_templates TO authenticated;
GRANT ALL ON public.challenge_templates TO service_role;
ALTER TABLE public.challenge_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage templates" ON public.challenge_templates FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Function: publish today's challenge from the template bank if none exists
CREATE OR REPLACE FUNCTION public.publish_daily_challenge()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _existing uuid;
  _tpl record;
  _new_id uuid;
BEGIN
  SELECT id INTO _existing FROM public.challenges WHERE challenge_date = CURRENT_DATE;
  IF _existing IS NOT NULL THEN RETURN _existing; END IF;

  -- pick least-recently-used template (nulls first), tie-break random
  SELECT * INTO _tpl FROM public.challenge_templates
  ORDER BY last_used_on NULLS FIRST, random() LIMIT 1;
  IF _tpl.id IS NULL THEN RETURN NULL; END IF;

  INSERT INTO public.challenges (challenge_date, title, language, difficulty, prompt, broken_code, hint, xp_reward)
  VALUES (CURRENT_DATE, _tpl.title, _tpl.language, _tpl.difficulty, _tpl.prompt, _tpl.broken_code, _tpl.hint, _tpl.xp_reward)
  RETURNING id INTO _new_id;

  INSERT INTO public.challenge_solutions (challenge_id, answer_pattern, explanation)
  VALUES (_new_id, _tpl.answer_pattern, _tpl.explanation);

  UPDATE public.challenge_templates SET last_used_on = CURRENT_DATE WHERE id = _tpl.id;
  RETURN _new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.publish_daily_challenge() TO authenticated, anon;

-- Seed template bank (20 bugs)
INSERT INTO public.challenge_templates (title, language, difficulty, prompt, broken_code, hint, xp_reward, answer_pattern, explanation) VALUES
('Off-by-one loop','javascript','easy','This loop skips the last item. Fix the condition.','for (let i = 0; i <= arr.length; i++) {\n  console.log(arr[i]);\n}','Array indices are 0-based.',40,'for\s*\(\s*let\s+i\s*=\s*0\s*;\s*i\s*<\s*arr\.length\s*;\s*i\+\+\s*\)','Use < arr.length, not <=. Indices go 0..length-1.'),
('Assignment vs equality','javascript','easy','This if always runs. Correct the operator.','if (user = "admin") { grantAccess(); }','= assigns, == or === compares.',40,'if\s*\(\s*user\s*===?\s*["'']admin["'']\s*\)','Use === for comparison; = is assignment.'),
('Mutable default argument','python','medium','Appending to items mutates a shared list across calls.','def add(x, items=[]):\n    items.append(x)\n    return items','Use None sentinel and create a new list inside.',60,'def\s+add\s*\(\s*x\s*,\s*items\s*=\s*None\s*\)','Default mutable args are shared. Use items=None then items = items or [].'),
('Missing await','javascript','easy','fetchUser returns a Promise but the code logs a Promise object.','const u = fetchUser(id);\nconsole.log(u.name);','fetchUser is async.',50,'const\s+u\s*=\s*await\s+fetchUser\s*\(\s*id\s*\)','Add await before fetchUser(id) inside an async function.'),
('Integer division','python','easy','avg is always 0 for small counts due to integer division in Py2 style.','avg = sum(nums) / len(nums)\nreturn int(avg)','This is fine in Py3, but for exact int division use //','40','return\s+sum\s*\(\s*nums\s*\)\s*//\s*len\s*\(\s*nums\s*\)','Use // for integer division; / returns float in Py3.'),
('Null deref','typescript','easy','user might be null; TS narrows with a guard.','function greet(user: User | null) {\n  return "Hi " + user.name;\n}','Guard against null first.',50,'if\s*\(\s*!\s*user\s*\)\s*return','Add if (!user) return ""; before accessing user.name.'),
('SQL injection','sql','hard','Interpolating input allows injection.','const q = "SELECT * FROM users WHERE name = ''" + name + "''";','Use parameterized queries.',80,'\$1|\?|prepared|parameteri[sz]ed','Use a parameterized query: WHERE name = $1 with bound params.'),
('Missing key prop','jsx','easy','React warns: each child in a list should have a unique key.','items.map(i => <li>{i.name}</li>)','Pass a unique key.',40,'items\.map\s*\(\s*i\s*=>\s*<li\s+key=\{i\.(id|name)\}','Add key={i.id} to <li>.'),
('CSS specificity','css','easy','.btn color is overridden by a broader rule. Increase specificity.','.btn { color: red; }','Use .container .btn or !important sparingly.',30,'\.container\s+\.btn|\.btn\s*\{\s*color:\s*red\s*!important','Increase specificity: .container .btn { color: red; }'),
('Async race','javascript','hard','Two setState calls after fetch may set stale data.','setLoading(true); fetch(url).then(r=>r.json()).then(setData); setLoading(false);','setLoading(false) fires immediately.',80,'\.then\s*\(\s*setData\s*\)\s*\.finally\s*\(\s*\(\)\s*=>\s*setLoading\s*\(\s*false','Chain setLoading(false) inside .finally() after the promise resolves.'),
('Immutable state update','react','medium','Pushing into state array does not trigger a re-render.','const add = x => { arr.push(x); setArr(arr); };','Create a new array.',60,'setArr\s*\(\s*\[\s*\.\.\.arr\s*,\s*x\s*\]\s*\)','Use setArr([...arr, x]) to create a new array reference.'),
('Missing return','javascript','easy','This map returns undefined for every item.','const doubled = nums.map(n => { n * 2 });','Arrow body with braces needs return.',40,'nums\.map\s*\(\s*n\s*=>\s*n\s*\*\s*2\s*\)','Drop braces: n => n * 2, or add return.'),
('Env var in client','node','medium','Secret API key shipped to browser.','const KEY = process.env.STRIPE_SECRET_KEY; // used in React','Move secret to server function.',60,'server|edge|backend|createServerFn','Never expose secret keys client-side; call from a server function.'),
('Float equality','python','easy','0.1 + 0.2 !== 0.3 due to float precision.','if a + b == 0.3: ...','Use math.isclose.',40,'math\.isclose\s*\(\s*a\s*\+\s*b\s*,\s*0\.3\s*\)','Use math.isclose(a+b, 0.3) for float comparison.'),
('Missing dependency','react','medium','useEffect uses userId but omits it from deps.','useEffect(() => { fetchUser(userId); }, []);','Add userId to deps.',60,'\}\s*,\s*\[\s*userId\s*\]\s*\)','Include all referenced values: [userId].'),
('Uncaught rejection','javascript','medium','No .catch on the promise.','fetch(url).then(r => r.json()).then(useData);','Add .catch or try/await.',50,'\.catch\s*\(','Add .catch(err => ...) to handle rejection.'),
('Shadowed variable','javascript','easy','Inner let hides outer count; result is 0.','let count = 5; function inc(){ let count = 0; count++; } inc(); console.log(count);','Remove inner declaration.',40,'function\s+inc\s*\(\s*\)\s*\{\s*count\+\+\s*;?\s*\}','Drop the inner let so inc mutates the outer count.'),
('Wrong http status','node','easy','Server returns 200 for a not-found resource.','res.status(200).json({ error: "not found" });','Use 404.',40,'res\.status\s*\(\s*404\s*\)','Return res.status(404).json(...).'),
('Missing await in loop','javascript','medium','forEach does not await async work.','arr.forEach(async x => { await save(x); }); console.log("done");','Use for..of or Promise.all.',60,'for\s*\(\s*const\s+x\s+of\s+arr\s*\)\s*\{\s*await\s+save\s*\(\s*x\s*\)|Promise\.all\s*\(\s*arr\.map','Use for (const x of arr) { await save(x); } or Promise.all(arr.map(save)).'),
('Unclosed tag','html','easy','List renders broken due to missing closing tag.','<ul><li>one<li>two</ul>','Close each <li>.',30,'<li>one</li>\s*<li>two</li>','Close every <li>: <li>one</li><li>two</li>.');

-- Publish today's challenge now if missing
SELECT public.publish_daily_challenge();

-- 3. Schedule daily publish via pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'publish-daily-bug',
  '5 0 * * *',
  $$ SELECT public.publish_daily_challenge(); $$
);
