import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tszmnmkutcdlxdlifvhx.supabase.co'; // ← ton URL Supabase
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzem1ubWt1dGNkbHhkbGlmdmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNjU0MTcsImV4cCI6MjA2Mzg0MTQxN30.LANT_CRo83VsZpEAoSCoU7jYoMDmXZla1RjdTH6izpQ';     // ← ta clé publique

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
