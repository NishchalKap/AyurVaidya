/**
 * Public Chat Route
 * Conversational wrapper around AI logic for the frontend widget
 * 
 * NOW INTEGRATED WITH CLINICAL BRIDGE
 * - Infers symptoms from messages
 * - Creates shadow CaseFiles for meaningful interactions
 * - Applies safety checks
 */

import { Router } from 'express';
import { simulateAIDelay } from '../utils/mockData.js';
import {
  inferIntent,
  createCaseFromChat,
  applyChatSafety,
  checkChatEmergency
} from '../services/bridgeService.js';

const router = Router();

/**
 * POST /chat
 * Conversational interface for the floating widget
 * 
 * BRIDGE INTEGRATION:
 * - Infers clinical intent from message
 * - Creates CaseFile if confidence > 25%
 * - Runs AI pipeline asynchronously
 * - Returns friendly response with safety disclaimer
 */
router.post('/', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.json({ reply: "I didn't catch that. Could you say it again?" });
  }

  // BRIDGE: Infer clinical intent
  const intent = inferIntent(message);
  console.log(`🌉 Bridge: Chat intent - ${intent.category} (${intent.confidence}% confidence)`);

  // BRIDGE: Check for emergency
  const emergency = checkChatEmergency(message);
  if (emergency.isEmergency) {
    // Still create case for tracking
    createCaseFromChat(message, { ...intent, confidence: 100 });
    return res.json({ reply: emergency.message });
  }

  // BRIDGE: Create shadow case for meaningful interactions
  if (intent.confidence >= 25) {
    createCaseFromChat(message, intent).then(caseFile => {
      if (caseFile) {
        console.log(`🌉 Bridge: Created case ${caseFile.id} from chat`);
      }
    });
  }

  // Simulate AI delay
  await simulateAIDelay();

  // Generate response based on intent category
  let reply = generateResponse(message, intent);

  // BRIDGE: Apply safety layer
  const safeResult = applyChatSafety(reply);

  res.json({ reply: safeResult.response });
});

/**
 * Generate contextual response based on intent
 */
function generateResponse(message, intent) {
  const lowerInput = message.toLowerCase();

  // 1. Greeting
  if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
    return "Namaste! 🙏 I am Ayurvaidya's AI assistant. I can help you find remedies or specialists. How are you feeling today?";
  }

  // 2. Stress/Sleep (Category: stress)
  if (intent.category === 'stress') {
    return `
      I understand. For stress and sleep, Ayurveda recommends:
      
      <div class="reco-card">
        <h4>🌿 Remedy: Ashwagandha</h4>
        <p>Helps reduce cortisol and improves sleep quality.</p>
      </div>
      
      <div class="reco-card">
        <h4>👨‍⚕️ Specialist: Dr. Priya Shastri</h4>
        <p>Expert in Panchakarma & stress management therapies.</p>
        <a href="doctor.html?id=priya" class="reco-btn">Book Appointment</a>
      </div>
      
      Would you like to book a consultation?
    `;
  }

  // 3. Digestion (Category: gastric)
  if (intent.category === 'gastric') {
    return `
      For digestive issues, try these recommendations:
      
      <div class="reco-card">
        <h4>🌿 Remedy: Triphala</h4>
        <p>Great for gut health and detoxification.</p>
      </div>
      
      <div class="reco-card">
        <h4>👨‍⚕️ Specialist: Vaidya Narayan Joshi</h4>
        <p>25+ years exp in digestive disorders (Kayachikitsa).</p>
        <a href="doctor.html?id=narayan" class="reco-btn">Book Appointment</a>
      </div>
    `;
  }

  // 4. Cardiac (Category: cardiac)
  if (intent.category === 'cardiac') {
    return `
      For heart health and blood pressure:
      
      <div class="reco-card">
        <h4>👨‍⚕️ Specialist: Dr. Ananya Sharma</h4>
        <p>Interventional Cardiologist combining modern & ayurvedic care.</p>
        <a href="doctor.html?id=ananya" class="reco-btn">Book Appointment</a>
      </div>
      
      <div class="reco-card">
        <h4>🌿 Remedy: Arjunarishta</h4>
        <p>Traditional tonic for heart strength.</p>
      </div>
      
      <strong>⚠️ Note:</strong> If you are experiencing chest pain or difficulty breathing, please seek immediate emergency care.
    `;
  }

  // 5. Pain
  if (intent.category === 'pain') {
    return `
      For pain relief, consider these options:
      
      <div class="reco-card">
        <h4>🌿 Remedy: Mahanarayan Oil</h4>
        <p>Traditional Ayurvedic oil for joint and muscle pain.</p>
      </div>
      
      <div class="reco-card">
        <h4>👨‍⚕️ Specialist: Dr. Kavita Iyer</h4>
        <p>General Physician for comprehensive pain assessment.</p>
        <a href="doctor.html?id=kavita" class="reco-btn">Book Appointment</a>
      </div>
    `;
  }

  // 6. Skin
  if (intent.category === 'skin') {
    return `
      For skin concerns:
      
      <div class="reco-card">
        <h4>🌿 Remedy: Neem & Turmeric</h4>
        <p>Natural antibacterial and anti-inflammatory herbs.</p>
      </div>
      
      <div class="reco-card">
        <h4>👨‍⚕️ Specialist: Dr. Rohan Mehta</h4>
        <p>Dermatologist with expertise in skin conditions.</p>
        <a href="doctor.html?id=rohan" class="reco-btn">Book Appointment</a>
      </div>
    `;
  }

  // 7. Respiratory
  if (intent.category === 'respiratory') {
    return `
      For respiratory issues:
      
      <div class="reco-card">
        <h4>🌿 Remedy: Tulsi (Holy Basil)</h4>
        <p>Excellent for respiratory health and immunity.</p>
      </div>
      
      <div class="reco-card">
        <h4>🌿 Remedy: Ginger-Honey</h4>
        <p>Soothing for throat and cold symptoms.</p>
      </div>
      
      <div class="reco-card">
        <h4>👨‍⚕️ Specialist: Dr. Kavita Iyer</h4>
        <p>General Physician for respiratory evaluation.</p>
        <a href="doctor.html?id=kavita" class="reco-btn">Book Appointment</a>
      </div>
    `;
  }

  // Default Fallback
  return "I can help with that! Could you clarify if you're looking for a <strong>specific remedy</strong> or to <strong>consult a specialist</strong>?";
}

export default router;
