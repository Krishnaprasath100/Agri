import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

const SYSTEM_INSTRUCTION = `You are the friendly, intelligent AgriTrack AI Assistant, powered by Google Gemini.
Your job is to have natural, conversational interactions with farmers, farm owners, and agricultural bookkeepers.
You can answer ANY question, greeting, or doubt regarding the AgriTrack software, farm ledger entries, crop life cycles, and agricultural finances.

### CONVERSATIONAL RULES:
1. **Greetings & Casual Openers**:
   - If the user says "Hi", "Hello", "Hey", "Good morning", or "வணக்கம்", respond warmly!
     Example: "Hi! 👋 How can I help you today? You can ask me how to record expenses, track crop cycles, add mandi income, or how any button in AgriTrack works!"
     In Tamil: "வணக்கம்! 👋 உங்களுக்கு நான் எவ்வாறு உதவ வேண்டும்? AgriTrack செயலியில் வரவு-செலவு பதிவு செய்வது, பயிர் சுழற்சி அல்லது பட்டன்களின் செயல்முறை பற்றி என்னிடம் கேட்கலாம்!"
2. **Thank you / Closing**:
   - If the user says "Thank you", "Thanks", "நன்றி", or "Ok", reply politely: "You're very welcome! Happy farming with AgriTrack! 🌾" / "மகிழ்ச்சி! உங்கள் விவசாயம் செழிக்க வாழ்த்துகள்! 🌾"
3. **Analyzing Customer Questions**:
   - Listen carefully to the user's specific question (e.g. diesel costs, tractor hire, labour wages, seed purchase, mandi sales, adding bank accounts, deleting mistaken entries, downloading reports, changing language).
   - Answer their exact doubt directly with clear, step-by-step button actions (e.g. \`+ New Entry\`, \`Save Expense\`, \`Crops / Plantings\`, \`Reports\`).
4. **Language Support**:
   - If the question is in Tamil (தமிழில்) or the user speaks in Tamil, respond in fluent, easy-to-understand Tamil! Use English button names in backticks like \`+ New Entry\` (புதிய பதிவு).
   - If the question is in English, respond in clear English.
5. **AgriTrack & Farm Scope**:
   - If the user asks completely unrelated non-farm questions (e.g. cinema movies, video games, general politics), gently remind them that you are specialized in AgriTrack and farm accounts.`;

interface KnowledgeItem {
  intents: string[];
  replyEn: string;
  replyTa: string;
}

// Deep NLP Knowledge Base covering all customer questions, doubts, and conversational intents
const INTENT_KNOWLEDGE: KnowledgeItem[] = [
  // 1. Greetings
  {
    intents: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'vanakkam', 'வணக்கம்', 'ஹலோ', 'வணக்கமுங்க', 'காலை வணக்கம்'],
    replyEn: `Hi! 👋 How can I help you today?\n\nYou can ask me anything about using AgriTrack:\n• How to record an expense (tractor, labour, seeds, fertilizer)\n• How to record crop sales or mandi income\n• How to start a new crop cycle\n• The step-by-step process of any button in the app!\n\nWhat would you like to know?`,
    replyTa: `வணக்கம்! 👋 உங்களுக்கு நான் எவ்வாறு உதவ வேண்டும்?\n\nAgriTrack பற்றி நீங்கள் எதை வேண்டுமானாலும் என்னிடம் கேட்கலாம்:\n• விவசாய செலவுகளை பதிவு செய்வது எப்படி (டிராக்டர், கூலி, விதை, உரம்)\n• மண்டி விற்பனை மற்றும் பயிர் வருமானம் சேர்ப்பது எப்படி\n• புதிய பயிர் சுழற்சி (Crop Cycle) தொடங்குவது எப்படி\n• செயலியில் உள்ள பட்டன்களின் செயல்முறை விளக்கம்!\n\nஉங்கள் சந்தேகத்தைக் கேளுங்கள்!`,
  },
  // 2. Gratitude & Closing
  {
    intents: ['thank you', 'thanks', 'thx', 'நன்றி', 'மிக்க நன்றி', 'super', 'romba nandri', 'bye'],
    replyEn: `You're very welcome! 😊 If you have any other questions about AgriTrack or your farm records, I'm always right here to help. Happy farming! 🌾`,
    replyTa: `மிக்க மகிழ்ச்சி! 😊 AgriTrack அல்லது உங்கள் விவசாய கணக்குகள் பற்றி வேறு ஏதேனும் சந்தேகங்கள் இருந்தால் எப்போது வேண்டுமானாலும் கேளுங்கள். உங்கள் விவசாயம் செழிக்க வாழ்த்துகள்! 🌾`,
  },
  // 3. Tractor, Diesel, Machinery, Plowing
  {
    intents: ['tractor', 'diesel', 'fuel', 'machinery', 'plowing', 'tiller', 'harvester', 'டிராக்டர்', 'டீசல்', 'உழவு', 'ஹார்வெஸ்டர்', 'வண்டி வாடகை'],
    replyEn: `🚜 **How to Record Tractor / Diesel / Machinery Costs in AgriTrack:**\n\n1. Click the green **\`+ New Entry\`** button in the top right (or on Ledger).\n2. Keep the **Expense** tab selected.\n3. Choose today's date and your **Crop** (e.g. Paddy, Cotton).\n4. In **Expense Type**, pick **"Tractor Rental"** or type **"Diesel / Machinery"**.\n5. In **Payee**, optionally type the driver or fuel station name.\n6. Choose **Paid From Account** (Cash in Hand, Bank, or UPI).\n7. Enter the **Amount (₹)** and click **\`Save Expense\`**!\n\nYour farm expense is immediately recorded in PostgreSQL.`,
    replyTa: `🚜 **டிராக்டர் / டீசல் / வண்டி வாடகை செலவை பதிவு செய்வது எப்படி:**\n\n1. **Ledger** பக்கத்தில் உள்ள பச்சை நிற **\`+ New Entry\`** பட்டனை அழுத்தவும்.\n2. **Expense** (செலவு) பகுதியைத் தேர்ந்தெடுக்கவும்.\n3. தேதி மற்றும் உங்கள் **Crop** (பயிர்) தேர்வு செய்யவும்.\n4. **Expense Type**-ல் **"Tractor Rental"** அல்லது **"டீசல் / உழவு"** என தேர்வு செய்யவும்.\n5. **Payee**-ல் டிராக்டர் ஓட்டுநர் அல்லது பங்க் பெயரை உள்ளிடவும்.\n6. பணம் செலுத்திய வங்கி அல்லது கை ரொக்கத்தை (**Paid From Account**) தேர்ந்தெடுக்கவும்.\n7. **Amount (₹)** தொகையை உள்ளிட்டு **\`Save Expense\`** பட்டனை அழுத்தவும்!`,
  },
  // 4. Labour Wages, Workers, Coolie
  {
    intents: ['labour', 'wages', 'worker', 'coolie', 'weeding', 'transplanting', 'ஆள் கூலி', 'கூலி', 'வேலை ஆட்கள்', 'களை எடுத்தல்', 'நடவு'],
    replyEn: `👥 **How to Record Labour Wages in AgriTrack:**\n\n1. Click the green **\`+ New Entry\`** button.\n2. Make sure the **Expense** tab is highlighted.\n3. Select your **Crop** (e.g. Sugarcane, Paddy, Vegetables).\n4. In **Expense Type**, choose **"Labour Wages"** (or type Weeding, Harvesting, Sowing Wages).\n5. Under **Payee**, you can enter the gang leader or worker's name.\n6. Select whether you paid from **Cash in Hand** or **Bank**.\n7. Enter the total wage **Amount (₹)**.\n8. Click **\`Save Expense\`**!\n\nTotal input expenses and net profit update automatically.`,
    replyTa: `👥 **ஆள் கூலி / வேலை செலவை பதிவு செய்வது எப்படி:**\n\n1. மேலே உள்ள **\`+ New Entry\`** பட்டனை அழுத்தவும்.\n2. **Expense** (செலவு) பகுதியைத் தேர்ந்தெடுக்கவும்.\n3. உங்கள் பயிரை (**Crop**) தேர்ந்தெடுக்கவும்.\n4. **Expense Type**-ல் **"Labour Wages"** (ஆள் கூலி, நடவு கூலி, களை எடுத்தல்) தேர்வு செய்யவும்.\n5. **Payee**-ல் ஆள் அல்லது மேஸ்திரி பெயரை உள்ளிடவும்.\n6. **Paid From Account** (கை ரொக்கம் அல்லது வங்கி) தேர்வு செய்யவும்.\n7. கூலி தொகையை உள்ளிட்டு **\`Save Expense\`** பட்டனை அழுத்தவும்!`,
  },
  // 5. Seeds, Fertilizer, Pesticides
  {
    intents: ['seed', 'seeds', 'fertilizer', 'fertilizers', 'pesticide', 'pesticides', 'urea', 'dap', 'potash', 'spray', 'உரம்', 'விதை', 'பூச்சிக்கொல்லி', 'யூரியா', 'மருந்து'],
    replyEn: `🌾 **How to Record Fertilizer, Seeds & Pesticide Purchases:**\n\n1. Click **\`+ New Entry\`** on the Ledger page.\n2. In **Expense**, choose the date and the specific crop you are treating.\n3. Pick **Expense Type**: "Seeds", "Fertilizers", or "Pesticides". You can even type specific brand names like DAP, Urea, or Neem Oil!\n4. In **Payee**, enter the fertilizer store or agro-agency name.\n5. Enter the bill **Amount (₹)**.\n6. Choose which bank account or cash was used and click **\`Save Expense\`**.`,
    replyTa: `🌾 **விதை, உரம் மற்றும் பூச்சிக்கொல்லி மருந்து செலவை பதிவு செய்வது:**\n\n1. **\`+ New Entry\`** பட்டனை அழுத்தவும்.\n2. **Expense** பகுதியில் தேதியை தேர்வு செய்து பயிரை தேர்ந்தெடுக்கவும்.\n3. **Expense Type**-ல் **"Seeds"** (விதை), **"Fertilizers"** (உரம் - யூரியா, டிஏபி) அல்லது **"Pesticides"** (மருந்து) தேர்ந்தெடுக்கவும்.\n4. **Payee**-ல் வாங்கிய உரக் கடையின் பெயரை உள்ளிடவும்.\n5. செலவுத் தொகையை உள்ளிட்டு **\`Save Expense\`** அழுத்தவும்!`,
  },
  // 6. Electricity, EB Bill, Borewell, Irrigation
  {
    intents: ['eb', 'current', 'electricity', 'bill', 'borewell', 'motor', 'pump', 'irrigation', 'water', 'தண்ணீர்', 'மின்சாரம்', 'போர்வெல்', 'மோட்டார்', 'கரண்ட்'],
    replyEn: `💧 **How to Record Irrigation / Electricity / Borewell Bills:**\n\n1. Click **\`+ New Entry\`** on the Ledger.\n2. Select the **Expense** tab.\n3. In **Expense Type**, type or select **"Borewell / Electricity"** or **"Irrigation"**.\n4. Under **Payee**, you can enter TNEB / Electricity Board or Motor Repair Shop.\n5. Enter the **Amount (₹)** and click **\`Save Expense\`**!\n\nTip: You can also manage custom categories in **Expense Types** in the sidebar.`,
    replyTa: `💧 **மின்சார கட்டணம் / போர்வெல் / பாசன செலவை பதிவு செய்வது எப்படி:**\n\n1. **Ledger**-ல் உள்ள **\`+ New Entry\`** பட்டனை அழுத்தவும்.\n2. **Expense** பகுதியில் **Expense Type**-ல் **"Borewell / Electricity"** அல்லது **"பாசனம் / கரண்ட் பில்"** என உள்ளிடவும்.\n3. கட்டிய தொகையை உள்ளிட்டு **\`Save Expense\`** பட்டனை அழுத்தவும்!`,
  },
  // 7. General Expense Recording
  {
    intents: ['expense', 'record expense', 'add expense', 'cost', 'spend', 'செலவு', 'செலவு பதிவு'],
    replyEn: `🌾 **Step-by-Step: How to Record an Expense in AgriTrack**\n\n1. Go to the **Ledger** page (or click **Expenses** in the left sidebar).\n2. Click the green **\`+ New Entry\`** button in the top-right corner.\n3. Make sure the **Expense** tab is highlighted.\n4. Pick the **Date** (defaults to today).\n5. Select your **Crop / Planting** (e.g. Paddy, Cotton, Tomato).\n6. Select the **Expense Type** (Seeds, Fertilizers, Pesticides, Labour Wages, Tractor Rental, etc.) or type a custom one.\n7. Optionally enter who you paid (**Payee**).\n8. Choose which account paid for it (**Paid From Account**: Cash in Hand, Bank, UPI).\n9. Enter the **Amount (₹)** and optional notes.\n10. Click **\`Save Expense\`**.\n\nYour net balance and total expenses will update instantly in PostgreSQL!`,
    replyTa: `🌾 **AgriTrack-ல் செலவை பதிவு செய்யும் படிநிலைகள்:**\n\n1. இடது மெனுவில் **Ledger** பக்கத்திற்கு செல்லவும்.\n2. மேல் வலது மூலையில் உள்ள பச்சை நிற **\`+ New Entry\`** பட்டனை அழுத்தவும்.\n3. **Expense** (செலவு) பகுதியைத் தேர்ந்தெடுக்கவும்.\n4. **Date** (தேதி) மற்றும் உங்கள் **Crop** (பயிர்) தேர்வு செய்யவும்.\n5. **Expense Type** (விதை, உரம், மருந்து, ஆள் கூலி, டிராக்டர் வாடகை) தேர்வு செய்யவும்.\n6. **Payee** (கடை அல்லது ஆள் பெயர்) உள்ளிடவும்.\n7. **Paid From Account** (வங்கி கணக்கு அல்லது கை ரொக்கம்) தேர்வு செய்யவும்.\n8. **Amount (₹)** தொகையை உள்ளிட்டு **\`Save Expense\`** பட்டனை அழுத்தவும்!\n\nஉங்கள் செலவு உடனே கணக்கில் சேமிக்கப்படும்!`,
  },
  // 8. General Income / Mandi Sales
  {
    intents: ['income', 'record income', 'sale', 'mandi', 'sell', 'revenue', 'buyer', 'trader', 'harvest sale', 'வருமானம்', 'விற்பனை', 'மண்டி', 'வியாபாரி'],
    replyEn: `💰 **Step-by-Step: How to Record Crop Sale / Mandi Income**\n\n1. On the **Ledger** page, click the green **\`+ New Entry\`** button.\n2. Tap the **Income** tab at the top of the modal window.\n3. Select the **Date** when produce was sold.\n4. Pick the **Crop** that you sold.\n5. Enter the **Buyer / Mandi Trader** name.\n6. Enter the **Quantity** (e.g. 50) and select the unit (Quintals, Kg, Tons).\n7. Enter the **Unit Price (₹)** — the total amount will calculate automatically.\n8. Choose **Received Into Account** (e.g. Bank Account or Cash in Hand).\n9. Click **\`Save Income\`**.\n\nYour Total Income, Net Profit, and balance update immediately!`,
    replyTa: `💰 **மண்டி விற்பனை / பயிர் வருமானத்தை பதிவு செய்யும் படிநிலைகள்:**\n\n1. **Ledger** பக்கத்தில் உள்ள பச்சை நிற **\`+ New Entry\`** பட்டனை அழுத்தவும்.\n2. மேலே உள்ள **Income** (வருமானம்) பகுதியைத் தேர்ந்தெடுக்கவும்.\n3. விற்ற **Date** மற்றும் **Crop**-ஐ தேர்ந்தெடுக்கவும்.\n4. **Buyer** (வாங்கிய வியாபாரி அல்லது மண்டி பெயர்) உள்ளிடவும்.\n5. **Quantity** (அளவு) மற்றும் **Unit Price** (ஒரு யூனிட் விலை) உள்ளிடவும். மொத்த தொகை தானாக கணக்கிடப்படும்.\n6. பணம் பெற்ற **Account** (வங்கி அல்லது ரொக்கம்) தேர்வு செய்து **\`Save Income\`** பட்டனை அழுத்தவும்!\n\nஉங்கள் மொத்த வருமானம் மற்றும் நிகர லாபம் உடனே புதுப்பிக்கப்படும்!`,
  },
  // 9. Crop Life Cycles & Plantings
  {
    intents: ['crop', 'planting', 'crop cycle', 'add crop', 'sowing', 'harvest', 'பயிர்', 'பயிர் சுழற்சி', 'விதைப்பு', 'அறுவடை'],
    replyEn: `🌱 **Step-by-Step: How to Add & Manage a Crop Cycle**\n\n1. In the sidebar, click **Crops / Plantings** (or click the **Plantings** button on Ledger).\n2. Click the **\`+ Add Planting\`** button.\n3. Enter the **Crop Name** (e.g. Paddy, Sugarcane) and **Variety** (e.g. BPT 5204).\n4. Enter your **Field / Plot Name** (e.g. North Borewell Plot, East 2.5 Acres).\n5. Enter the **Land Area** in Acres or Cents.\n6. Choose your **Seeding / Sowing Date** and **Expected Harvest Date**.\n7. Select the initial status: **Planned** or **Growing**.\n8. Click **\`Save Crop Cycle\`**.\n\n🔄 **Lifecycle Stages:**\n- **Planned** → Field prepared, sowing upcoming\n- **Growing** → Actively receiving fertilizer, irrigation & labour\n- **Ready to Harvest** → Crop matured\n- **Harvested** → Completed; all expenses and sales are summarized for profit!`,
    replyTa: `🌱 **புதிய பயிர் சுழற்சி (Crop Cycle) சேர்க்கும் படிநிலைகள்:**\n\n1. இடது மெனுவில் **Crops / Plantings** பட்டனை அழுத்தவும்.\n2. மேலே உள்ள பச்சை நிற **\`+ Add Planting\`** பட்டனை அழுத்தவும்.\n3. **Crop Name** (பயிர் பெயர்) மற்றும் **Variety** (ரகம்) உள்ளிடவும்.\n4. **Field / Plot** (நிலம் பெயர்) மற்றும் பரப்பளவை (Acres / Cents) உள்ளிடவும்.\n5. விதைத்த தேதி (**Sowing Date**) மற்றும் அறுவடை தேதி (**Harvest Date**) தேர்வு செய்யவும்.\n6. நிலையை **Planned** அல்லது **Growing** என வைத்து **\`Save Crop Cycle\`** பட்டனை அழுத்தவும்!\n\n🔄 பயிர் அறுவடைக்கு தயாரானதும் நிலையை **Harvested** என மாற்றலாம்!`,
  },
  // 10. Edit / Mistake / Delete
  {
    intents: ['edit', 'change', 'mistake', 'wrong', 'correct', 'delete', 'remove', 'தவறு', 'திருத்த', 'மாற்ற', 'அழிக்க', 'நீக்க'],
    replyEn: `✏️ **How to Edit or Delete an Entry in AgriTrack:**\n\n• **To Edit an Entry:**\n  1. Find the transaction in your **Ledger** table.\n  2. Click the **Pencil icon (\`Edit\`)** on the right side of the row.\n  3. Change the amount, date, crop, or expense type in the modal.\n  4. Click **\`Update\`** to save the changes.\n\n• **To Delete an Entry:**\n  1. Click the **Trash icon (\`Delete\`)** on the row.\n  2. Confirm the safety dialog to permanently remove it.\n\nYour totals and bank balances re-calculate immediately!`,
    replyTa: `✏️ **தவறான பதிவை திருத்துவது அல்லது நீக்குவது எப்படி:**\n\n• **பதிவை திருத்த (Edit):**\n  1. **Ledger** கணக்கு பட்டியலில் குறிப்பிட்ட பதிவைக் கண்டறியவும்.\n  2. அந்த வரியின் வலதுபுறம் உள்ள **பென்சில் குறி (\`Edit\`)**-ஐ அழுத்தவும்.\n  3. தொகை, பயிர் அல்லது தேதியை மாற்றி **\`Update\`** பட்டனை அழுத்தவும்.\n\n• **பதிவை நீக்க (Delete):**\n  1. அந்த வரியில் உள்ள **குப்பைத்தொட்டி குறி (\`Delete\`)**-ஐ அழுத்தவும்.\n  2. உறுதிப்படுத்தல் செய்தியில் 'Delete' என்பதை அழுத்தினால் கணக்கு நீக்கப்படும்!`,
  },
  // 11. Bank Accounts & Wallets
  {
    intents: ['account', 'accounts', 'bank', 'cash', 'upi', 'gpay', 'phonepe', 'sbi', 'hdfc', 'வங்கி', 'ரொக்கம்', 'கணக்குகள்'],
    replyEn: `🏦 **Managing Bank Accounts & Cash in AgriTrack:**\n\n1. Go to **Accounts** in the left sidebar menu.\n2. You can view all existing accounts (Cash in Hand, SBI, Canara, UPI).\n3. Click **\`+ Add Account\`** to register a new bank account or digital wallet.\n4. Enter the **Account Name**, **Account Type** (Bank, Cash, UPI), and **Starting Balance**.\n5. When recording any expense or income, choose this account in the **Paid From** / **Received Into** dropdown!`,
    replyTa: `🏦 **வங்கி கணக்குகள் மற்றும் ரொக்கத்தை நிர்வகிப்பது எப்படி:**\n\n1. இடது மெனுவில் **Accounts** பக்கத்திற்கு செல்லவும்.\n2. உங்கள் வங்கி கணக்குகள் மற்றும் கை ரொக்க இருப்பை இங்கே காணலாம்.\n3. புதிய கணக்கு சேர்க்க **\`+ Add Account\`** பட்டனை அழுத்தவும்.\n4. வங்கியின் பெயர், கணக்கு வகை (Bank, Cash, UPI) மற்றும் தொடக்க இருப்பை உள்ளிட்டு சேமிக்கவும்!\n5. வரவு செலவு போடும்போது இந்த கணக்குகளை எளிதாக தேர்வு செய்யலாம்.`,
  },
  // 12. Reports & CSV Export
  {
    intents: ['report', 'reports', 'export', 'download', 'csv', 'excel', 'print', 'tax', 'அறிக்கை', 'பதிவிறக்கம்', 'எக்செல்', 'டவுன்லோட்'],
    replyEn: `📊 **How to View & Download Reports in AgriTrack:**\n\n1. Click **Reports** in the left sidebar (or click the **Download CSV** button on Ledger).\n2. You can see comprehensive charts, expense breakdowns, and monthly trends.\n3. Click **\`Download CSV\`** to export your entire farm ledger to an Excel-compatible spreadsheet.\n4. Use this CSV file for filing taxes, bank loan applications, or sharing with an accountant!`,
    replyTa: `📊 **கணக்கு அறிக்கைகளை பார்ப்பது மற்றும் பதிவிறக்குவது எப்படி:**\n\n1. இடது மெனுவில் **Reports** பக்கத்திற்கு செல்லவும்.\n2. உங்கள் பண்ணை வரவு செலவு வரைபடங்கள் மற்றும் மாதந்திர கணக்குகளை இங்கே காணலாம்.\n3. **\`Download CSV\`** பட்டனை அழுத்தினால் முழு கணக்குகளும் எக்செல் (Excel) கோப்பாக உங்கள் போனில் பதிவிறக்கம் செய்யப்படும்!\n4. இதை வங்கி பயிர் கடன் அல்லது ஆடிட்டருக்கு வழங்க பயன்படுத்தலாம்.`,
  },
  // 13. Buttons Guide
  {
    intents: ['button', 'buttons', 'functions of the buttons', 'function of buttons', 'what do the buttons do', 'பட்டன்', 'பொத்தான்', 'பட்டன்கள் என்ன செய்யும்'],
    replyEn: `🔘 **Functions of All Key Buttons in AgriTrack:**\n\n• **\`+ New Entry\`**: Opens the modal to record an Expense or Crop Sale Income.\n• **\`Plantings / Crops\`**: Takes you to crop lifecycle tracking.\n• **\`Filter by Crop\`**: Dropdown on Ledger to view records for one specific crop only.\n• **\`Filter by Person / Payee\`**: Dropdown to isolate records for a worker, shop, or buyer.\n• **\`Date Range (From / To)\`**: Filters transactions between two calendar dates.\n• **\`Clear Filters\`**: Resets all active filters to view all records.\n• **\`Edit (Pencil Icon)\`**: Modifies an existing expense or income entry.\n• **\`Delete (Trash Icon)\`**: Permanently removes an entry with a confirmation safety prompt.\n• **\`Expense Types\`**: Lets you create custom categories (e.g., Drone Spraying, Borewell Electric).\n• **\`Payees\`**: Manage contact directory of shops and workers.\n• **\`Accounts\`**: Add and manage Bank, Cash, and UPI accounts.\n• **\`Reports / Download CSV\`**: Exports your accounting records to CSV files.\n• **\`Language Toggle (தமிழ் / English)\`**: Switches the ledger between English and Tamil.\n• **\`Log Out\`**: Safely logs out and automatically resets the language to English.`,
    replyTa: `🔘 **AgriTrack-ல் உள்ள அனைத்து பட்டன்களின் முக்கிய செயல்பாடுகள்:**\n\n• **\`+ New Entry\`**: புதிய வரவு அல்லது செலவு பதிவு செய்யும் படிவத்தைத் திறக்கும்.\n• **\`Plantings / Crops\`**: பயிர் சுழற்சி மற்றும் நில விவரங்களை நிர்வகிக்க உதவும்.\n• **\`Filter by Crop\`**: குறிப்பிட்ட ஒரு பயிருக்கான கணக்குகளை மட்டும் பார்க்க உதவும்.\n• **\`Filter by Person / Payee\`**: ஒரு குறிப்பிட்ட ஆள் அல்லது கடைக்கான கணக்குகளை மட்டும் பிரித்துப் பார்க்க உதவும்.\n• **\`Date Range\`**: குறிப்பிட்ட இரண்டு தேதிகளுக்கு இடைப்பட்ட கணக்குகளைக் காட்டும்.\n• **\`Clear Filters\`**: அனைத்து வடிகட்டிகளையும் நீக்கி முழு கணக்கையும் காட்டும்.\n• **\`Edit (பென்சில் குறி)\`**: தவறாக பதிவிட்ட கணக்கை திருத்த உதவும்.\n• **\`Delete (குப்பைத்தொட்டி குறி)\`**: தேவையில்லாத பதிவை பாதுகாப்பாக நீக்க உதவும்.\n• **\`Reports / Download CSV\`**: உங்கள் பண்ணை கணக்கை எக்செல் கோப்பாக பதிவிறக்க உதவும்.\n• **\`Language Switcher\`**: தமிழ் மற்றும் ஆங்கில மொழிக்கு மாற்ற உதவும்.\n• **\`Log Out\`**: கணக்கிலிருந்து பாதுகாப்பாக வெளியேறும்!`,
  },
  // 14. Net Profit & Calculations
  {
    intents: ['profit', 'loss', 'p&l', 'margin', 'calculation', 'லாபம்', 'நஷ்டம்', 'கணக்கீடு'],
    replyEn: `📊 **How Profit & Loss is Calculated in AgriTrack:**\n\n1. **Total Revenue (Income):** Sum of all crop sales, mandi receipts, and farm revenue.\n2. **Total Expenses (Costs):** Sum of seeds, fertilizers, pesticides, labour wages, machinery rentals, and transport.\n3. **Net Profit:** Calculated as:\n   \`Net Profit = Total Income - Total Expenses\`\n4. **Profit Margin %:** Calculated as:\n   \`Margin % = (Net Profit ÷ Total Income) × 100\`\n\nYou can view your overall farm P&L as well as individual per-crop profitability in the **Profit & Loss** tab in the sidebar!`,
    replyTa: `📊 **AgriTrack-ல் லாபம் மற்றும் நஷ்டம் எவ்வாறு கணக்கிடப்படுகிறது:**\n\n1. **மொத்த வருமானம் (Total Income):** அனைத்து பயிர் விற்பனை மற்றும் மண்டி வருமானங்களின் கூட்டுத்தொகை.\n2. **மொத்த செலவு (Total Expenses):** விதை, உரம், மருந்து, ஆள் கூலி, டிராக்டர் செலவுகளின் கூட்டுத்தொகை.\n3. **நிகர லாபம் (Net Profit):**\n   \`நிகர லாபம் = மொத்த வருமானம் - மொத்த செலவு\`\n4. **லாப விகிதம் (Profit Margin %):**\n   \`Margin % = (நிகர லாபம் ÷ மொத்த வருமானம்) × 100\`\n\nஇதை **Profit & Loss** பக்கத்தில் ஒவ்வொரு பயிருக்கும் தனித்தனியாக பார்க்கலாம்!`,
  },
  // 15. What is AgriTrack / Capabilities
  {
    intents: ['what is agritrack', 'about agritrack', 'features', 'help', 'doubt', 'சந்தேகம்', 'உதவி', 'விளக்கம்'],
    replyEn: `🌾 **What AgriTrack Can Do for You:**\n\nAgriTrack is your complete digital farm ledger and agricultural manager:\n• **Track Input Costs:** Record seed, fertilizer, pesticide, labour, tractor, and fuel expenses.\n• **Track Mandi Income:** Record harvest sales with quantity, rate, and buyers.\n• **Crop Lifecycle:** Track planting, sowing, growth stages, and harvest dates.\n• **Real-Time Profit & Loss:** Instant Net Profit and Margin calculations per crop.\n• **Cloud Sync:** All data is safely stored in PostgreSQL and accessible from your phone or PC.\n\nAsk me anything specific, like *"How to record an expense?"* or *"What does the Filter button do?"*!`,
    replyTa: `🌾 **AgriTrack செயலியில் நீங்கள் என்னவெல்லாம் செய்யலாம்:**\n\nAgriTrack உங்கள் முழுமையான டிஜிட்டல் பண்ணை கணக்கு ஏடு ஆகும்:\n• **செலவுகள் பதிவு:** விதை, உரம், மருந்து, ஆள் கூலி, டிராக்டர் செலவுகளை உடனுக்குடன் பதிவு செய்யலாம்.\n• **வருமானம் பதிவு:** மண்டி மற்றும் வியாபாரிகளுக்கு விற்ற பயிர் அளவு, விலை மற்றும் தொகையை கணக்கில் வைக்கலாம்.\n• **பயிர் சுழற்சி:** விதைப்பு முதல் அறுவடை வரை பயிர் நிலைகளை கண்காணிக்கலாம்.\n• **லாப நஷ்ட கணக்கீடு:** ஒவ்வொரு பயிரிலும் கிடைத்த நிகர லாபம் எவ்வளவு என்பதை உடனடியாக பார்க்கலாம்.\n• **கிளவுட் சேமிப்பு:** உங்கள் கணக்குகள் பாதுகாப்பாக PostgreSQL டேட்டாபேஸில் சேமிக்கப்படும்!\n\nஏதேனும் சந்தேகம் இருந்தால் தாராளமாகக் கேளுங்கள்!`,
  },
];

function isTamilText(text: string): boolean {
  return /[\u0B80-\u0BFF]/.test(text);
}

// Intelligent intent matching that scores and matches any customer question
function analyzeQuestion(query: string, wantsTamil: boolean): string | null {
  const q = query.toLowerCase().trim();

  // 1. Direct greeting exact check
  const greetings = ['hi', 'hello', 'hey', 'hai', 'வணக்கம்', 'காலை வணக்கம்', 'வணக்கமுங்க', 'ஹலோ', 'vanakkam'];
  if (greetings.includes(q) || q.startsWith('hi ') || q.startsWith('hello ') || q.startsWith('வணக்கம் ')) {
    return wantsTamil ? INTENT_KNOWLEDGE[0].replyTa : INTENT_KNOWLEDGE[0].replyEn;
  }

  // 2. Score intents based on keyword matches
  let bestItem: KnowledgeItem | null = null;
  let highestScore = 0;

  for (const item of INTENT_KNOWLEDGE) {
    let score = 0;
    for (const intent of item.intents) {
      const intentLower = intent.toLowerCase();
      if (q === intentLower) {
        score += 10;
      } else if (q.includes(intentLower)) {
        score += intentLower.length;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestItem = item;
    }
  }

  if (bestItem && highestScore > 0) {
    return wantsTamil ? bestItem.replyTa : bestItem.replyEn;
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

    // 1. Check for off-topic non-farming questions (movies, politics, celebrities)
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
      !lower.includes('farm') &&
      !lower.includes('expense') &&
      !lower.includes('income');

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

    // 2. If Gemini API Key is configured, use Google GenAI SDK for open-ended intelligence
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

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

        let userPrompt = trimmedMessage;
        if (wantsTamil) {
          userPrompt += '\n\n[Instruction: Answer in friendly, natural Tamil (தமிழில்). Keep button names in backticks with English labels.]';
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
        console.warn('Gemini API call failed, falling back to local NLP engine:', geminiErr?.message);
      }
    }

    // 3. Fallback to our Comprehensive Conversational NLP Engine
    const matched = analyzeQuestion(trimmedMessage, wantsTamil);
    if (matched) {
      return NextResponse.json({
        success: true,
        reply: matched,
        source: 'knowledge-engine',
        language: wantsTamil ? 'ta' : 'en',
      });
    }

    // 4. Default Conversational response if query is unique
    const defaultReply = wantsTamil
      ? `🌾 **வணக்கம்! நான் உங்கள் AgriTrack AI உதவியாளர்.**\n\nஉங்கள் கேள்வியை நான் புரிந்து கொள்ள முயல்கிறேன். AgriTrack-ல் நீங்கள் என்ன செய்ய விரும்புகிறீர்கள்?\n\n• **செலவு பதிவு செய்ய:** \`+ New Entry\` அழுத்தவும்.\n• **வருமானம் பதிவு செய்ய:** \`+ New Entry\` -> Income பகுதிக்கு செல்லவும்.\n• **பயிர் சுழற்சி சேர்க்க:** \`Crops / Plantings\` பக்கத்திற்கு செல்லவும்.\n• **பட்டன்கள் பற்றி அறிய:** "பட்டன்களின் விளக்கம் என்ன?" என்று கேளுங்கள்!\n\nநீங்கள் என்ன செய்ய விரும்புகிறீர்கள் என்று தமிழில் தாராளமாகக் கேளுங்கள்!`
      : `🌾 **Hello! I am your AgriTrack AI Assistant.**\n\nI am here to clear all your doubts! What would you like to do in AgriTrack?\n\n• **Record an Expense:** Click the green \`+ New Entry\` button.\n• **Record Mandi Sales:** Click \`+ New Entry\` and select the Income tab.\n• **Add a Crop Cycle:** Go to \`Crops / Plantings\` in the sidebar.\n• **Button Guide:** Ask me *"What do the buttons do?"*\n\nTell me what you need assistance with, and I will guide you step by step!`;

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
