
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zfoojywrnrjixbkylerk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmb29qeXdybnJqaXhia3lsZXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMjYwNjAsImV4cCI6MjA3OTkwMjA2MH0.dICsL3PHOPSWZ5lVA_2k7rCsWBiv0FHI2IPM8WSJ8pw';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});
