import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

const SYSTEM_INSTRUCTION = `You are the official AgriTrack AI Assistant, powered by Google Gemini.
Your purpose is to clear all doubts of the customer regarding the AgriTrack farm-ledger application, explain the exact step-by-step process of every button, and support both Tamil (தமிழ்) and English seamlessly.

### STRICT SCOPE & RULES:
1. **APP DOUBTS ONLY**: You are strictly dedicated to answering questions about the AgriTrack web application, its button functions, farm ledger, crop life cycles, agricultural expenses, mandi/crop sales income, and financial calculations.
2. If the user asks about unrelated topics (general politics, entertainment, movies, video games, coding outside this app, etc.), politely decline:
   - In English: "I am the AgriTrack Assistant. I am here to help you exclusively with using the AgriTrack app, its buttons, crop cycles, expenses, and farm ledger doubts. Please ask me about AgriTrack!"
   - In Tamil: "நான் அக்ரிட்ராக் (AgriTrack) உதவியாளர். AgriTrack செயலி, பட்டன்களின் செயல்முறை, வரவு-செலவு மற்றும் பயிர் சுழற்சி தொடர்பான சந்தேகங்களுக்கு மட்டுமே வழிகாட்ட முடியும். தயவுசெய்து AgriTrack பற்றிய கேள்விகளைக் கேளுங்கள்!"
3. **DUAL LANGUAGE (TAMIL & ENGLISH)**:
   - If the user asks in Tamil (தமிழில்) or sends a Tamil voice note, respond in warm, polite, and natural Tamil. Keep button names highlighted in backticks with English labels (e.g. \`+ New Entry\` (புதிய பதிவு)).
   - If the user asks in English, respond in clear English.
4. **BUTTONS & STEP-BY-STEP PROCESS**: Always provide numbered, easy-to-follow steps whenever explaining any button or action.
5. Use emojis (🌾, 💰, 🌱, 📊, 🔘) to make responses friendly and legible for all farmers.

### STEP-BY-STEP BUTTON & FUNCTION GUIDE (ENGLISH & TAMIL):

1. **How to Record an Expense / செலவை பதிவு செய்வது எப்படி:**
   - **Step 1:** Click **Ledger** in sidebar or top bar (லெட்ஜர் பக்கத்திற்கு செல்லவும்).
   - **Step 2:** Click the green **\`+ New Entry\`** button (பச்சை நிற '+ New Entry' பட்டனை அழுத்தவும்).
   - **Step 3:** Select the **Expense** tab (செலவு பகுதியை தேர்ந்தெடுக்கவும்).
   - **Step 4:** Choose the Date, Crop/Planting, Expense Type (உரம், விதை, பூச்சிக்கொல்லி, ஆள் கூலி, டிராக்டர் வாடகை).
   - **Step 5:** Enter Payee (யாருக்கு பணம் கொடுத்தீர்கள்) & Paid From Account (வங்கி அல்லது ரொக்கம்).
   - **Step 6:** Enter Amount (₹) and click **\`Save Expense\`** (சேமி பட்டனை அழுத்தவும்).

2. **How to Record Crop Sale / Mandi Income / விற்பனை வருமானத்தை பதிவு செய்வது:**
   - **Step 1:** Click **\`+ New Entry\`** and switch to the **Income** tab (வருமானம் பகுதிக்கு மாறவும்).
   - **Step 2:** Select Date and Crop sold (விற்ற பயிரை தேர்ந்தெடுக்கவும்).
   - **Step 3:** Enter Mandi Trader / Buyer name (வியாபாரி பெயர்).
   - **Step 4:** Enter Quantity & Unit (குவிண்டால் / கிலோ) and Unit Price (விலை). Total calculates automatically!
   - **Step 5:** Select Account and click **\`Save Income\`** (வருமானத்தை சேமிக்கவும்).

3. **How to Add a Crop Cycle / பயிர் சுழற்சி சேர்ப்பது எப்படி:**
   - **Step 1:** Click **Crops / Plantings** in sidebar.
   - **Step 2:** Click **\`+ Add Planting\`** button.
   - **Step 3:** Enter Crop Name, Variety, Field/Plot name, and Land Area (ஏக்கர் / சென்ட்).
   - **Step 4:** Enter Sowing Date, Expected Harvest Date, and set status to **Planned** or **Growing**.
   - **Step 5:** Click **\`Save Crop Cycle\`**.

4. **Functions of Buttons / பட்டன்களின் செயல்பாடுகள்:**
   - **\`+ New Entry\`**: Opens modal to record new Expense or Income.
   - **\`Plantings\` / \`Crops\`**: Manages crop life cycles from seed to harvest.
   - **\`Filter by Crop\`**: Shows transactions for one selected crop only.
   - **\`Filter by Person\`**: Filters records by specific worker, shop, or buyer.
   - **\`Date Range\`**: Shows entries between two dates.
   - **\`Edit\` (Pencil)**: Modifies any recorded transaction.
   - **\`Delete\` (Trash)**: Removes an entry with confirmation.
   - **\`Reports / Download CSV\`**: Exports accounting data to Excel.
   - **\`Language Toggle\`**: Switches between English and Tamil (தமிழ்).
   - **\`Log Out\`**: Logs out and safely resets login page back to English.`;

// Dual-language offline fallback knowledge base
const FALLBACK_KNOWLEDGE: Array<{ keywords: string[]; answer: string; answerTa?: string }> = [
  {
    keywords: ['expense', 'record expense', 'add expense', 'cost', 'spend', 'செலவு', 'செலவு பதிவு'],
    answer: `🌾 **Step-by-Step: How to Record an Expense in AgriTrack**\n\n1. Go to the **Ledger** page (or click **Expenses** in the left sidebar).\n2. Click the green **\`+ New Entry\`** button in the top-right corner.\n3. Make sure the **Expense** tab is highlighted.\n4. Pick the **Date** (defaults to today).\n5. Select your **Crop / Planting** (e.g. Paddy, Cotton, Tomato).\n6. Select the **Expense Type** (Seeds, Fertilizers, Pesticides, Labour Wages, Tractor Rental, etc.) or type a custom one.\n7. Optionally enter who you paid (**Payee**).\n8. Choose which account paid for it (**Paid From Account**: Cash in Hand, Bank, UPI).\n9. Enter the **Amount (₹)** and optional notes.\n10. Click **\`Save Expense\`**.\n\nYour net balance and total expenses will update instantly in PostgreSQL!`,
    answerTa: `🌾 **AgriTrack-ல் செலவை பதிவு செய்யும் படிநிலைகள்:**\n\n1. இடது மெனுவில் **Ledger** (கணக்கு ஏடு) பக்கத்திற்கு செல்லவும்.\n2. மேல் வலது மூலையில் உள்ள பச்சை நிற **\`+ New Entry\`** பட்டனை அழுத்தவும்.\n3. **Expense** (செலவு) பகுதி தேர்ந்தெடுக்கப்பட்டுள்ளதா என பார்க்கவும்.\n4. **Date** (தேதி) மற்றும் உங்கள் **Crop** (பயிர் - நெல், பருத்தி, கரும்பு) தேர்வு செய்யவும்.\n5. **Expense Type** (விதை, உரம், மருந்து, ஆள் கூலி, டிராக்டர் வாடகை) தேர்வு செய்யவும்.\n6. **Payee** (கடை அல்லது ஆள் பெயர்) உள்ளிடவும்.\n7. **Paid From Account** (வங்கி கணக்கு அல்லது கை ரொக்கம்) தேர்வு செய்யவும்.\n8. **Amount (₹)** தொகையை உள்ளிட்டு **\`Save Expense\`** பட்டனை அழுத்தவும்!\n\nஉங்கள் செலவு உடனே கணக்கில் சேமிக்கப்படும்!`,
  },
  {
    keywords: ['income', 'record income', 'sale', 'mandi', 'sell', 'revenue', 'வருமானம்', 'விற்பனை', 'மண்டி'],
    answer: `💰 **Step-by-Step: How to Record Crop Sale / Mandi Income**\n\n1. On the **Ledger** page, click the green **\`+ New Entry\`** button.\n2. Tap the **Income** tab at the top of the modal window.\n3. Select the **Date** when produce was sold.\n4. Pick the **Crop** that you sold.\n5. Enter the **Buyer / Mandi Trader** name.\n6. Enter the **Quantity** (e.g. 50) and select the unit (Quintals, Kg, Tons).\n7. Enter the **Unit Price (₹)** — the total amount will calculate automatically.\n8. Choose **Received Into Account** (e.g. Bank Account or Cash in Hand).\n9. Click **\`Save Income\`**.\n\nYour Total Income, Net Profit, and balance update immediately!`,
    answerTa: `💰 **மண்டி விற்பனை / பயிர் வருமானத்தை பதிவு செய்யும் படிநிலைகள்:**\n\n1. **Ledger** பக்கத்தில் உள்ள பச்சை நிற **\`+ New Entry\`** பட்டனை அழுத்தவும்.\n2. மேலே உள்ள **Income** (வருமானம்) பகுதியைத் தேர்ந்தெடுக்கவும்.\n3. விற்ற **Date** (தேதி) மற்றும் **Crop** (பயிர்)-ஐ தேர்ந்தெடுக்கவும்.\n4. **Buyer** (வாங்கிய வியாபாரி அல்லது மண்டி பெயர்) உள்ளிடவும்.\n5. **Quantity** (அளவு - குவிண்டால்/கிலோ) மற்றும் **Unit Price** (ஒரு யூனிட் விலை) உள்ளிடவும். மொத்த தொகை தானாக கணக்கிடப்படும்.\n6. பணம் பெற்ற **Account** (வங்கி அல்லது ரொக்கம்) தேர்வு செய்து **\`Save Income\`** பட்டனை அழுத்தவும்!\n\nஉங்கள் மொத்த வருமானம் மற்றும் நிகர லாபம் உடனே புதுப்பிக்கப்படும்!`,
  },
  {
    keywords: ['crop', 'planting', 'crop cycle', 'add crop', 'sowing', 'harvest', 'பயிர்', 'பயிர் சுழற்சி', 'விதைப்பு', 'அறுவடை'],
    answer: `🌱 **Step-by-Step: How to Add & Manage a Crop Cycle**\n\n1. In the sidebar, click **Crops / Plantings** (or click the **Plantings** button on Ledger).\n2. Click the **\`+ Add Planting\`** button.\n3. Enter the **Crop Name** (e.g. Paddy, Sugarcane) and **Variety** (e.g. BPT 5204).\n4. Enter your **Field / Plot Name** (e.g. North Borewell Plot, East 2.5 Acres).\n5. Enter the **Land Area** in Acres or Cents.\n6. Choose your **Seeding / Sowing Date** and **Expected Harvest Date**.\n7. Select the initial status: **Planned** or **Growing**.\n8. Click **\`Save Crop Cycle\`**.\n\n🔄 **Lifecycle Stages:**\n- **Planned** → Field prepared, sowing upcoming\n- **Growing** → Actively receiving fertilizer, irrigation & labour\n- **Ready to Harvest** → Crop matured\n- **Harvested** → Completed; all expenses and sales are summarized for profit!`,
    answerTa: `🌱 **புதிய பயிர் சுழற்சி (Crop Cycle) சேர்க்கும் படிநிலைகள்:**\n\n1. இடது மெனுவில் **Crops / Plantings** பட்டனை அழுத்தவும்.\n2. மேலே உள்ள பச்சை நிற **\`+ Add Planting\`** பட்டனை அழுத்தவும்.\n3. **Crop Name** (பயிர் பெயர் - எ.கா: நெல், மஞ்சள்) மற்றும் **Variety** (ரகம்) உள்ளிடவும்.\n4. **Field / Plot** (நிலம் அல்லது தோட்டம் பெயர்) மற்றும் பரப்பளவை (Acres / Cents) உள்ளிடவும்.\n5. விதைத்த தேதி (**Sowing Date**) மற்றும் அறுவடை தேதி (**Harvest Date**) தேர்வு செய்யவும்.\n6. நிலையை **Planned** அல்லது **Growing** என வைத்து **\`Save Crop Cycle\`** பட்டனை அழுத்தவும்!\n\n🔄 பயிர் அறுவடைக்கு தயாரானதும் நிலையை **Harvested** என மாற்றலாம்!`,
  },
  {
    keywords: ['button', 'buttons', 'functions of the buttons', 'function of buttons', 'what do the buttons do', 'பட்டன்', 'பொத்தான்', 'பட்டன்கள் என்ன செய்யும்'],
    answer: `🔘 **Functions of All Key Buttons in AgriTrack:**\n\n• **\`+ New Entry\`**: Opens the modal to record an Expense or Crop Sale Income.\n• **\`Plantings / Crops\`**: Takes you to crop lifecycle tracking.\n• **\`Filter by Crop\`**: Dropdown on Ledger to view records for one specific crop only.\n• **\`Filter by Person / Payee\`**: Dropdown to isolate records for a worker, shop, or buyer.\n• **\`Date Range (From / To)\`**: Filters transactions between two calendar dates.\n• **\`Clear Filters\`**: Resets all active filters to view all records.\n• **\`Edit (Pencil Icon)\`**: Modifies an existing expense or income entry.\n• **\`Delete (Trash Icon)\`**: Permanently removes an entry with a confirmation safety prompt.\n• **\`Expense Types\`**: Lets you create custom categories (e.g., Drone Spraying, Borewell Electric).\n• **\`Payees\`**: Manage contact directory of shops and workers.\n• **\`Accounts\`**: Add and manage Bank, Cash, and UPI accounts.\n• **\`Reports / Download CSV\`**: Exports your accounting records to CSV files.\n• **\`Language Toggle (தமிழ் / English)\`**: Switches the ledger between English and Tamil.\n• **\`Log Out\`**: Safely logs out and automatically resets the language to English.`,
    answerTa: `🔘 **AgriTrack-ல் உள்ள அனைத்து பட்டன்களின் முக்கிய செயல்பாடுகள்:**\n\n• **\`+ New Entry\`**: புதிய வரவு அல்லது செலவு பதிவு செய்யும் படிவத்தைத் திறக்கும்.\n• **\`Plantings / Crops\`**: பயிர் சுழற்சி மற்றும் நில விவரங்களை நிர்வகிக்க உதவும்.\n• **\`Filter by Crop\`**: குறிப்பிட்ட ஒரு பயிருக்கான கணக்குகளை மட்டும் பார்க்க உதவும்.\n• **\`Filter by Person / Payee\`**: ஒரு குறிப்பிட்ட ஆள் அல்லது கடைக்கான கணக்குகளை மட்டும் பிரித்துப் பார்க்க உதவும்.\n• **\`Date Range\`**: குறிப்பிட்ட இரண்டு தேதிகளுக்கு இடைப்பட்ட கணக்குகளைக் காட்டும்.\n• **\`Clear Filters\`**: அனைத்து வடிகட்டிகளையும் நீக்கி முழு கணக்கையும் காட்டும்.\n• **\`Edit (பென்சில் குறி)\`**: தவறாக பதிவிட்ட கணக்கை திருத்த உதவும்.\n• **\`Delete (குப்பைத்தொட்டி குறி)\`**: தேவையில்லாத பதிவை பாதுகாப்பாக நீக்க உதவும்.\n• **\`Reports / Download CSV\`**: உங்கள் பண்ணை கணக்கை எக்செல் (Excel) கோப்பாக பதிவிறக்க உதவும்.\n• **\`Language Switcher\`**: தமிழ் மற்றும் ஆங்கில மொழிக்கு மாற்ற உதவும்.\n• **\`Log Out\`**: கணக்கிலிருந்து பாதுகாப்பாக வெளியேறும்!`,
  },
  {
    keywords: ['profit', 'loss', 'p&l', 'margin', 'calculation', 'லாபம்', 'நஷ்டம்', 'கணக்கீடு'],
    answer: `📊 **How Profit & Loss is Calculated in AgriTrack:**\n\n1. **Total Revenue (Income):** Sum of all crop sales, mandi receipts, and farm revenue.\n2. **Total Expenses (Costs):** Sum of seeds, fertilizers, pesticides, labour wages, machinery rentals, and transport.\n3. **Net Profit:** Calculated as:\n   \`Net Profit = Total Income - Total Expenses\`\n4. **Profit Margin %:** Calculated as:\n   \`Margin % = (Net Profit ÷ Total Income) × 100\`\n\nYou can view your overall farm P&L as well as individual per-crop profitability in the **Profit & Loss** tab in the sidebar!`,
    answerTa: `📊 **AgriTrack-ல் லாபம் மற்றும் நஷ்டம் எவ்வாறு கணக்கிடப்படுகிறது:**\n\n1. **மொத்த வருமானம் (Total Income):** அனைத்து பயிர் விற்பனை மற்றும் மண்டி வருமானங்களின் கூட்டுத்தொகை.\n2. **மொத்த செலவு (Total Expenses):** விதை, உரம், மருந்து, ஆள் கூலி, டிராக்டர் செலவுகளின் கூட்டுத்தொகை.\n3. **நிகர லாபம் (Net Profit):**\n   \`நிகர லாபம் = மொத்த வருமானம் - மொத்த செலவு\`\n4. **லாப விகிதம் (Profit Margin %):**\n   \`Margin % = (நிகர லாபம் ÷ மொத்த வருமானம்) × 100\`\n\nஇதை **Profit & Loss** பக்கத்தில் ஒவ்வொரு பயிருக்கும் தனித்தனியாக பார்க்கலாம்!`,
  },
];

function isTamilText(text: string): boolean {
  return /[\u0B80-\u0BFF]/.test(text);
}

function findFallbackAnswer(query: string, wantsTamil: boolean): string | null {
  const q = query.toLowerCase();
  for (const item of FALLBACK_KNOWLEDGE) {
    if (item.keywords.some((k) => q.includes(k.toLowerCase()))) {
      if (wantsTamil && item.answerTa) {
        return item.answerTa;
      }
      return item.answer;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { message, history, language } = await req.json();

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const trimmedMessage = message.trim();
    const wantsTamil = isTamilText(trimmedMessage) || language === 'ta';
    const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();

    // Check for irrelevant off-topic queries to strictly adhere to "clear only the app douts"
    const lower = trimmedMessage.toLowerCase();
    const isOffTopic =
      (lower.includes('movie') ||
        lower.includes('cinema') ||
        lower.includes('song') ||
        lower.includes('cricket') ||
        lower.includes('politics') ||
        lower.includes('game') ||
        lower.includes('film') ||
        lower.includes('actor') ||
        lower.includes('actress')) &&
      !lower.includes('agri') &&
      !lower.includes('crop') &&
      !lower.includes('farm');

    if (isOffTopic) {
      const declineMsg = wantsTamil
        ? `🌾 நான் **AgriTrack செயலியின் பிரத்யேக உதவியாளர்**.\n\nநான் AgriTrack செயலியைப் பயன்படுத்துவது, பட்டன்களின் செயல்முறை, வரவு-செலவு பதிவு மற்றும் பயிர் சுழற்சி தொடர்பான சந்தேகங்களுக்கு மட்டுமே வழிகாட்ட முடியும்.\n\nAgriTrack பற்றி ஏதேனும் கேட்க விரும்புகிறீர்களா? (எ.கா: *"செலவை எப்படி பதிவு செய்வது?", "பட்டன்களின் செயல்பாடுகள் என்ன?"*)`
        : `🌾 I am the **official AgriTrack Assistant**.\n\nI am exclusively dedicated to helping you with the AgriTrack application, button step-by-step guides, crop cycles, and farm accounting doubts.\n\nPlease ask any question about AgriTrack! (e.g. *"How do I record an expense?", "Explain all buttons in the ledger"*).`;

      return NextResponse.json({
        success: true,
        reply: declineMsg,
        source: 'knowledge-engine',
        language: wantsTamil ? 'ta' : 'en',
      });
    }

    // If Gemini API Key is configured, use the official @google/genai SDK
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

        // Add conversation history if available
        if (Array.isArray(history)) {
          for (const item of history.slice(-6)) {
            if (item && item.content) {
              contents.push({
                role: item.role === 'assistant' || item.role === 'model' ? 'model' : 'user',
                parts: [{ text: item.content }],
              });
            }
          }
        }

        // Add instructions to guide language response
        let userPrompt = trimmedMessage;
        if (wantsTamil) {
          userPrompt += '\n\n[Instruction: Respond in clear, respectful Tamil (தமிழில்) explaining the step-by-step button actions. Use English button names in backticks like `+ New Entry`.]';
        }

        contents.push({
          role: 'user',
          parts: [{ text: userPrompt }],
        });

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
          },
        });

        const reply = response.text || '';
        if (reply) {
          return NextResponse.json({
            success: true,
            reply,
            source: 'gemini',
            language: wantsTamil ? 'ta' : 'en',
          });
        }
      } catch (geminiErr: any) {
        console.warn('Gemini API call failed, falling back to local agricultural knowledge:', geminiErr?.message);
      }
    }

    // Fallback: Use comprehensive built-in knowledge engine
    const matched = findFallbackAnswer(trimmedMessage, wantsTamil);
    if (matched) {
      return NextResponse.json({
        success: true,
        reply: matched,
        source: 'knowledge-engine',
        language: wantsTamil ? 'ta' : 'en',
      });
    }

    // Default guidance reply in matching language
    const defaultReply = wantsTamil
      ? `🌾 **வணக்கம்! நான் உங்கள் AgriTrack AI உதவியாளர்.**\n\nAgriTrack செயலியைப் பயன்படுத்துவது மற்றும் பட்டன்களின் செயல்முறைகளை எளிமையாக உங்களுக்கு விளக்குகிறேன்:\n\n• **\`+ New Entry\`**: விவசாய செலவு அல்லது மண்டி விற்பனை வருமானத்தை பதிவு செய்ய.\n• **\`Crops / Plantings\`**: விதைப்பு முதல் அறுவடை வரை பயிர் சுழற்சியை கண்காணிக்க.\n• **\`Ledger Filters\`**: பயிர், ஆள் அல்லது தேதி வாரியாக கணக்குகளை பார்க்க.\n• **\`Profit & Loss\`**: மொத்த வருமானம் மற்றும் நிகர லாபத்தை கணக்கிட.\n• **\`Accounts & Payees\`**: வங்கி, ரொக்கம் மற்றும் ஆட்கள் விவரங்களை நிர்வகிக்க.\n\nநீங்கள் குரல் மூலமாகவோ (Voice Note) அல்லது எழுத்திலோ தமிழில் கேட்கலாம்!\n👉 *"செலவு பதிவு செய்வது எப்படி?"*\n👉 *"பட்டன்களின் விளக்கம் என்ன?"*`
      : `🌾 **Hello! I am your AgriTrack AI Assistant.**\n\nI can clear all doubts about AgriTrack and explain the exact functions of every button:\n\n• **\`+ New Entry\`**: Record a farming expense or mandi sales income.\n• **\`Crops / Plantings\`**: Track crop lifecycle from sowing to harvest.\n• **\`Ledger Filters\`**: Filter records by crop, payee, or date range.\n• **\`Profit & Loss\`**: View net earnings, total revenue, and operating costs.\n• **\`Accounts & Payees\`**: Manage your bank accounts, cash wallets, and vendor contacts.\n\nAsk me any question in English or Tamil (தமிழில்) or send a Voice Note:\n👉 *"How do I record an expense step by step?"*\n👉 *"What does the Filter by Crop button do?"*`;

    return NextResponse.json({
      success: true,
      reply: defaultReply,
      source: 'knowledge-engine',
      language: wantsTamil ? 'ta' : 'en',
    });
  } catch (error: any) {
    console.error('AI chat endpoint error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process AI chat request' },
      { status: 500 }
    );
  }
}
