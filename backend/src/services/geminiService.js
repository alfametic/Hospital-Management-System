const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Intelligent emergency keywords scanner
 */
const detectEmergencyConditions = (symptomsText = '') => {
  const text = symptomsText.toLowerCase();
  const emergencyKeywords = [
    'crushing chest pain',
    'chest pressure radiating',
    'heart attack',
    'cannot breathe',
    'severe shortness of breath',
    'sudden paralysis',
    'slurred speech',
    'facial droop',
    'stroke',
    'loss of consciousness',
    'unconscious',
    'coughing blood',
    'severe arterial bleeding',
    'head trauma bleeding',
    'seizure lasting',
    'anaphylaxis',
    'throat closing'
  ];

  for (const kw of emergencyKeywords) {
    if (text.includes(kw)) {
      return {
        isEmergency: true,
        emergencyWarning: 'CRITICAL ALERT: Your reported symptoms indicate a potential acute life-threatening medical emergency. Do not wait for a routine clinic appointment. Immediately call emergency dispatch (911 or +1 800-555-HOSP) or go to the nearest hospital emergency trauma room.'
      };
    }
  }

  return { isEmergency: false, emergencyWarning: '' };
};

/**
 * Deterministic fallback triage matcher using real MongoDB departments
 */
const performDeterministicTriage = (symptomsText = '', departments = []) => {
  const text = symptomsText.toLowerCase();
  const emergencyCheck = detectEmergencyConditions(text);

  let bestMatch = null;
  let maxScore = 0;
  const scoredDepts = [];

  for (const dept of departments) {
    let score = 0;
    const nameMatch = dept.name.toLowerCase();
    if (text.includes(nameMatch)) score += 5;

    if (dept.commonSymptoms && Array.isArray(dept.commonSymptoms)) {
      for (const sym of dept.commonSymptoms) {
        const symLower = sym.toLowerCase();
        if (text.includes(symLower)) {
          score += 3;
        } else {
          // Check individual significant words
          const words = symLower.split(' ').filter(w => w.length > 3);
          for (const w of words) {
            if (text.includes(w)) score += 1;
          }
        }
      }
    }

    if (score > 0) {
      scoredDepts.push({ dept, score });
      if (score > maxScore) {
        maxScore = score;
        bestMatch = dept;
      }
    }
  }

  // Default to General Medicine if no specific match or low confidence
  if (!bestMatch) {
    bestMatch = departments.find(d => d.code === 'GENMED') || departments[0];
  }

  const alternativeDepts = scoredDepts
    .filter(item => item.dept.code !== bestMatch.code)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(item => item.dept.name);

  return {
    recommendedDepartment: bestMatch.name,
    departmentCode: bestMatch.code,
    explanation: maxScore > 0
      ? `Based on symptoms matching clinical indications for ${bestMatch.name} (such as ${bestMatch.commonSymptoms?.slice(0, 3).join(', ')}), our clinical guidelines recommend scheduling a consultation with this department.`
      : 'Given the broad nature of the provided symptoms, our initial recommendation is consultation with General Medicine / Primary Care for a preliminary clinical examination.',
    alternativeDepartments: alternativeDepts,
    isEmergency: emergencyCheck.isEmergency,
    emergencyWarning: emergencyCheck.emergencyWarning,
    source: 'clinical-triage-engine'
  };
};

/**
 * Recommends a hospital department using Gemini API with optional image analysis
 *
 * @param {Object} options
 * @param {string} options.symptoms - Visitor's symptom description
 * @param {Buffer} [options.imageBuffer] - Optional uploaded clinical image buffer
 * @param {string} [options.imageMimeType] - Optional image MIME type
 * @param {Array} options.departments - Active departments list fetched from MongoDB
 */
const recommendDepartmentWithGemini = async ({
  symptoms,
  imageBuffer,
  imageMimeType,
  departments
}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const emergencyCheck = detectEmergencyConditions(symptoms || '');

  // If API key is missing or blank, use the deterministic fallback matching MongoDB departments
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    const fallbackResult = performDeterministicTriage(symptoms, departments);
    if (emergencyCheck.isEmergency) {
      fallbackResult.isEmergency = true;
      fallbackResult.emergencyWarning = emergencyCheck.emergencyWarning;
    }
    return fallbackResult;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash-lite for speed, reliability, and multimodal capabilities
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    });

    const departmentListPrompt = departments
      .map(d => `- Name: "${d.name}", Code: "${d.code}", Scope: ${d.description}, Common Symptoms: ${d.commonSymptoms?.join(', ')}`)
      .join('\n');

    const promptText = `
You are an expert Hospital Department Routing Assistant for St. Jude Metropolitan Hospital.
Your ONLY role is to direct visitors to the appropriate hospital specialty department based on their described symptoms and optional visual image.

HOSPITAL REGISTERED DEPARTMENTS:
${departmentListPrompt}

VISITOR SYMPTOMS DESCRIPTION:
"${symptoms || 'Visual image provided without additional notes'}"

CRITICAL SAFETY & MEDICAL INSTRUCTIONS:
1. You are NOT a medical doctor. You MUST NOT diagnose any medical disease, illness, or condition.
2. You MUST NOT recommend any drugs, medications, therapies, or self-treatment.
3. You MUST recommend ONLY one primary department from the provided list of registered hospital departments above.
4. If an image is attached, inspect visual signs (e.g. rash, redness, swelling, lesion) strictly to select the right department (e.g., skin rash -> Dermatology, eye redness -> Ophthalmology).
5. If the symptoms are too vague, insufficient, or general, recommend "General Medicine" and advise speaking with a primary care physician.
6. Check for acute medical emergency indicators (e.g., severe crushing chest pain, difficulty breathing, stroke symptoms, major trauma, uncontrollable bleeding). If present, set "isEmergency": true and provide an urgent emergency warning.

RESPONSE FORMAT (JSON ONLY):
{
  "recommendedDepartment": "Exact Department Name from list",
  "departmentCode": "CODE",
  "explanation": "Clear, reassuring patient-friendly reason explaining why this department handles these types of clinical presentations.",
  "alternativeDepartments": ["Department Name 2"],
  "isEmergency": false,
  "emergencyWarning": ""
}
`;

    const contents = [promptText];

    // If an image was provided, add it as an inline part
    if (imageBuffer && imageMimeType) {
      contents.push({
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: imageMimeType
        }
      });
    }

    const result = await model.generateContent(contents);
    const response = await result.response;
    const textOutput = response.text();

    let parsed;
    try {
      parsed = JSON.parse(textOutput);
    } catch (parseErr) {
      // Regex extraction fallback if LLM included backticks
      const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse Gemini JSON response');
      }
    }

    // Verify recommended department actually exists in MongoDB
    const matchedDept = departments.find(
      d =>
        d.name.toLowerCase() === parsed.recommendedDepartment?.toLowerCase() ||
        d.code.toUpperCase() === parsed.departmentCode?.toUpperCase()
    );

    const finalDepartment = matchedDept || departments.find(d => d.code === 'GENMED') || departments[0];

    return {
      recommendedDepartment: finalDepartment.name,
      departmentCode: finalDepartment.code,
      explanation: parsed.explanation || `Recommended consultation with ${finalDepartment.name} based on reported symptoms.`,
      alternativeDepartments: Array.isArray(parsed.alternativeDepartments)
        ? parsed.alternativeDepartments
        : [],
      isEmergency: parsed.isEmergency || emergencyCheck.isEmergency,
      emergencyWarning: parsed.emergencyWarning || emergencyCheck.emergencyWarning,
      source: 'gemini-2.5-flash-lite'
    };
  } catch (apiError) {
    console.warn('[Gemini AI] Service error or quota limit reached, invoking deterministic clinical triage fallback:', apiError.message);
    const fallback = performDeterministicTriage(symptoms, departments);
    if (emergencyCheck.isEmergency) {
      fallback.isEmergency = true;
      fallback.emergencyWarning = emergencyCheck.emergencyWarning;
    }
    return fallback;
  }
};

module.exports = {
  recommendDepartmentWithGemini,
  detectEmergencyConditions,
  performDeterministicTriage
};
