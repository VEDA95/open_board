CREATE POLICY "comment_attachments_select"
    ON public.comment_attachments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.comments c
            WHERE c.id = comment_attachments.comment
                AND check_card_access(c.card)
        )
    );

CREATE POLICY "comment_attachments_insert"
    ON public.comment_attachments FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.comments c
            WHERE c.id = comment_attachments.comment
                AND c.user_id = (SELECT auth.uid())
                AND check_card_access(c.card)
        )
    );

CREATE POLICY "comment_attachments_delete"
    ON public.comment_attachments FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.comments c
            WHERE c.id = comment_attachments.comment
                AND (
                    c.user_id = (SELECT auth.uid())
                    OR check_permissions('board:manage')
                )
                AND check_card_access(c.card)
        )
    );