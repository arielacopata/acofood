// shared.js - Solo conexión Supabase y variables compartidas
console.log('shared.js loading...');

let userCode = localStorage.getItem('acofood_usercode') || 'testing_arielaco';
let supabase;

const SUPABASE_URL = 'https://odqjwkdpqdwgkwztvzoi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kcWp3a2RwcWR3Z2t3enR2em9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMzkxMjksImV4cCI6MjA3MzkxNTEyOX0.Qp2QHG4ozfzEndhkXlYbUtpHDR_7plMZEAKCnMJbB_Q';

window.addEventListener('load', function() {
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase initialized successfully from shared.js');
        console.log('UserCode:', userCode);
    } else {
        console.error('window.supabase not available in shared.js');
    }
});

window.directSupabaseQuery = async function(table, params) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
        headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
        }
    });
    return await response.json();
};

console.log('shared.js loaded successfully');