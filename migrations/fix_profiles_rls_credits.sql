-- FIX CRITIQUE : Empêcher la manipulation de crédits
-- La politique "Users can update own profile" permettait de modifier TOUTES les colonnes,
-- y compris monthly_credits, subscription_status, role, et credits.

-- 1. Supprimer l'ancienne politique dangereuse
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 2. Créer une politique restrictive
-- L'utilisateur ne peut modifier QUE full_name et avatar_url
-- Les champs sensibles (monthly_credits, subscription_status, role, credits) 
-- ne peuvent PAS changer via cette politique.
CREATE POLICY "Users can update own profile safely"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND monthly_credits IS NOT DISTINCT FROM (SELECT monthly_credits FROM public.profiles WHERE id = auth.uid())
  AND subscription_status IS NOT DISTINCT FROM (SELECT subscription_status FROM public.profiles WHERE id = auth.uid())
  AND role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid())
  AND credits IS NOT DISTINCT FROM (SELECT credits FROM public.profiles WHERE id = auth.uid())
);

-- 3. Vérifier que le Service Role a toujours accès total
DROP POLICY IF EXISTS "Service Role profiles" ON public.profiles;
CREATE POLICY "Service Role profiles"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
