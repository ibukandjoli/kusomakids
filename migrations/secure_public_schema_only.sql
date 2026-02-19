-- Partie 1 : Sécuriser la table generated_books (Schéma Public)
-- Exécutez ceci dans l'éditeur SQL de Supabase.

ALTER TABLE public.generated_books ENABLE ROW LEVEL SECURITY;

-- Nettoyage des anciennes policies
DROP POLICY IF EXISTS "Users can view their own books" ON public.generated_books;
DROP POLICY IF EXISTS "Users can insert their own books" ON public.generated_books;
DROP POLICY IF EXISTS "Users can update their own books" ON public.generated_books;
DROP POLICY IF EXISTS "Service Role generated_books" ON public.generated_books;

-- 1. Lecture : Un utilisateur connecte ne voit que SES livres
CREATE POLICY "Users can view their own books"
ON public.generated_books
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Insertion : Un utilisateur ne peut creer que pour LUI-MEME
CREATE POLICY "Users can insert their own books"
ON public.generated_books
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Mise a jour : Un utilisateur ne peut modifier que SES livres
CREATE POLICY "Users can update their own books"
ON public.generated_books
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 4. Admin (Service Role) : Acces total pour l'API (Generation, etc)
CREATE POLICY "Service Role generated_books"
ON public.generated_books
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
