#!/usr/bin/env node

/**
 * Ecomail Lists Setup Script
 * 
 * Creates 5 contact lists in Ecomail via API.
 * Run: node scripts/setup-ecomail-lists.mjs
 */

const ECOMAIL_API_KEY = 'f21989cee8af4357bf3859e17a7bbb46b7eca7272050d7711a7afc9a09068c59';
const ECOMAIL_API_URL = 'https://api2.ecomailapp.cz';

// Lists to create
const LISTS = [
  {
    name: 'DechBar - Neregistrovaní (UNREG)',
    from_name: 'Pavel z DechBar',
    from_email: 'pavel@dechbar.cz',
    reply_to: 'pavel@dechbar.cz',
    code: 'UNREG'
  },
  {
    name: 'DechBar - Registrovaní (REG)',
    from_name: 'Pavel z DechBar',
    from_email: 'pavel@dechbar.cz',
    reply_to: 'pavel@dechbar.cz',
    code: 'REG'
  },
  {
    name: 'DechBar - Angažovaní (ENGAGED)',
    from_name: 'Pavel z DechBar',
    from_email: 'pavel@dechbar.cz',
    reply_to: 'pavel@dechbar.cz',
    code: 'ENGAGED'
  },
  {
    name: 'DechBar - Premium (PREMIUM)',
    from_name: 'Pavel z DechBar',
    from_email: 'pavel@dechbar.cz',
    reply_to: 'pavel@dechbar.cz',
    code: 'PREMIUM'
  },
  {
    name: 'DechBar - Churned (CHURNED)',
    from_name: 'Pavel z DechBar',
    from_email: 'pavel@dechbar.cz',
    reply_to: 'pavel@dechbar.cz',
    code: 'CHURNED'
  }
];

async function createList(listData) {
  try {
    console.log(`\n📝 Creating list: ${listData.name}...`);
    
    const response = await fetch(`${ECOMAIL_API_URL}/lists`, {
      method: 'POST',
      headers: {
        'key': ECOMAIL_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(listData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Created: ${listData.name}`);
      console.log(`   List ID: ${data.id}`);
      return { success: true, code: listData.code, id: data.id, name: listData.name };
    } else {
      console.error(`❌ Failed: ${listData.name}`);
      console.error(`   Error:`, data);
      return { success: false, code: listData.code, error: data };
    }
  } catch (error) {
    console.error(`❌ Network error for ${listData.name}:`, error.message);
    return { success: false, code: listData.code, error: error.message };
  }
}

async function setupLists() {
  console.log('🚀 Setting up Ecomail lists for DechBar...\n');
  console.log('API Endpoint:', ECOMAIL_API_URL);
  console.log('API Key:', ECOMAIL_API_KEY.substring(0, 20) + '...\n');
  
  const results = [];
  
  for (const list of LISTS) {
    const result = await createList(list);
    results.push(result);
    
    // Wait 500ms between requests (rate limiting)
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  const succeeded = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n✅ Created: ${succeeded.length}/${LISTS.length}`);
  console.log(`❌ Failed: ${failed.length}/${LISTS.length}`);
  
  if (succeeded.length > 0) {
    console.log('\n📋 CREATED LISTS:');
    succeeded.forEach(r => {
      console.log(`   ${r.code}: ${r.id} - ${r.name}`);
    });
    
    console.log('\n🔧 NEXT STEP: Configure Supabase Secrets:');
    console.log('\n```bash');
    succeeded.forEach(r => {
      console.log(`supabase secrets set ECOMAIL_LIST_${r.code}="${r.id}" --project-ref YOUR_DEV_PROJECT`);
    });
    console.log('```');
  }
  
  if (failed.length > 0) {
    console.log('\n⚠️  FAILED LISTS:');
    failed.forEach(r => {
      console.log(`   ${r.code}: ${r.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
}

// Run
setupLists().catch(console.error);
