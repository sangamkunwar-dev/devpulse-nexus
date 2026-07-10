
REVOKE EXECUTE ON FUNCTION public.publish_daily_challenge() FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_daily_challenge() TO service_role;
