import { Language } from '@/types';

const translations: Record<string, Record<Language, string>> = {
  'app.name': { en: 'Namma Samasye', kn: 'ನಮ್ಮ ಸಮಸ್ಯೆ', hi: 'नम्मा समस्ये', te: 'నమ్మ సమస్యే' },
  'app.tagline': { en: 'Whatever the problem, just tell us.', kn: 'ಸಮಸ್ಯೆ ಏನೇ ಇರಲಿ, ಹೇಳಿ.', hi: 'समस्या कोई भी हो, बस हमें बताएं।', te: 'సమస్య ఏదైనా, మాకు చెప్పండి.' },
  'app.description': { en: 'An anonymous citizen assistant for everyday problems in Bengaluru.', kn: 'ಬೆಂಗಳೂರಿನ ದೈನಂದಿನ ಸಮಸ್ಯೆಗಳಿಗೆ ಅನಾಮಧ್ಯ ನಾಗರಿಕ ಸಹಾಯಕ.', hi: 'बेंगलुरु में रोज़मर्रा की समस्याओं के लिए एक गुमनार नागरिक सहायक।', te: 'బెంగళూరులోని రోజువారీ సమస్యల కోసం అనామక పౌర సహాయకుడు.' },
  'btn.start_anonymous': { en: 'Start Anonymously', kn: 'ಅನಾಮಧ್ಯವಾಗಿ ಪ್ರಾರಂಭಿಸಿ', hi: 'गुमनार शुरू करें', te: 'అనామకంగా ప్రారంభించండి' },
  'btn.explore': { en: 'Explore', kn: 'ಅನ್ವೇಷಿಸಿ', hi: 'खोजें', te: 'అన్వేషించండి' },
  'btn.talk': { en: '🎤 Talk', kn: '🎤 ಮಾತನಾಡಿ', hi: '🎤 बोलें', te: '🎤 మాట్లాడండి' },
  'btn.type': { en: '⌨️ Type', kn: '⌨️ ಟೈಪ್ ಮಾಡಿ', hi: '⌨️ टाइप करें', te: '⌨️ టైప్ చేయండి' },
  'bot.greeting': { en: "Hi! I'm Namma Samasye. How can I help you today?", kn: 'ನಮಸ್ಕಾರ! ನಾನು ನಮ್ಮ ಸಮಸ್ಯೆ. ಇಂದು ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?', hi: 'नमस्ते! मैं नम्मा समस्ये हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ?', te: 'నమస్కారం! నేను నమ్మ సమస్యేను. ఈ రోజు నేను ఎలా సహాయం చేయగలను?' },
  'bot.ask_what_happened': { en: 'Tell me what happened in your own words.', kn: 'ನಿಮ್ಮದೇ ಮಾತುಗಳಲ್ಲಿ ಏನಾಯಿತು ಎಂದು ಹೇಳಿ.', hi: 'अपने शब्दों में बताएं कि क्या हुआ।', te: 'మీ స్వంత మాటల్లో ఏమి జరిగిందో చెప్పండి.' },
  'bot.scenario_match': { en: 'Scenario similarity', kn: 'ಸನ್ನಿವೇಶ ಸಾಮ್ಯತೆ', hi: 'परिदृश्य समानता', te: 'సన్నివేశ సారూప్యత' },
  'bot.disclaimer': { en: 'Scenario similarity, not a legal determination.', kn: 'ಸನ್ನಿವೇಶ ಸಾಮ್ಯತೆ, ಕಾನೂನು ನಿರ್ಧಾರವಲ್ಲ.', hi: 'परिदृश्य समानता, कानूनी निर्णय नहीं।', te: 'సన్నివేశ సారూప్యత, చట్టపరమైన నిర్ణయం కాదు.' },
  'bot.review_before_submit': { en: 'Please review your information before submitting.', kn: 'ದಯವಿಟ್ಟು ಸಲ್ಲಿಸುವ ಮೊದಲು ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.', hi: 'कृपया सबमिट करने से पहले अपनी जानकारी की समीक्षा करें।', te: 'దయచేసి సమర్పించడానికి ముందు మీ సమాచారాన్ని సమీక్షించండి.' },
  'bot.report_created': { en: 'Your incident report has been created.', kn: 'ನಿಮ್ಮ ಘಟನೆ ವರದಿ ರಚಿಸಲಾಗಿದೆ.', hi: 'आपकी घटना रिपोर्ट बन गई है।', te: 'మీ సంఘటన నివేదిక సృష్టించబడింది.' },
  'bot.track_id': { en: 'Your Incident ID', kn: 'ನಿಮ್ಮ ಘಟನೆ ಐಡಿ', hi: 'आपकी घटना आईडी', te: 'మీ సంఘటన ఐడి' },
  'bot.no_evidence': { en: "I don't have evidence.", kn: 'ನನಗೆ ಸಾಕ್ಷ್ಯ ಇಲ್ಲ.', hi: 'मेरे पास सबूत नहीं है।', te: 'నా వద్ద సాక్ష్యం లేదు.' },
  'bot.try_again': { en: "I didn't understand that clearly. Please try again or type it.", kn: 'ನಾನು ಅದನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.', hi: 'मैं इसे स्पष्ट रूप से नहीं समझा। कृपया फिर से प्रयास करें या टाइप करें।', te: 'నేను దానిని స్పష్టంగా అర్థం చేసుకోలేకపోయాను. దయచేసి మళ్ళీ ప్రయత్నించండి లేదా టైప్ చేయండి.' },
  'disclaimer.main': { en: 'Namma Samasye helps citizens document and navigate reported incidents. It does not replace emergency services, police, legal professionals, or official government channels.', kn: 'ನಮ್ಮ ಸಮಸ್ಯೆ ನಾಗರಿಕರಿಗೆ ವರದಿ ಮಾಡಿದ ಘಟನೆಗಳನ್ನು ದಾಖಲಿಸಲು ಮತ್ತು ನಿರ್ವಹಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ. ಇದು ತುರ್ತು ಸೇವೆಗಳು, ಪೊಲೀಸರು, ಕಾನೂನು ವೃತ್ತಿಪರರು ಅಥವಾ ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಚಾನೆಲ್‌ಗಳನ್ನು ಬದಲಾಯಿಸುವುದಿಲ್ಲ.', hi: 'नम्मा समस्ये नागरिकों को रिपोर्ट की गई घटनाओं का दस्तावेज़ीकरण और प्रबंधन करने में मदद करता है। यह आपातकालीन सेवाओं, पुलिस, कानूनी पेशेवरों, या आधिकारिक सरकारी चैनलों का विकल्प नहीं है।', te: 'నమ్మ సమస్యే పౌరులకు నివేదించబడిన సంఘటనలను డాక్యుమెంట్ చేయడంలో మరియు నావిగేట్ చేయడంలో సహాయపడుతుంది. ఇది అత్యవసర సేవలు, పోలీసులు, న్యాయ నిపుణులు లేదా అధికారిక ప్రభుత్వ ఛానెల్‌లను భర్తీ చేయదు.' },
  'safety.emergency': { en: 'If you are in immediate danger, please call emergency services: 112', kn: 'ನೀವು ತಕ್ಷಣದ ಅಪಾಯದಲ್ಲಿದ್ದರೆ, ದಯವಿಟ್ಟು ತುರ್ತು ಸೇವೆಗಳನ್ನು ಕರೆಯಿರಿ: 112', hi: 'यदि आप तुरंत खतरे में हैं, तो कृपया आपातकालीन सेवाओं को कॉल करें: 112', te: 'మీరు వెంటనే ప్రమాదంలో ఉంటే, దయచేసి అత్యవసర సేవలను కాల్ చేయండి: 112' },
  'nav.report': { en: 'Report something', kn: 'ಏನನ್ನಾದರೂ ವರದಿ ಮಾಡಿ', hi: 'कुछ रिपोर्ट करें', te: 'ఏదైనా నివేదించండి' },
  'nav.track': { en: 'Track incident', kn: 'ಘಟನೆ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ', hi: 'घटना ट्रैक करें', te: 'సంఘటనను ట్రాక్ చేయండి' },
  'nav.community': { en: 'Community issues', kn: 'ಸಮುದಾಯ ಸಮಸ್ಯೆಗಳು', hi: 'सामुदायिक समस्याएँ', te: 'సమాజ సమస్యలు' },
  'nav.resources': { en: 'Find official resource', kn: 'ಅಧಿಕೃತ ಸಂಪನ್ಮೂಲ ಹುಡುಕಿ', hi: 'आधिकारिक संसाधन खोजें', te: 'అధికారిక వనరును కనుగొనండి' },
  'nav.privacy': { en: 'Privacy', kn: 'ಗೌಪ್ಯತೆ', hi: 'गोपनीयता', te: 'గోప్యత' },
  'community.pulse': { en: 'Bengaluru Civic Pulse', kn: 'ಬೆಂಗಳೂರು ನಾಗರಿಕ ಪಲ್ಸ್', hi: 'बेंगलुरु सिविक पल्स', te: 'బెంగళూరు సివిక్ పల్స్' },
  'community.disclaimer': { en: 'These are community reports and do not establish wrongdoing.', kn: 'ಇವು ಸಮುದಾಯ ವರದಿಗಳು ಮತ್ತು ತಪ್ಪು ನಿರ್ಧಾರವನ್ನು ಸ್ಥಾಪಿಸುವುದಿಲ್ಲ.', hi: 'ये सामुदायिक रिपोर्टें हैं और गलत काम स्थापित नहीं करतीं।', te: 'ఇవి సమాజ నివేదికలు మరియు తప్పును నిర్ధారించవు.' },
  'evidence.warning': { en: 'Make sure your evidence sharing permissions are appropriate before submitting. Avoid sharing unnecessary personal information.', kn: 'ಸಲ್ಲಿಸುವ ಮೊದಲು ನಿಮ್ಮ ಸಾಕ್ಷ್ಯ ಹಂಚಿಕೆ ಅನುಮತಿಗಳು ಸೂಕ್ತವಾಗಿವೆ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ. ಅನಗತ್ಯ ವೈಯಕ್ತಿಕ ಮಾಹಿತಿಯನ್ನು ಹಂಚಿಕೊಳ್ಳುವುದನ್ನು ತಪ್ಪಿಸಿ.', hi: 'सबमिट करने से पहले सुनिश्चित करें कि आपकी सबूत साझा करने की अनुमतियाँ उपयुक्त हैं। अनावश्यक व्यक्तिगत जानकारी साझा करने से बचें।', te: 'సమర్పించడానికి ముందు మీ సాక్ష్యం షేరింగ్ అనుమతులు తగినవిగా ఉన్నాయని నిర్ధారించుకోండి. అనవసరమైన వ్యక్తిగత సమాచారాన్ని షేర్ చేయడం మానుకోండి.' },
  'status.NEW': { en: 'New', kn: 'ಹೊಸ', hi: 'नया', te: 'కొత్త' },
  'status.UNDER_REVIEW': { en: 'Under Review', kn: 'ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ', hi: 'समीक्षाधीन', te: 'సమీక్షలో' },
  'status.MISSING_INFORMATION': { en: 'Missing Information', kn: 'ಮಾಹಿತಿ ಕೊರತೆ', hi: 'जानकारी अधूरी', te: 'సమాచారం లోపించింది' },
  'status.ON_HOLD': { en: 'On Hold', kn: 'ಹಿಡಿದಿಟ್ಟಿದೆ', hi: 'रोक पर', te: 'పట్టుకొని ఉంది' },
  'status.PROCEEDING': { en: 'Proceeding', kn: 'ಮುಂದುವರಿಯುತ್ತಿದೆ', hi: 'आगे बढ़ रहा है', te: 'ముందుకు సాగుతోంది' },
  'status.INVALID': { en: 'Invalid', kn: 'ಅಮಾನ್ಯ', hi: 'अमान्य', te: 'చెల్లదు' },
  'status.CLOSED': { en: 'Closed', kn: 'ಮುಚ್ಚಲಾಗಿದೆ', hi: 'बंद', te: 'మూసివేయబడింది' },
  'status.RESOLVED': { en: 'Resolved', kn: 'ಪರಿಹರಿಸಲಾಗಿದೆ', hi: 'हल हो गया', te: 'పరిష్కరించబడింది' },
};

export function t(key: string, lang: Language): string {
  return translations[key]?.[lang] || translations[key]?.['en'] || key;
}

export function getTranslations(lang: Language): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, values] of Object.entries(translations)) {
    result[key] = values[lang] || values['en'];
  }
  return result;
}
