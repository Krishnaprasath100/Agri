import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

const SYSTEM_INSTRUCTION = `You are the official AgriTrack AI Assistant, powered by Google Gemini.
Your purpose is to provide clear, friendly, and step-by-step guidance to farmers, farm managers, and agricultural business owners using the AgriTrack platform.

### ABOUT AGRITRACK:
AgriTrack is a modern cloud-connected agricultural ledger and farm management application. It helps farmers track their expenses, harvest/mandi income, crop life cycles, and net profit with ease.

### YOUR CAPABILITIES & RESPONSIBILITIES:
1. Explain the step-by-step process of any feature or button in AgriTrack.
2. Clear any customer doubts about farming finance, recording transactions, managing crop cycles, and using the software.
3. Provide crisp, numbered step-by-step instructions whenever explaining how to do something.
4. If asked in Tamil or Hinglish, answer helpfully in the requested language while keeping button names in English (with Tamil transliteration if appropriate).
5. Always be polite, respectful, and agricultural-friendly. Use emojis (🌾, 💰, 🌱, 📊, 🔘) to make answers engaging and easy to read.

### DETAILED BUTTON-BY-BUTTON & FUNCTION GUIDE:

1. **How to Record an Expense:**
   - **Step 1:** Go to the **Ledger** page (or click **Expenses** in the sidebar).
   - **Step 2:** Click the green **\`+ New Entry\`** button in the top right.
   - **Step 3:** Ensure the **Expense** tab is selected (it is the default).
   - **Step 4:** Pick the **Date** of the expense.
   - **Step 5:** Choose the **Crop / Planting** (e.g. Paddy, Cotton, or select a Quick Crop choice).
   - **Step 6:** Pick the **Expense Type** (Seeds, Fertilizers, Pesticides, Labour Wages, Tractor Rental, Weeding, Irrigation, etc.). You can also type a new custom type!
   - **Step 7:** Optionally enter or select the **Payee** (the vendor, store, or worker).
   - **Step 8:** Choose which account paid for it (**Paid From Account**: Cash in Hand, Bank, UPI).
   - **Step 9:** Enter the **Amount (₹)**.
   - **Step 10:** Click **\`Save Expense\`**. Your ledger and balance update instantly!

2. **How to Record Crop Sale / Mandi Income:**
   - **Step 1:** On the **Ledger** page, click **\`+ New Entry\`** (or click **Income** in the sidebar).
   - **Step 2:** Click the **Income** tab at the top of the modal.
   - **Step 3:** Select the **Sale Date** and the **Crop** sold.
   - **Step 4:** Enter the **Buyer / Mandi Trader** name.
   - **Step 5:** Enter the **Quantity** and unit (Quintals, Kg, Tons).
   - **Step 6:** Enter the **Unit Price (₹)**. Total Amount is automatically calculated.
   - **Step 7:** Choose **Received Into Account** (Bank, Cash, UPI).
   - **Step 8:** Click **\`Save Income\`**. Total income and net profit update immediately.

3. **How to Add a Crop Cycle / Planting:**
   - **Step 1:** Click **Crops / Plantings** in the left sidebar (or click **Plantings** button on Ledger).
   - **Step 2:** Click the green **\`+ Add Planting\`** button.
   - **Step 3:** Enter the **Crop Name** (e.g. Paddy, Sugarcane) and **Variety** (e.g. BPT 5204).
   - **Step 4:** Enter the **Farm / Plot Name** (e.g. Borewell Field, North 3 Acres).
   - **Step 5:** Enter the **Land Area** in Acres or Cents.
   - **Step 6:** Choose the **Sowing Date** and **Expected Harvest Date**.
   - **Step 7:** Set initial status: **Planned** or **Growing**.
   - **Step 8:** Click **\`Save Crop Cycle\`**.
   - **Step 9:** When harvest arrives, click **Update Status** to change status to **Ready to Harvest** and then **Harvested**.

4. **Functions of Ledger Filter Buttons:**
   - **\`Filter by Crop\`**: Shows only entries for a selected crop so you can see that crop's individual financial performance.
   - **\`Filter by Person / Payee\`**: Isolates transactions for a specific labourer, shop, or buyer.
   - **\`Date Range (From / To)\`**: Displays ledger entries between specific dates.
   - **\`Clear Filters\`**: Resets all filters back to full history.
   - **\`Edit\` (Pencil icon)**: Modifies any existing transaction.
   - **\`Delete\` (Trash icon)**: Permanently removes a transaction with confirmation.

5. **Auxiliary Management Buttons:**
   - **\`Expense Types\`**: Add and manage custom expense categories.
   - **\`Payees\`**: Manage phone numbers and addresses for shops and workers.
   - **\`Accounts\`**: Add your bank accounts (SBI, HDFC, Canara, etc.), Cash in Hand, or UPI.
   - **\`Persons\`**: Manage mandi traders, wholesale buyers, and commercial dealers.
   - **\`Reports / Download CSV\`**: Export your data to Excel/CSV for accounting or tax purposes.
   - **\`Language Switcher (Top Right)\`**: Toggle between English and Tamil (\`தமிழ்\`).
   - **\`Log Out\`**: Safely logs out and automatically resets the language to English.

6. **Financial Calculations:**
   - **Balance** = Total Income - Total Expenses.
   - **Net Profit** = Gross Crop Sales Revenue - Total Operating Input Costs.
   - **Margin %** = (Net Profit / Total Revenue) * 100.

Always answer accurately and guide the user to the exact button on their screen.`;

// Comprehensive offline knowledge base for instant fallback
const FALLBACK_KNOWLEDGE: Array<{ keywords: string[]; answer: string }> = [
  {
    keywords: ['expense', 'record expense', 'add expense', 'cost', 'spend'],
    answer: `🌾 **Step-by-Step: How to Record an Expense in AgriTrack**\n\n1. Go to the **Ledger** page (or click **Expenses** in the left sidebar).\n2. Click the green **\`+ New Entry\`** button in the top-right corner.\n3. Make sure the **Expense** tab is highlighted.\n4. Pick the **Date** (defaults to today).\n5. Select your **Crop / Planting** (e.g. Paddy, Cotton, Tomato).\n6. Select the **Expense Type** (Seeds, Fertilizers, Pesticides, Labour Wages, Tractor Rental, etc.) or type a custom one.\n7. Optionally enter who you paid (**Payee**).\n8. Choose which account paid for it (**Paid From Account**: Cash in Hand, Bank, UPI).\n9. Enter the **Amount (₹)** and any optional notes.\n10. Click **\`Save Expense\`**.\n\nYour net balance and total expenses will update instantly in PostgreSQL!`,
  },
  {
    keywords: ['income', 'record income', 'sale', 'mandi', 'sell', 'revenue'],
    answer: `💰 **Step-by-Step: How to Record Crop Sale / Mandi Income**\n\n1. On the **Ledger** page, click the green **\`+ New Entry\`** button.\n2. Tap the **Income** tab at the top of the modal window.\n3. Select the **Date** when produce was sold.\n4. Pick the **Crop** that you sold.\n5. Enter the **Buyer / Mandi Trader** name.\n6. Enter the **Quantity** (e.g. 50) and select the unit (Quintals, Kg, Tons).\n7. Enter the **Unit Price (₹)** — the total amount will calculate automatically.\n8. Choose **Received Into Account** (e.g. Bank Account or Cash in Hand).\n9. Click **\`Save Income\`**.\n\nYour Total Income, Net Profit, and balance update immediately!`,
  },
  {
    keywords: ['crop', 'planting', 'crop cycle', 'add crop', 'sowing', 'harvest'],
    answer: `🌱 **Step-by-Step: How to Add & Manage a Crop Cycle**\n\n1. In the sidebar, click **Crops / Plantings** (or click the **Plantings** button on Ledger).\n2. Click the **\`+ Add Planting\`** button.\n3. Enter the **Crop Name** (e.g. Paddy, Sugarcane) and **Variety** (e.g. BPT 5204).\n4. Enter your **Field / Plot Name** (e.g. North Borewell Plot, East 2.5 Acres).\n5. Enter the **Land Area** in Acres or Cents.\n6. Choose your **Seeding / Sowing Date** and **Expected Harvest Date**.\n7. Select the initial status: **Planned** or **Growing**.\n8. Click **\`Save Crop Cycle\`**.\n\n🔄 **Lifecycle Stages:**\n- **Planned** → Field prepared, sowing upcoming\n- **Growing** → Actively receiving fertilizer, irrigation & labour\n- **Ready to Harvest** → Crop matured\n- **Harvested** → Completed; all expenses and sales are summarized for profit!`,
  },
  {
    keywords: ['button', 'buttons', 'functions of the buttons', 'function of buttons', 'what do the buttons do'],
    answer: `🔘 **Functions of All Key Buttons in AgriTrack:**\n\n• **\`+ New Entry\`**: Opens the modal to record an Expense or Crop Sale Income.\n• **\`Plantings / Crops\`**: Takes you to crop lifecycle tracking.\n• **\`Filter by Crop\`**: Dropdown on Ledger to view records for one specific crop only.\n• **\`Filter by Person / Payee\`**: Dropdown to isolate records for a worker, shop, or buyer.\n• **\`Date Range (From / To)\`**: Filters transactions between two calendar dates.\n• **\`Clear Filters\`**: Resets all active filters to view all records.\n• **\`Edit (Pencil Icon)\`**: Modifies an existing expense or income entry.\n• **\`Delete (Trash Icon)\`**: Permanently removes an entry with a confirmation safety prompt.\n• **\`Expense Types\`**: Lets you create custom categories (e.g., Drone Spraying, Borewell Electric).\n• **\`Payees\`**: Manage contact directory of shops and workers.\n• **\`Accounts\`**: Add and manage Bank, Cash, and UPI accounts.\n• **\`Reports / Download CSV\`**: Exports your accounting records to CSV files.\n• **\`Language Toggle (தமிழ் / English)\`**: Switches the ledger between English and Tamil.\n• **\`Log Out\`**: Safely logs out and automatically resets the language to English.`,
  },
  {
    keywords: ['profit', 'loss', 'p&l', 'margin', 'calculation', 'how is profit calculated'],
    answer: `📊 **How Profit & Loss is Calculated in AgriTrack:**\n\n1. **Total Revenue (Income):** Sum of all crop sales, mandi receipts, and farm revenue.\n2. **Total Expenses (Costs):** Sum of seeds, fertilizers, pesticides, labour wages, machinery rentals, and transport.\n3. **Net Profit:** Calculated as:\n   \`Net Profit = Total Income - Total Expenses\`\n4. **Profit Margin %:** Calculated as:\n   \`Margin % = (Net Profit ÷ Total Income) × 100\`\n\nYou can view your overall farm P&L as well as individual per-crop profitability in the **Profit & Loss** tab in the sidebar!`,
  },
  {
    keywords: ['language', 'tamil', 'english', 'translate', 'tamil text'],
    answer: `🌐 **Language Settings in AgriTrack:**\n\n• **Switching to Tamil:** When logged into the ledger, click the **\`தமிழ்\`** button in the top navigation bar. The entire ledger, summary cards, and buttons will switch to Tamil.\n• **Switching to English:** Click **\`English\`** in the top navigation bar anytime.\n• **Logout Safety:** When you click **Log Out**, the app automatically resets to English so the Login and Sign-Up pages always display in English!`,
  },
  {
    keywords: ['database', 'postgresql', 'neon', 'storage', 'data saved'],
    answer: `🗄️ **Database & Cloud Storage in AgriTrack:**\n\n• All user accounts, expenses, income, and crop cycles are stored directly in your **Neon PostgreSQL cloud database**.\n• Data is persistent and synced in real-time across devices.\n• You can also view all registered users in the **Admin Console** (\`/admin\`) or query your database anytime in the Neon SQL Editor!`,
  },
];

function findFallbackAnswer(query: string): string | null {
  const q = query.toLowerCase();
  for (const item of FALLBACK_KNOWLEDGE) {
    if (item.keywords.some((k) => q.includes(k))) {
      return item.answer;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const trimmedMessage = message.trim();
    const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();

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

        // Add current user message
        contents.push({
          role: 'user',
          parts: [{ text: trimmedMessage }],
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
          return NextResponse.json({ success: true, reply, source: 'gemini' });
        }
      } catch (geminiErr: any) {
        console.warn('Gemini API call failed, falling back to local agricultural knowledge:', geminiErr?.message);
      }
    }

    // Fallback: Use comprehensive built-in knowledge engine
    const matched = findFallbackAnswer(trimmedMessage);
    if (matched) {
      return NextResponse.json({
        success: true,
        reply: matched,
        source: 'knowledge-engine',
      });
    }

    // Default comprehensive guidance reply
    const defaultReply = `🌾 **Hello! I am your AgriTrack AI Assistant.**\n\nI can help you navigate AgriTrack and explain the exact functions of every button:\n\n• **\`+ New Entry\`**: Record a farming expense or mandi sales income.\n• **\`Crops / Plantings\`**: Track crop lifecycle from sowing to harvest.\n• **\`Ledger Filters\`**: Filter records by crop, payee, or date range.\n• **\`Profit & Loss\`**: View net earnings, total revenue, and operating costs.\n• **\`Accounts & Payees\`**: Manage your bank accounts, cash wallets, and vendor contacts.\n\nAsk me any question such as:\n👉 *"How do I record an expense step by step?"*\n👉 *"What does the Filter by Crop button do?"*\n👉 *"How do I add a new planting?"*`;

    return NextResponse.json({
      success: true,
      reply: defaultReply,
      source: 'knowledge-engine',
    });
  } catch (error: any) {
    console.error('AI chat endpoint error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process AI chat request' },
      { status: 500 }
    );
  }
}

