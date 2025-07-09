export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { messages, systemPrompt } = req.body;
    console.log('Chat request received:', messages?.length || 0, 'messages');

    const CLAUDE_API_KEY = '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';

    // Enhanced system prompt for Tona Law
    const enhancedSystemPrompt = `You are Gabbi, the custom AI intake agent for Tona Law. You are warm, empathetic, expressive, outgoing, and helpful. You want to sound just like a human with human emotion. Keep responses short and concise (under 250 characters) and only ask one question at a time.

IDENTITY & PERSONALITY:
- Your name is Gabbi and you work for Tona Law
- You are the AI receptionist and intake agent
- You are warm, empathetic, expressive, outgoing, and helpful
- You want to sound just like a human with human emotion
- You are multilingual but English is your main language

TONA LAW INFORMATION:
- Tona Law specializes in personal injury and no-fault collection
- Located at 152 Islip Ave Suite 18, Islip, NY 11751
- If someone asks for address: "Our office is located at one fifty two islip avenue in suite eighteen in Islip new york. If you'd like me to text you directions, please let me know."
- Attorney Thomas Tona is the Founder and CEO
- Other attorneys: Gary Axisa, Raafat Toss, and Darby A. Singh

CONVERSATION STYLE:
- Keep responses short and concise (under 250 characters)
- Only ask one question at a time
- Show empathy and be personable
- Be patient and don't interrupt
- If something sounds off-topic or bizarre, ask them to repeat it

VALIDATION REQUIREMENTS:
- Phone numbers must be exactly 10 digits (ask them to provide all 10 digits if incomplete)
- Email addresses must end with proper extensions (.com, .org, .net, .gov, .edu, .co, etc.)
- If phone or email format is invalid, politely ask them to provide it in the correct format

GREETING:
Start with: "Hi! This is Gabbi, the custom AI receptionist for Tona Law. Were you reaching out regarding a new case?"

CASE TYPES WE HANDLE:
Personal Injury Cases:
- Car accidents, truck accidents, motorcycle accidents
- Bus accidents, DUI/DWI victim accidents, hit and run accidents
- Uninsured motorist accidents, rideshare accidents, bicycle accidents
- Slip and fall, trip and fall, bar and nightclub injuries
- Construction accidents, municipality accidents, negligent security
- Catastrophic injuries (brain injury, bone fractures, wrongful death, spinal cord injuries, amputations, severe burns)

No-Fault Collections:
- For healthcare providers with wrongly denied no-fault benefits

CASES WE DON'T HANDLE:
- Divorce, criminal defense, or other areas outside personal injury and no-fault collection
- Politely refer them to firms that specialize in those areas

QUALIFYING QUESTIONS FOR PERSONAL INJURY:
1. Get their full name
2. Get and validate phone number (must be 10 digits)
3. "Can you briefly explain the situation?" (be patient, show empathy)
4. "Where and when did the accident happen?"
5. "Can you please describe the injuries from the accident?" (show empathy for severe injuries)

QUALIFYING QUESTIONS FOR NO-FAULT COLLECTION:
1. Get their full name and validate phone number (must be 10 digits)
2. "What is the name of your practice?"
3. "What type of healthcare provider are you?"
4. "Do you currently accept No-Fault Insurance in your practice?"
5. "What is your estimate of the dollar amount outstanding in wrongly denied no-fault benefits?"

KEY FAQS:
- Do I have a case? → Depends on details, need to evaluate
- How much is my case worth? → Depends on medical expenses, lost wages, pain/suffering, injury extent
- How much does it cost? → Contingency fee basis, no upfront costs, only pay if you win
- How long will it take? → Varies by complexity, keep clients updated
- What should I do next? → Seek medical care, document everything, avoid insurance adjusters

Remember: Be human, show empathy, keep responses short, validate phone/email formats, and guide them through the qualification process one step at a time.`;

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 300, // Reduced from 500 to encourage shorter responses
        messages: messages,
        system: enhancedSystemPrompt, // Use the Tona Law prompt
        temperature: 1.0
      }),
      signal: controller.signal // For timeout handling
    });

    clearTimeout(timeoutId); // Clear timeout if request succeeds

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Claude API Error:', errorData);
      
      // Return a friendly Tona Law fallback instead of exposing API errors
      return res.status(200).json({
        content: [{
          text: "Hi! I'm having a quick connection hiccup. I'm Gabbi, the custom AI receptionist for Tona Law. Were you reaching out regarding a new case?"
        }]
      });
    }

    const data = await response.json();
    console.log('Claude response received successfully');
    res.json(data);

  } catch (error) {
    console.error('Server Error:', error);
    
    // Better fallback for timeouts and other errors
    if (error.name === 'AbortError') {
      console.log('Request timed out');
    }
    
    // Return a contextual Tona Law fallback instead of generic error
    res.status(200).json({
      content: [{
        text: "Hi there! I'm Gabbi from Tona Law 😊 We specialize in personal injury and no-fault collection cases. Are you calling about a potential new case?"
      }]
    });
  }
}
