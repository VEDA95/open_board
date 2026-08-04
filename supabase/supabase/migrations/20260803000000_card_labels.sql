-- Join table linking cards to their board-scoped labels. RLS mirrors
-- check_list_items: access is gated by check_card_access(card), and
-- assigning/unassigning a label is a board:update-level edit.
CREATE TABLE public.card_labels (
    card uuid NOT NULL,
    label uuid NOT NULL,
    CONSTRAINT card_labels_pkey PRIMARY KEY (card, label),
    CONSTRAINT card_labels_card_fkey FOREIGN KEY (card) REFERENCES public.cards(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT card_labels_label_fkey FOREIGN KEY (label) REFERENCES public.labels(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX idx_card_labels_card ON public.card_labels USING btree (card);

ALTER TABLE public.card_labels ENABLE ROW LEVEL SECURITY;


  create policy "card_labels_select"
  on "public"."card_labels"
  as permissive
  for select
  to authenticated
using (public.check_card_access(card));



  create policy "card_labels_insert"
  on "public"."card_labels"
  as permissive
  for insert
  to authenticated
with check ((public.check_card_access(card) AND public.check_permissions(VARIADIC ARRAY['board:update'::character varying])));



  create policy "card_labels_delete"
  on "public"."card_labels"
  as permissive
  for delete
  to authenticated
using ((public.check_card_access(card) AND public.check_permissions(VARIADIC ARRAY['board:update'::character varying])));
