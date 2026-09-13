// Multilingual Sample Documents with rich extracted data, bounding boxes, key-value pairs, tables, and translations

export const SAMPLE_DOCUMENTS = [
  {
    id: 'doc-invoice-de',
    title: 'German Equipment Supply Invoice',
    language: 'German (Deutsch)',
    langCode: 'de',
    category: 'Commercial Invoice',
    thumbnail: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    confidenceScore: 99.4,
    processingTime: '0.42s',
    scriptType: 'Latin',
    pageCount: 1,
    fileSize: '1.2 MB',
    summary: 'Tax compliant invoice from Berlin Engineering GmbH for industrial sensor equipment with 19% MwSt breakdown.',
    rawText: `BERLIN ENGINEERING GMBH
Industriestraße 45, 10115 Berlin, Deutschland
USt-IdNr.: DE 814 592 103
Telefon: +49 (0)30 8921-00 | E-Mail: rechnungen@berlin-eng.de

RECHNUNG
Rechnungsnummer: RE-2026-88421
Rechnungsdatum: 12.02.2026
Lieferdatum: 10.02.2026
Kundennummer: KD-90412

Empfänger:
Nexus Automation Ltd
Technologiepark 8
80339 München

Positionen:
Pos | Beschreibung | Menge | Einzelpreis | Gesamtbetrag
01  | Optischer Sensor PX-400 | 12 Stk | 185,00 € | 2.220,00 €
02  | Kalibrierungsmodul CM-12 | 4 Stk  | 450,00 € | 1.800,00 €
03  | Industriekabel 5m geschirmt | 24 Stk | 22,50 € | 540,00 €
04  | Express-Versand & Logistik | 1 Psch | 85,00 €  | 85,00 €

Nettobetrag: 4.645,00 €
MwSt. (19%): 882,55 €
GESAMTBETRAG: 5.527,55 €

Zahlungsziel: 14 Tage ohne Abzug bis zum 26.02.2026 auf folgendes Konto:
IBAN: DE89 3704 0044 0532 0130 00 | BIC: COBADEFFXXX
Vielen Dank für Ihren Auftrag!`,
    boxes: [
      { id: 'b1', text: 'BERLIN ENGINEERING GMBH', confidence: 99.8, x: 8, y: 6, width: 45, height: 4, type: 'header' },
      { id: 'b2', text: 'USt-IdNr.: DE 814 592 103', confidence: 99.1, x: 8, y: 12, width: 35, height: 3, type: 'entity' },
      { id: 'b3', text: 'RECHNUNG: RE-2026-88421', confidence: 99.9, x: 55, y: 16, width: 38, height: 5, type: 'entity' },
      { id: 'b4', text: 'Nexus Automation Ltd', confidence: 98.9, x: 8, y: 22, width: 32, height: 4, type: 'entity' },
      { id: 'b5', text: 'Positionen Tabelle (4 Artikel)', confidence: 99.3, x: 8, y: 34, width: 84, height: 26, type: 'table' },
      { id: 'b6', text: 'Nettobetrag: 4.645,00 €', confidence: 99.6, x: 55, y: 63, width: 37, height: 3.5, type: 'value' },
      { id: 'b7', text: 'MwSt. (19%): 882,55 €', confidence: 99.4, x: 55, y: 67, width: 37, height: 3.5, type: 'value' },
      { id: 'b8', text: 'GESAMTBETRAG: 5.527,55 €', confidence: 99.9, x: 55, y: 72, width: 37, height: 4.5, type: 'value' },
      { id: 'b9', text: 'IBAN: DE89 3704 0044 0532 0130 00', confidence: 98.7, x: 8, y: 84, width: 50, height: 3.5, type: 'entity' }
    ],
    entities: [
      { label: 'Vendor / Issuer', value: 'Berlin Engineering GmbH', confidence: 99.8, tag: 'ORGANIZATION' },
      { label: 'Invoice Number', value: 'RE-2026-88421', confidence: 99.9, tag: 'INVOICE_ID' },
      { label: 'Invoice Date', value: '12.02.2026', confidence: 99.5, tag: 'DATE' },
      { label: 'Due Date', value: '26.02.2026', confidence: 99.1, tag: 'DATE' },
      { label: 'Customer', value: 'Nexus Automation Ltd', confidence: 98.9, tag: 'CLIENT' },
      { label: 'VAT ID (USt-IdNr)', value: 'DE 814 592 103', confidence: 99.2, tag: 'TAX_ID' },
      { label: 'Net Amount', value: '€ 4,645.00', confidence: 99.6, tag: 'MONEY' },
      { label: 'Tax (MwSt 19%)', value: '€ 882.55', confidence: 99.4, tag: 'TAX' },
      { label: 'Total Amount', value: '€ 5,527.55', confidence: 99.9, tag: 'TOTAL' },
      { label: 'Payment IBAN', value: 'DE89 3704 0044 0532 0130 00', confidence: 98.7, tag: 'BANKING' }
    ],
    table: {
      headers: ['Pos', 'Beschreibung (Description)', 'Menge (Qty)', 'Einzelpreis (Unit Price)', 'Gesamt (Total)'],
      rows: [
        ['01', 'Optischer Sensor PX-400', '12 Stk', '185,00 €', '2.220,00 €'],
        ['02', 'Kalibrierungsmodul CM-12', '4 Stk', '450,00 €', '1.800,00 €'],
        ['03', 'Industriekabel 5m geschirmt', '24 Stk', '22,50 €', '540,00 €'],
        ['04', 'Express-Versand & Logistik', '1 Psch', '85,00 €', '85,00 €']
      ]
    },
    translations: {
      en: `BERLIN ENGINEERING GMBH\nIndustriestraße 45, 10115 Berlin, Germany\nVAT Reg: DE 814 592 103\n\nINVOICE\nInvoice Number: RE-2026-88421\nInvoice Date: Feb 12, 2026\nDelivery Date: Feb 10, 2026\nCustomer ID: KD-90412\n\nRecipient: Nexus Automation Ltd, Technology Park 8, 80339 Munich\n\nItems:\n01 | Optical Sensor PX-400 | 12 pcs | €185.00 | €2,220.00\n02 | Calibration Module CM-12 | 4 pcs | €450.00 | €1,800.00\n03 | Shielded Industrial Cable 5m | 24 pcs | €22.50 | €540.00\n04 | Express Shipping & Logistics | 1 lot | €85.00 | €85.00\n\nNet Amount: €4,645.00\nVAT (19%): €882.55\nTOTAL AMOUNT: €5,527.55\n\nPayment due in 14 days without deduction by Feb 26, 2026.\nThank you for your order!`,
      hi: `बर्लिन इंजीनियरिंग जीएमबीएच\nउद्योग स्ट्रीट 45, 10115 बर्लिन, जर्मनी\nवैट पहचान संख्या: DE 814 592 103\n\nबीजक (चालान)\nचालान संख्या: RE-2026-88421\nचालान दिनांक: 12.02.2026\nग्राहक: नेक्सस ऑटोमेशन लिमिटेड\n\nकुल शुद्ध राशि: € 4,645.00\nवैट (19%): € 882.55\nकुल देय राशि: € 5,527.55`,
      es: `BERLIN ENGINEERING GMBH\nIndustriestraße 45, 10115 Berlín, Alemania\nNIF-IVA: DE 814 592 103\n\nFACTURA\nNúmero de factura: RE-2026-88421\nFecha de emisión: 12.02.2026\nCliente: Nexus Automation Ltd\n\nBase Imponible: 4.645,00 €\nIVA (19%): 882,55 €\nIMPORTE TOTAL: 5.527,55 €`
    }
  },
  {
    id: 'doc-hospital-hi',
    title: 'Hindi Hospital Discharge & Diagnostic Summary',
    language: 'Hindi (हिन्दी)',
    langCode: 'hi',
    category: 'Medical Report',
    thumbnail: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    confidenceScore: 98.9,
    processingTime: '0.48s',
    scriptType: 'Devanagari',
    pageCount: 1,
    fileSize: '1.4 MB',
    summary: 'Medical discharge summary from Apollo Super Specialty Hospital Delhi in Hindi Devanagari script.',
    rawText: `अपोलो सुपर स्पेशलिटी अस्पताल, नई दिल्ली
सरिता विहार, मथुरा रोड, नई दिल्ली - 110076
पंजीकरण संख्या: DL-MED-99410 | संपर्क: 011-26925858

मरीज का डिस्चार्ज सारांश (DISCHARGE SUMMARY)
मरीज का नाम: राजेश कुमार शर्मा (Rajesh Kumar Sharma)
आयु / लिंग: 46 वर्ष / पुरुष
यूएचआईडी (UHID): AP-2026-90812
प्रवेश तिथि: 04 फरवरी 2026
छुट्टी की तिथि: 11 फरवरी 2026
उपचारक चिकित्सक: डॉ. अनिल मेहरा (एम.डी., कार्डियोलॉजी)

नैदानिक निष्कर्ष (DIAGNOSIS):
प्राथमिक निदान: तीव्र कोरोनरी सिंड्रोम (Acute Coronary Syndrome)
उपचार: सफल पीटीसीए (PTCA) और ड्रग-एल्यूटिंग स्टेंट प्रत्यारोपण।

महत्वपूर्ण पैरामीटर (VITAL SIGNS):
- रक्तचाप (BP): 124/82 mmHg
- हृदय गति (Pulse): 74 प्रति मिनट
- ऑक्सीजन संतृप्ति (SpO2): 98% (सामान्य हवा पर)
- फास्टिंग ब्लड शुगर (FBS): 112 mg/dL

दवाइयों का परामर्श (MEDICATIONS PRESCRIBED):
क्र. | औषधि का नाम | खुराक | समय | अवधि
१. | इकोस्पिरिन (Ecosprin) | 75 mg | दिन में एक बार (भोजन पश्चात) | 6 माह
२. | एटोरवास्टेटिन (Atorvastatin) | 40 mg | रात को सोने से पहले | 1 वर्ष
३. | मेटोप्रोलोल (Metoprolol) | 25 mg | सुबह नाश्ते के बाद | 3 माह

अगली जांच (FOLLOW UP):
18 फरवरी 2026 को ओपीडी में डॉ. अनिल मेहरा से परामर्श लें।
आपातकालीन सहायता हेतु: +91 98110 02233`,
    boxes: [
      { id: 'b1', text: 'अपोलो सुपर स्पेशलिटी अस्पताल, नई दिल्ली', confidence: 99.4, x: 6, y: 5, width: 60, height: 4.5, type: 'header' },
      { id: 'b2', text: 'मरीज का नाम: राजेश कुमार शर्मा', confidence: 99.1, x: 6, y: 15, width: 45, height: 3.5, type: 'entity' },
      { id: 'b3', text: 'यूएचआईडी: AP-2026-90812', confidence: 99.7, x: 55, y: 15, width: 38, height: 3.5, type: 'entity' },
      { id: 'b4', text: 'नैदानिक निष्कर्ष: तीव्र कोरोनरी सिंड्रोम', confidence: 98.6, x: 6, y: 27, width: 65, height: 5, type: 'entity' },
      { id: 'b5', text: 'महत्वपूर्ण पैरामीटर (BP 124/82, SpO2 98%)', confidence: 98.9, x: 6, y: 38, width: 85, height: 10, type: 'entity' },
      { id: 'b6', text: 'दवाइयों की सारणी (3 प्रिस्क्रिप्शन)', confidence: 99.2, x: 6, y: 52, width: 88, height: 26, type: 'table' },
      { id: 'b7', text: 'अगली जांच: 18 फरवरी 2026', confidence: 98.4, x: 6, y: 82, width: 50, height: 4, type: 'entity' }
    ],
    entities: [
      { label: 'Hospital', value: 'Apollo Super Specialty Hospital, New Delhi', confidence: 99.4, tag: 'FACILITY' },
      { label: 'Patient Name', value: 'राजेश कुमार शर्मा (Rajesh Kumar Sharma)', confidence: 99.1, tag: 'PERSON' },
      { label: 'Patient Age/Sex', value: '46 Y / Male', confidence: 99.0, tag: 'DEMOGRAPHICS' },
      { label: 'UHID / Reg No.', value: 'AP-2026-90812', confidence: 99.7, tag: 'ID_NUMBER' },
      { label: 'Attending Doctor', value: 'Dr. Anil Mehra (M.D. Cardiology)', confidence: 99.3, tag: 'DOCTOR' },
      { label: 'Primary Diagnosis', value: 'Acute Coronary Syndrome (PTCA Stent)', confidence: 98.6, tag: 'MEDICAL_CONDITION' },
      { label: 'Admission Date', value: '04 February 2026', confidence: 99.2, tag: 'DATE' },
      { label: 'Discharge Date', value: '11 February 2026', confidence: 99.4, tag: 'DATE' },
      { label: 'Follow-up Date', value: '18 February 2026', confidence: 98.4, tag: 'DATE' }
    ],
    table: {
      headers: ['क्र. (S.No)', 'औषधि का नाम (Medicine Name)', 'खुराक (Dosage)', 'समय (Timing)', 'अवधि (Duration)'],
      rows: [
        ['१', 'इकोस्पिरिन (Ecosprin)', '75 mg', 'दिन में एक बार (भोजन पश्चात)', '6 माह'],
        ['२', 'एटोरवास्टेटिन (Atorvastatin)', '40 mg', 'रात को सोने से पहले', '1 वर्ष'],
        ['३', 'मेटोप्रोलोल (Metoprolol)', '25 mg', 'सुबह नाश्ते के बाद', '3 माह']
      ]
    },
    translations: {
      en: `APOLLO SUPER SPECIALTY HOSPITAL, NEW DELHI\nSarita Vihar, Mathura Road, New Delhi - 110076\nRegistration No: DL-MED-99410 | Phone: 011-26925858\n\nDISCHARGE SUMMARY\nPatient Name: Rajesh Kumar Sharma\nAge / Gender: 46 Years / Male\nUHID: AP-2026-90812\nAdmission Date: February 04, 2026\nDischarge Date: February 11, 2026\nAttending Physician: Dr. Anil Mehra (M.D., Cardiology)\n\nDIAGNOSIS:\nPrimary Diagnosis: Acute Coronary Syndrome\nProcedure: Successful PTCA and Drug-Eluting Stent Implantation.\n\nVITAL SIGNS:\n- Blood Pressure: 124/82 mmHg\n- Pulse: 74 bpm\n- SpO2: 98% on room air\n- Fasting Blood Sugar: 112 mg/dL\n\nPRESCRIPTION MEDICATIONS:\n1. Ecosprin 75 mg - Once daily after meals (6 months)\n2. Atorvastatin 40 mg - Night at bedtime (1 year)\n3. Metoprolol 25 mg - Morning after breakfast (3 months)\n\nFOLLOW UP:\nConsult Dr. Anil Mehra at OPD on February 18, 2026.`,
      es: `HOSPITAL DE ALTA ESPECIALIDAD APOLO, NUEVA DELHI\nINFORME DE ALTA MÉDICA\nPaciente: Rajesh Kumar Sharma\nEdad/Género: 46 Años / Masculino\nUHID: AP-2026-90812\nFecha de Alta: 11 de febrero de 2026\nMédico Tratante: Dr. Anil Mehra (Cardiología)\nDiagnóstico: Síndrome Coronario Agudo tratado con angioplastia y stent liberador de fármaco.`
    }
  },
  {
    id: 'doc-id-ar',
    title: 'Arabic Resident Identity & Work Card',
    language: 'Arabic (العربية)',
    langCode: 'ar',
    category: 'National ID & Residency',
    thumbnail: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    confidenceScore: 99.1,
    processingTime: '0.39s',
    scriptType: 'Arabic (RTL)',
    pageCount: 1,
    fileSize: '950 KB',
    summary: 'United Arab Emirates Resident Identity Card with biometric ID, sponsor details and validity period in Arabic script.',
    rawText: `الإمارات العربية المتحدة
الهيئة الاتحادية للهوية والجنسية والجمارك وأمن المنافذ
UNITED ARAB EMIRATES - FEDERAL AUTHORITY FOR IDENTITY & CITIZENSHIP

بطاقة هوية مقيم (RESIDENT IDENTITY CARD)
رقم الهوية / Identity No.: 784-1988-3490125-9
الاسم الكامل: طارق عبد العزيز المنصوري (Tariq Abdulaziz Al-Mansouri)
الجنسية: دولة الإمارات العربية المتحدة (UAE)
تاريخ الميلاد: 15/09/1988
الجنس: ذكر (Male)
مكان الإصدار: دبي (Dubai)

بيانات الإقامة والعمل:
صاحب العمل / الضامن: شركة نكسس لحلول الذكاء الاصطناعي ش.ذ.م.م
(Nexus AI Solutions L.L.C.)
المهنة: كبير مهندسي برمجيات (Senior Software Engineer)
تاريخ الإصدار: 10/01/2026
تاريخ الانتهاء: 09/01/2029

الرقم التسلسلي للبطاقة: ID-DXB-8839210
توقيع حامل البطاقة: معتمد إلكترونياً`,
    boxes: [
      { id: 'b1', text: 'الإمارات العربية المتحدة - بطاقة هوية', confidence: 99.6, x: 10, y: 6, width: 80, height: 6, type: 'header' },
      { id: 'b2', text: 'رقم الهوية: 784-1988-3490125-9', confidence: 99.9, x: 30, y: 18, width: 60, height: 5, type: 'entity' },
      { id: 'b3', text: 'طارق عبد العزيز المنصوري', confidence: 99.2, x: 30, y: 27, width: 55, height: 4.5, type: 'entity' },
      { id: 'b4', text: 'الجنسية: دولة الإمارات العربية المتحدة', confidence: 98.9, x: 30, y: 35, width: 50, height: 4, type: 'entity' },
      { id: 'b5', text: 'شركة نكسس لحلول الذكاء الاصطناعي', confidence: 98.7, x: 10, y: 48, width: 80, height: 6, type: 'entity' },
      { id: 'b6', text: 'المهنة: كبير مهندسي برمجيات', confidence: 99.0, x: 10, y: 58, width: 60, height: 4, type: 'entity' },
      { id: 'b7', text: 'تاريخ الانتهاء: 09/01/2029', confidence: 99.5, x: 10, y: 68, width: 45, height: 4, type: 'entity' }
    ],
    entities: [
      { label: 'Emirates ID No.', value: '784-1988-3490125-9', confidence: 99.9, tag: 'NATIONAL_ID' },
      { label: 'Full Name (Arabic)', value: 'طارق عبد العزيز المنصوري', confidence: 99.2, tag: 'PERSON' },
      { label: 'Full Name (Latin)', value: 'Tariq Abdulaziz Al-Mansouri', confidence: 99.4, tag: 'PERSON' },
      { label: 'Nationality', value: 'United Arab Emirates (UAE)', confidence: 98.9, tag: 'COUNTRY' },
      { label: 'Date of Birth', value: '15/09/1988', confidence: 99.3, tag: 'DATE' },
      { label: 'Sponsor / Company', value: 'Nexus AI Solutions L.L.C.', confidence: 98.7, tag: 'ORGANIZATION' },
      { label: 'Occupation', value: 'Senior Software Engineer', confidence: 99.0, tag: 'JOB_TITLE' },
      { label: 'Issue Date', value: '10/01/2026', confidence: 99.1, tag: 'DATE' },
      { label: 'Expiry Date', value: '09/01/2029', confidence: 99.5, tag: 'DATE' }
    ],
    table: {
      headers: ['الحقل (Field)', 'القيمة المستخرجة (Extracted Value)', 'مستوى الدقة (Confidence)'],
      rows: [
        ['رقم الهوية', '784-1988-3490125-9', '99.9%'],
        ['الاسم الكامل', 'طارق عبد العزيز المنصوري', '99.2%'],
        ['جهة العمل', 'شركة نكسس لحلول الذكاء الاصطناعي', '98.7%'],
        ['صلاحية البطاقة', 'حتى 09/01/2029', '99.5%']
      ]
    },
    translations: {
      en: `UNITED ARAB EMIRATES\nFEDERAL AUTHORITY FOR IDENTITY & CITIZENSHIP\n\nRESIDENT IDENTITY CARD\nIdentity No.: 784-1988-3490125-9\nFull Name: Tariq Abdulaziz Al-Mansouri\nNationality: United Arab Emirates (UAE)\nDate of Birth: 15/09/1988\nGender: Male\nPlace of Issue: Dubai\n\nSponsor / Employer: Nexus AI Solutions L.L.C.\nProfession: Senior Software Engineer\nIssue Date: 10/01/2026\nExpiry Date: 09/01/2029`,
      fr: `ÉMIRATS ARABES UNIS\nCARTE D'IDENTITÉ DE RÉSIDENT\nN° d'identité: 784-1988-3490125-9\nNom Complet: Tariq Abdulaziz Al-Mansouri\nNationalité: EAU\nEmployeur: Nexus AI Solutions S.A.R.L.\nProfession: Ingénieur Logiciel Senior\nDate d'expiration: 09/01/2029`
    }
  },
  {
    id: 'doc-tax-jp',
    title: 'Japanese Corporate Certificate & Tax Registration',
    language: 'Japanese (日本語)',
    langCode: 'ja',
    category: 'Tax & Legal',
    thumbnail: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80',
    confidenceScore: 99.3,
    processingTime: '0.45s',
    scriptType: 'CJK (Kanji / Hiragana / Katakana)',
    pageCount: 1,
    fileSize: '1.1 MB',
    summary: 'Tokyo Regional Taxation Bureau official corporate registration certificate with tax registration number and capital details.',
    rawText: `国税庁 東京国税局 渋谷税務署
法人番号指定通知書 兼 納税証明書
文書番号：東税渋第 2026-90184 号
発行日：令和8年 (2026年) 2月5日

【法人基本情報】
法人番号 (Corporate Number): 4011001099234
商号 (Company Name): ネクサステクノロジー株式会社 (Nexus Technology Co., Ltd.)
本店所在地: 東京都渋谷区神南一丁目19番11号 パークビルディング7階
代表取締役: 佐藤 健一 (Kenichi Sato)
設立年月日: 平成28年4月1日
資本金: 50,000,000 円

【事業内容】
1. 人工知能 (AI) 及び OCR テキスト抽出技術の研究開発
2. クラウドソフトウェアサービスの提供
3. 多言語自然言語処理 (NLP) ソリューションの提供

【税務申告状況 (直近年度)】
事業年度: 令和7年1月1日 〜 令和7年12月31日
課税標準額: 184,500,000 円
法人税納付額: 42,435,000 円
納税状況: 完納 (滞納なし - No Delinquency)

上記のとおり相違ないことを証明する。
東京国税局 渋谷税務署長 [公印]`,
    boxes: [
      { id: 'b1', text: '国税庁 東京国税局 渋谷税務署', confidence: 99.8, x: 8, y: 6, width: 50, height: 4, type: 'header' },
      { id: 'b2', text: '法人番号: 4011001099234', confidence: 99.9, x: 8, y: 18, width: 45, height: 4, type: 'entity' },
      { id: 'b3', text: 'ネクサステクノロジー株式会社', confidence: 99.5, x: 8, y: 24, width: 60, height: 4.5, type: 'entity' },
      { id: 'b4', text: '東京都渋谷区神南一丁目19番11号', confidence: 98.9, x: 8, y: 30, width: 70, height: 4, type: 'entity' },
      { id: 'b5', text: '代表取締役: 佐藤 健一', confidence: 99.4, x: 8, y: 36, width: 40, height: 4, type: 'entity' },
      { id: 'b6', text: '税務申告状況テーブル', confidence: 99.1, x: 8, y: 55, width: 84, height: 24, type: 'table' },
      { id: 'b7', text: '納税状況: 完納 (滞納なし)', confidence: 99.7, x: 8, y: 82, width: 40, height: 4, type: 'entity' }
    ],
    entities: [
      { label: 'Corporate Number (法人番号)', value: '4011001099234', confidence: 99.9, tag: 'COMPANY_ID' },
      { label: 'Company Name', value: 'ネクサステクノロジー株式会社 (Nexus Technology Co., Ltd.)', confidence: 99.5, tag: 'ORGANIZATION' },
      { label: 'Representative Director', value: '佐藤 健一 (Kenichi Sato)', confidence: 99.4, tag: 'PERSON' },
      { label: 'Registered Address', value: 'Tokyo, Shibuya-ku, Jinnan 1-19-11 Park Bldg 7F', confidence: 98.9, tag: 'LOCATION' },
      { label: 'Capital Stock', value: '¥ 50,000,000 JPY', confidence: 99.2, tag: 'MONEY' },
      { label: 'Taxable Income', value: '¥ 184,500,000 JPY', confidence: 99.1, tag: 'MONEY' },
      { label: 'Corporate Tax Paid', value: '¥ 42,435,000 JPY', confidence: 99.6, tag: 'MONEY' },
      { label: 'Tax Status', value: 'Fully Paid (No Delinquency)', confidence: 99.8, tag: 'STATUS' }
    ],
    table: {
      headers: ['項目 (Item)', '申告内容 (Tax Filing Details)', '確認ステータス (Status)'],
      rows: [
        ['事業年度 (Fiscal Year)', '2025/01/01 〜 2025/12/31', '確定済 (Confirmed)'],
        ['課税標準額 (Taxable Base)', '184,500,000 円', '適正 (Verified)'],
        ['法人税額 (Corporate Tax)', '42,435,000 円', '完納 (Paid in Full)'],
        ['滞納の有無 (Delinquencies)', '該当なし (None)', '優良 (Clear)']
      ]
    },
    translations: {
      en: `National Tax Agency, Tokyo Regional Taxation Bureau, Shibuya Tax Office\nNotification of Corporate Number & Tax Certificate\nDoc Number: T-Shibuya 2026-90184\nIssue Date: February 5, 2026 (Reiwa 8)\n\n【Corporate Information】\nCorporate Number: 4011001099234\nTrade Name: Nexus Technology Co., Ltd.\nHead Office: 7F Park Bldg, 1-19-11 Jinnan, Shibuya-ku, Tokyo\nRepresentative Director: Kenichi Sato\nCapital: 50,000,000 JPY\n\n【Tax Status】\nFiscal Year: Jan 1, 2025 - Dec 31, 2025\nTaxable Base: 184,500,000 JPY\nCorporate Tax Paid: 42,435,000 JPY\nTax Payment Status: Fully Paid (No Delinquencies)`,
      hi: `राष्ट्रीय कर एजेंसी, टोक्यो क्षेत्रीय कराधान ब्यूरो\nकॉर्पोरेट नंबर और कर प्रमाण पत्र\nकंपनी का नाम: नेक्सस टेक्नोलॉजी कंपनी लिमिटेड\nकॉर्पोरेट नंबर: 4011001099234\nपता: टोक्यो, शिबुया\nप्रतिनिधि निदेशक: केनिची सातो\nपूंजी: 50,000,000 जापानी येन\nकर भुगतान स्थिति: पूर्ण भुगतान (कोई बकाया नहीं)`
    }
  },
  {
    id: 'doc-realestate-es',
    title: 'Spanish Property Deed & Cadastral Registration',
    language: 'Spanish (Español)',
    langCode: 'es',
    category: 'Legal Contract',
    thumbnail: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
    confidenceScore: 99.6,
    processingTime: '0.41s',
    scriptType: 'Latin',
    pageCount: 1,
    fileSize: '1.3 MB',
    summary: 'Public deed of sale and property registration registered in Madrid Notarial College with Cadastral Reference.',
    rawText: `COLEGIO NOTARIAL DE MADRID
D. FERNANDO MARTÍNEZ RUIZ - NOTARIO DE MADRID
Calle de Serrano 45, 28001 Madrid | Protocolo Nº: 1.842 / 2026

ESCRITURA PÚBLICA DE COMPRAVENTA DE INMUEBLE

En Madrid, a diez de febrero de dos mil veintiséis (10/02/2026).
Ante mí, FERNANDO MARTÍNEZ RUIZ, Notario del Ilustre Colegio de Madrid.

COMPARECEN:
DE UNA PARTE, COMO PARTE VENDEDORA:
Doña Elena Gómez Navarro, mayor de edad, con N.I.F. 50.849.213-K, con domicilio en Paseo de la Castellana 112, Madrid.

DE OTRA PARTE, COMO PARTE COMPRADORA:
Don Carlos Mendoza Vega, mayor de edad, con N.I.F. 09.342.118-M, con domicilio en Calle Alcalá 88, Madrid.

DESCRIPCIÓN DEL INMUEBLE:
Finca urbana sita en Calle Velázquez nº 64, Planta 4ª, Puerta B, 28001 Madrid.
Superficie construida: 142,50 metros cuadrados.
Referencia Catastral: 9823401VK4792S0001TR
Inscripción: Registro de la Propiedad Nº 14 de Madrid, Tomo 3.412, Libro 890, Folio 145.

PRECIO Y FORMA DE PAGO:
El precio total pactado de la compraventa asciende a la cantidad de QUINIENTOS OCHENTA MIL EUROS (580.000,00 €), que la parte compradora abona en este acto mediante cheque bancario conformado nominativo emitido por Banco Santander.

Cargas y gravámenes: Libre de cargas y al corriente en el pago de tributos de IBI y comunidad de propietarios.`,
    boxes: [
      { id: 'b1', text: 'COLEGIO NOTARIAL DE MADRID', confidence: 99.9, x: 8, y: 5, width: 45, height: 4, type: 'header' },
      { id: 'b2', text: 'Protocolo Nº: 1.842 / 2026', confidence: 99.7, x: 55, y: 9, width: 35, height: 3.5, type: 'entity' },
      { id: 'b3', text: 'Vendedora: Elena Gómez Navarro (50.849.213-K)', confidence: 99.3, x: 8, y: 22, width: 80, height: 5, type: 'entity' },
      { id: 'b4', text: 'Comprador: Carlos Mendoza Vega (09.342.118-M)', confidence: 99.4, x: 8, y: 30, width: 80, height: 5, type: 'entity' },
      { id: 'b5', text: 'Referencia Catastral: 9823401VK4792S0001TR', confidence: 99.8, x: 8, y: 48, width: 65, height: 4, type: 'entity' },
      { id: 'b6', text: 'PRECIO TOTAL: 580.000,00 €', confidence: 99.9, x: 8, y: 64, width: 50, height: 4.5, type: 'value' }
    ],
    entities: [
      { label: 'Notary Public', value: 'Fernando Martínez Ruiz', confidence: 99.7, tag: 'OFFICIAL' },
      { label: 'Protocol Number', value: '1.842 / 2026', confidence: 99.7, tag: 'DEED_ID' },
      { label: 'Execution Date', value: '10/02/2026', confidence: 99.8, tag: 'DATE' },
      { label: 'Seller (Parte Vendedora)', value: 'Elena Gómez Navarro (NIF 50.849.213-K)', confidence: 99.3, tag: 'PERSON' },
      { label: 'Buyer (Parte Compradora)', value: 'Carlos Mendoza Vega (NIF 09.342.118-M)', confidence: 99.4, tag: 'PERSON' },
      { label: 'Property Address', value: 'Calle Velázquez 64, 4ºB, 28001 Madrid', confidence: 99.1, tag: 'LOCATION' },
      { label: 'Surface Area', value: '142.50 m²', confidence: 98.8, tag: 'DIMENSION' },
      { label: 'Cadastral Reference', value: '9823401VK4792S0001TR', confidence: 99.8, tag: 'PROPERTY_ID' },
      { label: 'Total Purchase Price', value: '€ 580,000.00 EUR', confidence: 99.9, tag: 'TOTAL' },
      { label: 'Payment Method', value: 'Certified Bank Cheque (Banco Santander)', confidence: 98.9, tag: 'PAYMENT_METHOD' }
    ],
    table: {
      headers: ['Cláusula', 'Detalle Registral', 'Verificación Legal'],
      rows: [
        ['Inmueble', 'Calle Velázquez 64, 4ºB, Madrid (142,50 m²)', 'Verificado Catastro'],
        ['Ref. Catastral', '9823401VK4792S0001TR', 'Vigente y Conforme'],
        ['Precio de Venta', '580.000,00 €', 'Abonado en Notaría'],
        ['Estado de Cargas', 'Libre de cargas / IBI al corriente', 'Certificado Acreditado']
      ]
    },
    translations: {
      en: `NOTARIAL COLLEGE OF MADRID\nFERNANDO MARTÍNEZ RUIZ - NOTARY OF MADRID\nProtocol No: 1,842 / 2026\n\nPUBLIC DEED OF PROPERTY SALE AND PURCHASE\nDate: February 10, 2026 in Madrid\n\nSeller: Elena Gómez Navarro (NIF 50.849.213-K)\nBuyer: Carlos Mendoza Vega (NIF 09.342.118-M)\n\nProperty: Urban estate located at Calle Velázquez No. 64, 4th Floor, Door B, 28001 Madrid.\nConstructed Surface: 142.50 sq meters.\nCadastral Reference: 9823401VK4792S0001TR\n\nAgreed Purchase Price: FIVE HUNDRED EIGHTY THOUSAND EUROS (€580,000.00), paid via certified bank cheque issued by Banco Santander.\nStatus: Free of liens and encumbrances.`,
      hi: `मैड्रिड का नोटरी कॉलेज\nअचल संपत्ति की खरीद और बिक्री का सार्वजनिक विलेख\nतिथि: 10 फरवरी 2026, मैड्रिड\n\nविक्रेता: एलेना गोमेज़ नवारो\nक्रेता: कार्लोस मेंडोज़ा वेगा\nसंपत्ति: कैले वेलाज़क्वेज़ 64, मैड्रिड (142.50 वर्ग मीटर)\nकुल खरीद मूल्य: € 580,000.00 यूरो (साढ़े पांच लाख अस्सी हजार यूरो)`
    }
  },
  {
    id: 'doc-bill-fr',
    title: 'French Global Logistics & Freight Waybill',
    language: 'French (Français)',
    langCode: 'fr',
    category: 'Logistics & Customs',
    thumbnail: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    confidenceScore: 99.5,
    processingTime: '0.38s',
    scriptType: 'Latin',
    pageCount: 1,
    fileSize: '1.0 MB',
    summary: 'Air freight waybill and customs declaration from Paris Charles de Gaulle to Singapore Hub.',
    rawText: `AIR FRANCE CARGO & LOGISTIQUE INTERNATIONALE
Aéroport Paris-Charles de Gaulle (CDG), Terminal Fret 2
RCS Paris B 420 491 823 | TVA Intracommunautaire: FR 82 420 491 823

LETTRE DE TRANSPORT AÉRIEN (AIR WAYBILL - LTA)
Numéro LTA: 057-9831-4028
Date d'émission: 11 Février 2026
Aéroport de départ: Paris CDG (France)
Aéroport de destination: Singapore Changi (SIN)

EXPÉDITEUR (Shipper):
Nexus Pharma Labs SAS
45 Avenue des Champs-Élysées
75008 Paris, France

DESTINATAIRE (Consignee):
Asia Pacific BioTech PTE LTD
10 Marina Boulevard, Tower 2
Singapore 018983

DÉTAILS DES MARCHANDISES:
Colis | Description | Poids Brut | Poids Vol. | Frais HT
04    | Réactifs de diagnostic médical | 185.00 kg | 210.00 kg | 1.950,00 €
02    | Capteurs thermiques calibrés   | 34.50 kg  | 40.00 kg  | 480,00 €
01    | Documentation & Douane        | 1.20 kg   | 2.00 kg   | 65,00 €

Sous-total Fret HT: 2.495,00 €
Surtaxe Carburant & Sécurité: 312,00 €
TVA (Exonérée Art. 262 I CGI): 0,00 €
TOTAL À PAYER: 2.807,00 €

Instructions de manutention: MAINTENIR ENTRE +2°C ET +8°C (Chaîne du froid stricte).`,
    boxes: [
      { id: 'b1', text: 'AIR FRANCE CARGO', confidence: 99.8, x: 8, y: 5, width: 40, height: 4, type: 'header' },
      { id: 'b2', text: 'LTA: 057-9831-4028', confidence: 99.9, x: 60, y: 12, width: 32, height: 4, type: 'entity' },
      { id: 'b3', text: 'Expéditeur: Nexus Pharma Labs SAS', confidence: 99.3, x: 8, y: 22, width: 40, height: 6, type: 'entity' },
      { id: 'b4', text: 'Destinataire: Asia Pacific BioTech PTE', confidence: 99.2, x: 52, y: 22, width: 42, height: 6, type: 'entity' },
      { id: 'b5', text: 'Tableau Marchandises (3 lignes)', confidence: 99.4, x: 8, y: 38, width: 85, height: 28, type: 'table' },
      { id: 'b6', text: 'TOTAL À PAYER: 2.807,00 €', confidence: 99.9, x: 55, y: 72, width: 38, height: 4, type: 'value' },
      { id: 'b7', text: 'Température: +2°C à +8°C', confidence: 99.0, x: 8, y: 84, width: 60, height: 4, type: 'entity' }
    ],
    entities: [
      { label: 'Carrier / Airline', value: 'Air France Cargo & Logistique', confidence: 99.8, tag: 'ORGANIZATION' },
      { label: 'Air Waybill (LTA)', value: '057-9831-4028', confidence: 99.9, tag: 'TRACKING_ID' },
      { label: 'Origin Airport', value: 'Paris CDG (France)', confidence: 99.6, tag: 'AIRPORT' },
      { label: 'Destination Airport', value: 'Singapore Changi (SIN)', confidence: 99.7, tag: 'AIRPORT' },
      { label: 'Shipper', value: 'Nexus Pharma Labs SAS (Paris)', confidence: 99.3, tag: 'CLIENT' },
      { label: 'Consignee', value: 'Asia Pacific BioTech PTE LTD (Singapore)', confidence: 99.2, tag: 'CLIENT' },
      { label: 'Gross Weight', value: '220.70 kg', confidence: 99.1, tag: 'WEIGHT' },
      { label: 'Freight Total', value: '€ 2,807.00 EUR', confidence: 99.9, tag: 'TOTAL' },
      { label: 'Temperature Control', value: 'Maintain +2°C to +8°C (Cold Chain)', confidence: 99.0, tag: 'SPECIAL_INSTRUCTION' }
    ],
    table: {
      headers: ['Colis (Pkgs)', 'Description des Marchandises', 'Poids Brut', 'Poids Vol.', 'Frais HT (€)'],
      rows: [
        ['04', 'Réactifs de diagnostic médical', '185.00 kg', '210.00 kg', '1.950,00 €'],
        ['02', 'Capteurs thermiques calibrés', '34.50 kg', '40.00 kg', '480,00 €'],
        ['01', 'Documentation & Douane', '1.20 kg', '2.00 kg', '65,00 €']
      ]
    },
    translations: {
      en: `AIR FRANCE CARGO & INTERNATIONAL LOGISTICS\nParis-Charles de Gaulle Airport (CDG), Freight Terminal 2\n\nAIR WAYBILL (AWB)\nAWB Number: 057-9831-4028\nIssue Date: Feb 11, 2026\nOrigin: Paris CDG | Destination: Singapore SIN\n\nShipper: Nexus Pharma Labs SAS, Paris\nConsignee: Asia Pacific BioTech PTE LTD, Singapore\n\nCargo Items:\n- 04 Pkgs | Medical diagnostic reagents | 185.00 kg | €1,950.00\n- 02 Pkgs | Calibrated thermal sensors | 34.50 kg | €480.00\n- 01 Pkgs | Documentation & customs | 1.20 kg | €65.00\n\nTotal Freight Cost: €2,807.00\nSpecial Handling: MAINTAIN BETWEEN +2°C AND +8°C (Strict cold chain).`,
      hi: `एयर फ्रांस कार्गो और अंतर्राष्ट्रीय रसद\nएयर वेबिल नंबर: 057-9831-4028\nमूल: पेरिस (CDG) | गंतव्य: सिंगापुर (SIN)\nप्रेषक: नेक्सस फार्मा लैब्स एसएएस\nकुल माल ढुलाई लागत: € 2,807.00 यूरो\nविशेष निर्देश: +2°C और +8°C के बीच तापमान बनाए रखें।`
    }
  }
];

export const SUPPORTED_LANGUAGES = [
  { code: 'auto', name: 'Auto-Detect Script & Language', flag: '🌐', script: 'Universal', active: true },
  { code: 'en', name: 'English', flag: '🇬🇧', script: 'Latin', active: true },
  { code: 'hi', name: 'Hindi (हिन्दी)', flag: '🇮🇳', script: 'Devanagari', active: true },
  { code: 'de', name: 'German (Deutsch)', flag: '🇩🇪', script: 'Latin', active: true },
  { code: 'es', name: 'Spanish (Español)', flag: '🇪🇸', script: 'Latin', active: true },
  { code: 'fr', name: 'French (Français)', flag: '🇫🇷', script: 'Latin', active: true },
  { code: 'ja', name: 'Japanese (日本語)', flag: '🇯🇵', script: 'CJK (Kanji/Kana)', active: true },
  { code: 'ar', name: 'Arabic (العربية)', flag: '🇦🇪', script: 'Arabic (RTL)', active: true },
  { code: 'zh', name: 'Chinese (中文 - 简体/繁體)', flag: '🇨🇳', script: 'CJK (Hanzi)', active: true },
  { code: 'ru', name: 'Russian (Русский)', flag: '🇷🇺', script: 'Cyrillic', active: true },
  { code: 'pt', name: 'Portuguese (Português)', flag: '🇵🇹', script: 'Latin', active: true },
  { code: 'it', name: 'Italian (Italiano)', flag: '🇮🇹', script: 'Latin', active: true },
  { code: 'ko', name: 'Korean (한국어)', flag: '🇰🇷', script: 'Hangul', active: true },
  { code: 'ta', name: 'Tamil (தமிழ்)', flag: '🇮🇳', script: 'Dravidian (Tamil)', active: true },
  { code: 'bn', name: 'Bengali (বাংলা)', flag: '🇧🇩', script: 'Bengali-Assamese', active: true },
  { code: 'mr', name: 'Marathi (मराठी)', flag: '🇮🇳', script: 'Devanagari', active: true },
  { code: 'te', name: 'Telugu (తెలుగు)', flag: '🇮🇳', script: 'Telugu', active: true },
  { code: 'tr', name: 'Turkish (Türkçe)', flag: '🇹🇷', script: 'Latin', active: true },
  { code: 'vi', name: 'Vietnamese (Tiếng Việt)', flag: '🇻🇳', script: 'Latin (Diacritics)', active: true },
  { code: 'nl', name: 'Dutch (Nederlands)', flag: '🇳🇱', script: 'Latin', active: true },
  { code: 'pl', name: 'Polish (Polski)', flag: '🇵🇱', script: 'Latin', active: true },
  { code: 'th', name: 'Thai (ไทย)', flag: '🇹🇭', script: 'Thai', active: true },
  { code: 'id', name: 'Indonesian (Bahasa)', flag: '🇮🇩', script: 'Latin', active: true },
  { code: 'el', name: 'Greek (Ελληνικά)', flag: '🇬🇷', script: 'Greek', active: true },
  { code: 'he', name: 'Hebrew (עברית)', flag: '🇮🇱', script: 'Hebrew (RTL)', active: true }
];

export const OCR_PIPELINE_STAGES = [
  { id: 'preprocess', name: 'Pre-processing & Enhancement', desc: 'Binarization, Deskewing, Noise Reduction, Contrast Equalization', time: '45ms' },
  { id: 'layout', name: 'Layout & Geometry Analysis', desc: 'Neural Region Detection, Column/Paragraph segmentation, Table grid discovery', time: '120ms' },
  { id: 'multilingual_ocr', name: 'Multilingual Script OCR', desc: 'Deep Transformer Recognition across 100+ scripts with character confidence heatmaps', time: '180ms' },
  { id: 'ner_extraction', name: 'Entity & Key-Value Parsing', desc: 'Semantic extraction of Names, Dates, Totals, Tax IDs, Addresses, Line items', time: '65ms' },
  { id: 'translation', name: 'Neural Machine Translation', desc: 'Context-aware multilingual translation into 30+ international languages', time: '90ms' }
];

export const EXTRACTION_HISTORY_SEED = [
  {
    id: 'hist-101',
    fileName: 'Munich_BerlinEng_Invoice_Feb2026.pdf',
    docType: 'Invoice',
    language: 'German (de)',
    confidence: 99.4,
    entitiesCount: 10,
    tableRows: 4,
    status: 'COMPLETED',
    timestamp: '10 minutes ago',
    size: '1.2 MB'
  },
  {
    id: 'hist-102',
    fileName: 'Apollo_Delhi_DischargeSummary.jpg',
    docType: 'Medical Summary',
    language: 'Hindi (hi)',
    confidence: 98.9,
    entitiesCount: 9,
    tableRows: 3,
    status: 'COMPLETED',
    timestamp: '42 minutes ago',
    size: '1.4 MB'
  },
  {
    id: 'hist-103',
    fileName: 'Emirates_Resident_ID_Card.png',
    docType: 'National ID',
    language: 'Arabic (ar)',
    confidence: 99.1,
    entitiesCount: 9,
    tableRows: 4,
    status: 'COMPLETED',
    timestamp: '2 hours ago',
    size: '950 KB'
  },
  {
    id: 'hist-104',
    fileName: 'Tokyo_Corporate_Tax_Record.pdf',
    docType: 'Tax Form',
    language: 'Japanese (ja)',
    confidence: 99.3,
    entitiesCount: 8,
    tableRows: 4,
    status: 'COMPLETED',
    timestamp: '5 hours ago',
    size: '1.1 MB'
  },
  {
    id: 'hist-105',
    fileName: 'Madrid_Notarial_Deed_Velazquez.pdf',
    docType: 'Real Estate Deed',
    language: 'Spanish (es)',
    confidence: 99.6,
    entitiesCount: 10,
    tableRows: 4,
    status: 'COMPLETED',
    timestamp: '1 day ago',
    size: '1.3 MB'
  }
];
