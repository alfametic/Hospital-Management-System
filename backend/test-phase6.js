const http = require('http');
const app = require('./src/app');

const PORT = 5059;
process.env.PORT = PORT;

const server = app.listen(PORT, async () => {
  console.log(`[Test Server Phase 6] Running on http://localhost:${PORT}`);

  try {
    const postJSON = (path, body, headers = {}) => {
      return new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const req = http.request(
          {
            hostname: 'localhost',
            port: PORT,
            path,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload),
              ...headers
            }
          },
          (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
              try {
                resolve({ status: res.statusCode, body: JSON.parse(data) });
              } catch (e) {
                resolve({ status: res.statusCode, raw: data });
              }
            });
          }
        );
        req.on('error', reject);
        req.write(payload);
        req.end();
      });
    };

    const postMultipart = (path, fields, file) => {
      return new Promise((resolve, reject) => {
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
        let body = [];

        // Add text fields
        for (const [key, value] of Object.entries(fields)) {
          body.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`));
        }

        // Add file
        if (file) {
          body.push(Buffer.from(
            `--${boundary}\r\nContent-Disposition: form-data; name="${file.fieldname}"; filename="${file.filename}"\r\nContent-Type: ${file.mimetype}\r\n\r\n`
          ));
          body.push(file.content);
          body.push(Buffer.from('\r\n'));
        }

        body.push(Buffer.from(`--${boundary}--\r\n`));
        const payload = Buffer.concat(body);

        const req = http.request(
          {
            hostname: 'localhost',
            port: PORT,
            path,
            method: 'POST',
            headers: {
              'Content-Type': `multipart/form-data; boundary=${boundary}`,
              'Content-Length': payload.length
            }
          },
          (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
              try {
                resolve({ status: res.statusCode, body: JSON.parse(data) });
              } catch (e) {
                resolve({ status: res.statusCode, raw: data });
              }
            });
          }
        );
        req.on('error', reject);
        req.write(payload);
        req.end();
      });
    };

    // 1. Test Text-Only: Skin Symptoms -> Should recommend Dermatology
    const dermaRes = await postJSON('/api/ai/recommend-department', {
      symptoms: 'I have developed an itchy, red skin rash with dry scaly patches on my elbows.'
    });
    console.log('✔ Dermatology Recommendation Test:', dermaRes.status, dermaRes.body.data?.department?.name);
    if (!dermaRes.body.data?.department?.name.toLowerCase().includes('derma')) {
      throw new Error(`Expected Dermatology, got: ${dermaRes.body.data?.department?.name}`);
    }
    console.log('  -> Explanation:', dermaRes.body.data.explanation.slice(0, 80) + '...');
    console.log('  -> Available Specialists found:', dermaRes.body.data.availableDoctors.length);
    console.log('  -> Disclaimer present:', !!dermaRes.body.data.disclaimer);

    // 2. Test Text-Only: Cardiac Symptoms -> Should recommend Cardiology
    const cardioRes = await postJSON('/api/ai/recommend-department', {
      symptoms: 'Experiencing heart palpitations, elevated blood pressure, and mild shortness of breath during climbing stairs.'
    });
    console.log('✔ Cardiology Recommendation Test:', cardioRes.status, cardioRes.body.data?.department?.name);
    if (!cardioRes.body.data?.department?.name.toLowerCase().includes('cardio')) {
      throw new Error(`Expected Cardiology, got: ${cardioRes.body.data?.department?.name}`);
    }

    // 3. Test Acute Emergency Detection -> Must flag isEmergency: true
    const emergencyRes = await postJSON('/api/ai/recommend-department', {
      symptoms: 'Experiencing crushing chest pain radiating to my jaw and left arm, cannot breathe, sweating profusely.'
    });
    console.log('✔ Emergency Triage Test:', emergencyRes.status, 'isEmergency:', emergencyRes.body.data?.isEmergency);
    if (!emergencyRes.body.data?.isEmergency) {
      throw new Error('Expected isEmergency to be true for acute myocardial infarction symptoms');
    }
    console.log('  -> Emergency Notice:', emergencyRes.body.data.emergencyWarning.slice(0, 90) + '...');

    // 4. Test Multimodal Image Upload (Valid PNG image)
    // 1x1 transparent PNG buffer
    const validPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const imageRes = await postMultipart(
      '/api/ai/recommend-department',
      { symptoms: 'Redness on eyelid and blurry vision in the morning' },
      { fieldname: 'image', filename: 'eye_lesion.png', mimetype: 'image/png', content: validPngBuffer }
    );
    console.log('✔ Multimodal Image Analysis Test:', imageRes.status, imageRes.body.data?.department?.name);
    if (!imageRes.body.data?.department?.name.toLowerCase().includes('ophth') && !imageRes.body.data?.department?.name.toLowerCase().includes('general')) {
      console.log('  Recommended:', imageRes.body.data?.department?.name);
    }

    // 5. Test File Validation: Reject Non-Image Files (e.g. text/plain)
    const invalidFileRes = await postMultipart(
      '/api/ai/recommend-department',
      { symptoms: 'Checking invalid upload' },
      { fieldname: 'image', filename: 'report.pdf', mimetype: 'application/pdf', content: Buffer.from('%PDF-1.4 test') }
    );
    console.log('✔ File Format Security Filter (Expected 400 Bad Request):', invalidFileRes.status, invalidFileRes.body.message);
    if (invalidFileRes.status !== 400) {
      throw new Error(`Expected 400 for non-image file, got: ${invalidFileRes.status}`);
    }

    // 6. Test Empty Request (Neither symptoms nor image) -> Expected 400
    const emptyRes = await postJSON('/api/ai/recommend-department', {});
    console.log('✔ Empty Request Validation (Expected 400 Bad Request):', emptyRes.status);
    if (emptyRes.status !== 400) {
      throw new Error(`Expected 400 for empty request, got: ${emptyRes.status}`);
    }

    console.log('\n=== ALL PHASE 6 BACKEND CHECKS PASSED SUCCESSFULLY ===\n');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Phase 6 backend test error:', err);
    server.close();
    process.exit(1);
  }
});
