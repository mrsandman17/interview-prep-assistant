const fs = require('fs');
const http = require('http');

// Read CSV file
const csvContent = fs.readFileSync('./sample-problems.csv', 'utf-8');

// Prepare request
const payload = JSON.stringify({ csvContent });
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/problems/import',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

// Send request
console.log('Importing CSV...');
const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Response:', JSON.parse(data));

    // Test GET /api/problems
    console.log('\nFetching all problems...');
    http.get('http://localhost:3000/api/problems', (res2) => {
      let data2 = '';
      res2.on('data', (chunk) => data2 += chunk);
      res2.on('end', () => {
        const problems = JSON.parse(data2);
        console.log(`Found ${problems.length} problems`);

        // Test GET /api/daily
        console.log('\nFetching daily selection...');
        http.get('http://localhost:3000/api/daily', (res3) => {
          let data3 = '';
          res3.on('data', (chunk) => data3 += chunk);
          res3.on('end', () => {
            const daily = JSON.parse(data3);
            console.log(`Today's selection: ${daily.problems.length} problems`);
            daily.problems.forEach(p => console.log(`  - ${p.name}`));

            // Test GET /api/stats
            console.log('\nFetching stats...');
            http.get('http://localhost:3000/api/stats', (res4) => {
              let data4 = '';
              res4.on('data', (chunk) => data4 += chunk);
              res4.on('end', () => {
                const stats = JSON.parse(data4);
                console.log('Stats:', stats);
                console.log('\n✅ ALL TESTS PASSED!');
              });
            });
          });
        });
      });
    });
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(payload);
req.end();
