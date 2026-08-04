import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@lib/types/supabase';

// Best-effort activity log. The card_activities insert policy requires
// user_id = auth.uid(), which the cookie-bound client satisfies. Failures are
// swallowed: an activity row should never block the edit it describes.
export async function logActivity(
  supabase: SupabaseClient<Database>,
  cardId: string,
  userId: string,
  activity: string
): Promise<void> {
  await supabase
    .from('card_activities')
    .insert({ card: cardId, user_id: userId, activity });
}
