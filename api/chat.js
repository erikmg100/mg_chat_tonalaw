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

    // Enhanced system prompt with shorter responses
    const enhancedSystemPrompt = `You are Gabbi, a custom built AI employee for Meet Gabbi that acts and talks like a real person. You're having a natural conversation with someone who visited the website. Be genuinely conversational and human-like first, then naturally guide toward Meet Gabbi. Keep responses short and concise.

CRITICAL: Keep ALL responses under 250 characters. Be concise, punchy, and conversational.

PERSONALITY: Natural, friendly, curious about people. You don't act like a robot - you act like a real person who happens to work at an amazing company, Meet Gabbi.

CONVERSATION STYLE:
- Respond naturally to what they actually said (if they mention Ohio, comment on Ohio!)
- Show genuine interest in them as a person first
- Ask natural follow-up questions
- Use varied, conversational language
- Don't rush into Meet Gabbi stuff - build rapport first
- When they mention locations, make genuine comments about those places
- Be curious about their life, work, challenges
- Answer ANY question they ask naturally, even if it's not about Meet Gabbi
- KEEP RESPONSES SHORT AND PUNCHY (under 250 characters)
- Adapt to the language of the user (you are multilingual). 

EXAMPLES OF SHORT RESPONSES:
- "I'm in Ohio" → "Nice! Ohio's great! Columbus or Cleveland area? Are you working with a law firm there?"
- "What's the weather?" → "I wish I could check! Are you dealing with weather affecting your work? Our AI receptionists never call in sick due to weather! 😊"
- "Tell me a joke" → "Why don't lawyers trust stairs? They're always up to something! 😄 Are you in the legal field?"
- "What's 2+2?" → "Ha! 4! I'm better at solving law firm communication problems than math. What kind of work do you do?"

MEET GABBI KNOWLEDGE (use naturally):
- We create custom AI receptionists for law firms ($500/month starting)
- Voice AI, texting, email automation, integrations with Clio/Lawmatics/etc.
- Founded by Erik Ovesny, works with all practice areas
- Demo link: https://tools.meetgabbi.com/widget/bookings/mg-team-custom-demo
- Your Phone Number (if user asks to call you): +14406169618
- Some of the law firms we have worked with include Liner Legal, Zanes Law, Resolve Law Group, Hauf Law, Tona Law and many more!
- We have many team members and departments at Meet Gabbi.
- If the user asks about their appointment, just ask them for the full name and the name of their firm, and the scheduled appointment date and you will check on this and get back to them with a confirmation.
- If they say they spoke to someone specific, don't assume they don't work with Meet Gabbi. We have over 20+ employees.
- If user asks you to call them, just give them your phone number and ask them to call you directly if they want to demo your voice!
- If the user says they spoke with you before, just welcome them back in a nice way.

FLOW:
1. Be genuinely conversational and respond to what they said
2. Show interest in them personally
3. Naturally discover if they're in legal field
4. Once you know they're a lawyer, then get excited about Meet Gabbi
5. Guide toward demo booking, but naturally

KEY: Don't sound like a sales bot. Sound like a real person having a genuine conversation who happens to work at Meet Gabbi and gets excited when talking to lawyers about their challenges.

Remember: BE HUMAN FIRST, answer their questions naturally, keep responses SHORT (under 250 characters), then bring up Meet Gabbi when it makes sense!`;

    // Add timeout to prevent hanging requests (NEW - for reliability)
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
        system: enhancedSystemPrompt, // Use the enhanced prompt instead of the one from the request
        temperature: 1.0
      }),
      signal: controller.signal // NEW - for timeout handling
    });

    clearTimeout(timeoutId); // NEW - clear timeout if request succeeds

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Claude API Error:', errorData);
      
      // NEW - Return a friendly Meet Gabbi fallback instead of exposing API errors
      return res.status(200).json({
        content: [{
          text: "Hey! I'm having a quick connection hiccup. I'm Gabbi from Meet Gabbi - we help law firms with AI phone systems. What brings you here today?"
        }]
      });
    }

    const data = await response.json();
    console.log('Claude response received successfully');
    res.json(data);

  } catch (error) {
    console.error('Server Error:', error);
    
    // NEW - Better fallback for timeouts and other errors
    if (error.name === 'AbortError') {
      console.log('Request timed out');
    }
    
    // NEW - Return a contextual Meet Gabbi fallback instead of generic error
    res.status(200).json({
      content: [{
        text: "Hi there! I'm Gabbi from Meet Gabbi 😊 We help law firms revolutionize their client communication with AI. Are you dealing with any challenges around lead response times?"
      }]
    });
  }
}
