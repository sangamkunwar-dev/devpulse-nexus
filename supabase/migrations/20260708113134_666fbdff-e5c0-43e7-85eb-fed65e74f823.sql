-- Lock down internal SECURITY DEFINER / trigger functions (not client-callable)
REVOKE ALL ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.award_xp_for_comment() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.submit_challenge_answer(uuid, text) FROM public, anon;
-- challenge_solutions has RLS with no policies by design (service_role only); add explicit deny-all clarity policy
CREATE POLICY "No client access" ON public.challenge_solutions FOR SELECT TO authenticated USING (false);