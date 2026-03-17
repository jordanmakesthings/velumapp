-- Allow authenticated users to insert, update, delete tracks (admin functionality)
CREATE POLICY "Authenticated can insert tracks" ON public.tracks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update tracks" ON public.tracks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete tracks" ON public.tracks FOR DELETE TO authenticated USING (true);

-- Allow authenticated users to insert, update, delete courses
CREATE POLICY "Authenticated can insert courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update courses" ON public.courses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete courses" ON public.courses FOR DELETE TO authenticated USING (true);

-- Allow authenticated users to insert, update, delete mastery_classes
CREATE POLICY "Authenticated can insert mastery_classes" ON public.mastery_classes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update mastery_classes" ON public.mastery_classes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete mastery_classes" ON public.mastery_classes FOR DELETE TO authenticated USING (true);

-- Allow authenticated users to insert, update, delete journaling_prompts
CREATE POLICY "Authenticated can insert prompts" ON public.journaling_prompts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update prompts" ON public.journaling_prompts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete prompts" ON public.journaling_prompts FOR DELETE TO authenticated USING (true);