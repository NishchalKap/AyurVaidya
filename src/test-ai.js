
const API_URL = 'http://localhost:3000/api/v1';

async function runTest() {
    console.log('🧪 Starting AI Integration Test...\n');

    // step 1: Create a Booking
    const bookingId = `bk_test_${Date.now()}`;
    console.log('1️⃣  Creating Booking:', bookingId);
    await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            doctorId: 'ananya',
            date: '2026-01-10',
            time: '10:00 AM',
            type: 'Video Call'
        })
    });

    // Wait for Bridge
    console.log('   ⏳ Waiting for Bridge (5s)...');
    await new Promise(r => setTimeout(r, 5000));

    // Step 2: Find the Bridge Case
    console.log('\n2️⃣  Finding Bridge Case...');
    const casesRes = await fetch(`${API_URL}/cases?limit=100`);
    const casesData = await casesRes.json();

    // Find case matching our booking bridge logic (bridge creates cases with specific note structure)
    // Since we can't easily filter by notes via API, we'll check the most recently created
    // In a real scenario, we'd filter by source
    const allCases = casesData.data.cases;

    // Sort by createdAt descending if not already
    allCases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const newCase = allCases[0];
    console.log('   ✅ Found Newest Case:', newCase.id);
    console.log('   Stats:', newCase.status, newCase.priority);

    // Step 3: Trigger AI Processing
    console.log(`\n3️⃣  Triggering AI Processing for ${newCase.id}...`);
    const processRes = await fetch(`${API_URL}/ai/process/${newCase.id}`, { method: 'POST' });
    const processData = await processRes.json();
    console.log('   Processing Result:', JSON.stringify(processData, null, 2));

    // Step 4: Get Summary
    console.log('\n4️⃣  Fetching Clinical Summary...');
    const summaryRes = await fetch(`${API_URL}/ai/summary/${newCase.id}`);

    if (summaryRes.ok) {
        const summary = await summaryRes.json();
        console.log('\n✅ SUCCESS! Real AI Summary Received:');
        console.log('------------------------------------------------');
        console.log(JSON.stringify(summary.data, null, 2));
        console.log('------------------------------------------------');
    } else {
        console.log('❌ Failed to get summary:', await summaryRes.text());
    }
}

runTest();
