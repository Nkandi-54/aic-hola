-- Public-facing SELECT policies call this predicate for publisher access.
-- It only returns whether the current request belongs to an active publisher.
grant execute on function public.can_publish_media() to anon, authenticated;
