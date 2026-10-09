import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserSettings, DEFAULT_USER_SETTINGS } from '@/types/chat';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Synchronize User Settings to Supabase (Non-content ONLY)
export async function syncSettingsToSupabase(
  userId: string,
  settings: UserSettings
): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;

  try {
    const { error } = await supabase.from('user_settings').upsert({
      user_id: userId,
      display_name: settings.displayName,
      nicknames: settings.nicknames,
      priority_keywords: settings.priorityKeywords,
      theme: settings.theme,
      ai_mode_preference: settings.aiMode,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('Failed to sync settings to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase sync exception:', err);
    return false;
  }
}

// Fetch User Settings from Supabase
export async function fetchSettingsFromSupabase(
  userId: string
): Promise<UserSettings | null> {
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return {
      displayName: data.display_name || DEFAULT_USER_SETTINGS.displayName,
      nicknames: data.nicknames || DEFAULT_USER_SETTINGS.nicknames,
      priorityKeywords: data.priority_keywords || DEFAULT_USER_SETTINGS.priorityKeywords,
      theme: data.theme === 'light' ? 'light' : 'dark',
      aiMode: data.ai_mode_preference === 'quick' ? 'quick' : 'smart',
    };
  } catch {
    return null;
  }
}

// Optional Anonymous counter: message count bucket and mode only, ABSOLUTELY ZERO CONTENT
export async function recordAnonymousStat(
  messageCount: number,
  mode: 'rules' | 'ollama'
): Promise<void> {
  if (!supabase || !isSupabaseConfigured) return;

  try {
    await supabase.from('anonymous_stats').insert({
      event_type: 'summary_generated',
      processed_message_count: messageCount,
      processing_mode: mode,
    });
  } catch {
    // Non-blocking telemetry
  }
}
