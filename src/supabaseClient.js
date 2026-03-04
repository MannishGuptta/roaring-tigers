import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ybtyvycgmahsxqclkgab.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlidHl2eWNnbWFoc3hxY2xrZ2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTgxNjQsImV4cCI6MjA4NzU5NDE2NH0.O3qcr39duZnFxfjTE6DwFY-eQXCLCYCVZ4ijaEFiHxs';

// Create a single instance of the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
