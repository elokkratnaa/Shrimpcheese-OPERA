
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Checking sessions...");
  const { data, error } = await supabase.from('sessions').select('*');
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Sessions found:", data.length);
    console.log(data);
  }
}

run();
