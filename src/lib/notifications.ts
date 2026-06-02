import { supabase } from './supabase';

export async function createNotification(userId: string, message: string) {
  if (!userId || !message) return;
  try {
    const { error } = await supabase
      .from('notifications' as any)
      .insert([{ user_id: userId, message, is_read: false }] as any);
    if (error) console.error('createNotification error:', error);
  } catch (e) {
    console.error('createNotification exception:', e);
  }
}

export async function notifyDeveloperApproved(developerUserId: string) {
  return createNotification(
    developerUserId,
    'Your developer account has been approved!'
  );
}

export async function notifyAppApproved(ownerUserId: string, appName: string) {
  return createNotification(
    ownerUserId,
    `Your app [${appName}] has been approved and is now live!`
  );
}

export async function getDeveloperUserIdById(developerId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('developers')
    .select('user_id')
    .eq('id', developerId)
    .maybeSingle();
  if (error || !data) return null;
  return (data as any).user_id ?? null;
}
