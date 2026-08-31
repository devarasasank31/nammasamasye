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

  // Home page
  'home.report_now': { en: 'Report Now', kn: 'ಈಗಲೇ ವರದಿ ಮಾಡಿ', hi: 'अभी रिपोर्ट करें', te: 'ఇప్పుడు నివేదించండి' },
  'home.track_now': { en: 'Track My Reports', kn: 'ನನ್ನ ವರದಿಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ', hi: 'मेरी रिपोर्ट ट्रैक करें', te: 'నా నివేదికలను ట్రాక్ చేయండి' },
  'home.community': { en: 'Community Pulse', kn: 'ಸಮುದಾಯ ಪಲ್ಸ್', hi: 'सामुदायिक पल्स', te: 'సమాజ పల్స్' },
  'home.resources': { en: 'Official Resources', kn: 'ಅಧಿಕೃತ ಸಂಪನ್ಮೂಲಗಳು', hi: 'आधिकारिक संसाधन', te: 'అధికారిక వనరులు' },
  'home.safety': { en: 'Emergency Contacts', kn: 'ತುರ್ತು ಸಂಪರ್ಕಗಳು', hi: 'आपातकालीन संपर्क', te: 'అత్యవసర సంప్రదింపులు' },

  // Report page
  'report.title': { en: 'Report Incident', kn: 'ಘಟನೆ ವರದಿ', hi: 'घटना रिपोर्ट', te: 'సంఘఠన నివేదిక' },
  'report.evidence_guide': { en: 'How to share a link?', kn: 'ಲಿಂಕ್ ಹಂಚಿಕೊಳ್ಳುವುದು ಹೇಗೆ?', hi: 'लिंक कैसे साझा करें?', te: 'లింక్ ఎలా షేర్ చేయాలి?' },
  'report.no_evidence': { en: "I don't have evidence", kn: 'ನನಗೆ ಸಾಕ್ಷ್ಯ ಇಲ್ಲ', hi: 'मेरे पास सबूत नहीं है', te: 'నా వద్ద సాక్ష్యం లేదు' },
  'report.skip': { en: 'Skip for now →', kn: 'ಈಗ ಬಿಟ್ಟುಬಿಡಿ →', hi: 'अभी छोड़ें →', te: 'ఇప్పుడు దాటవేయండి →' },
  'report.submit': { en: 'Submit Report', kn: 'ವರದಿ ಸಲ್ಲಿಸಿ', hi: 'रिपोर्ट सबमिट करें', te: 'నివేదిక సమర్పించండి' },
  'report.review': { en: 'Review Your Report', kn: 'ನಿಮ್ಮ ವರದಿಯನ್ನು ಪರಿಶೀಲಿಸಿ', hi: 'अपनी रिपोर्ट की समीक्षा करें', te: 'మీ నివేదికను సమీక్షించండి' },
  'report.category': { en: 'Category', kn: 'ವರ್ಗ', hi: 'श्रेणी', te: 'వర్గం' },
  'report.description': { en: 'Description', kn: 'ವಿವರಣೆ', hi: 'विवरण', te: 'వివరణ' },
  'report.location': { en: 'Location', kn: 'ಸ್ಥಳ', hi: 'स्थान', te: 'ప్రదేశం' },
  'report.track_incident': { en: 'Track This Incident', kn: 'ಈ ಘಟನೆಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ', hi: 'इस घटना को ट्रैक करें', te: 'ఈ సంఘటనను ట్రాక్ చేయండి' },
  'report.report_submitted': { en: 'Report Submitted', kn: 'ವರದಿ ಸಲ್ಲಿಸಲಾಗಿದೆ', hi: 'रिपोर्ट सबमिट हो गई', te: 'నివేదిక సమర్పించబడింది' },
  'report.save_id': { en: 'Save this ID to track your report', kn: 'ವರದಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಈ ಐಡಿ ಉಳಿಸಿ', hi: 'रिपोर्ट ट्रैक करने के लिए यह आईडी सेव करें', te: 'నివేదికను ట్రాక్ చేయడానికి ఈ ఐడిని సేవ్ చేయండి' },

  // Tracking page
  'track.title': { en: 'My Incidents', kn: 'ನನ್ನ ಘಟನೆಗಳು', hi: 'मेरी घटनाएँ', te: 'నా సంఘటనలు' },
  'track.search': { en: 'Search', kn: 'ಹುಡುಕಿ', hi: 'खोजें', te: 'వెతకండి' },
  'track.search_placeholder': { en: 'Search by Incident ID (e.g., NS-8F42K)', kn: 'ಘಟನೆ ಐಡಿಯಿಂದ ಹುಡುಕಿ (ಉದಾ., NS-8F42K)', hi: 'घटना आईडी से खोजें (जैसे, NS-8F42K)', te: 'సంఘటన ఐడి ద్వారా వెతకండి (ఉదా., NS-8F42K)' },
  'track.your_report': { en: 'Your report:', kn: 'ನಿಮ್ಮ ವರದಿ:', hi: 'आपकी रिपोर्ट:', te: 'మీ నివేదిక:' },
  'track.admin_notes': { en: 'Updates from Admin', kn: 'ಅಡ್ಮಿನ್‌ನಿಂದ ನವೀಕರಣಗಳು', hi: 'अडमिन से अपडेट', te: 'అడ్మిన్ నుండి నవీకరణలు' },
  'track.admin_note': { en: 'Admin Note', kn: 'ಅಡ್ಮಿನ್ ಟಿಪ್ಪಣಿ', hi: 'अडमिन नोट', te: 'అడ్మిన్ నోట్' },
  'track.new_update': { en: 'New update', kn: 'ಹೊಸ ನವೀಕರಣ', hi: 'नया अपडेट', te: 'కొత్త నవీకరణ' },
  'track.admin_left_note': { en: 'Admin has left a note', kn: 'ಅಡ್ಮಿನ್ ಟಿಪ್ಪಣಿ ಬಿಟ್ಟಿದ್ದಾರೆ', hi: 'अडमिन ने नोट छोड़ा है', te: 'అడ్మిన్ నోట్ వదిలారు' },
  'track.back': { en: '← Back to all incidents', kn: '← ಎಲ್ಲಾ ಘಟನೆಗಳಿಗೆ ಹಿಂತಿರುಗಿ', hi: '← सभी घटनाओं पर वापस', te: '← అన్ని సంఘటనలకు తిరిగి' },
  'track.no_incidents': { en: 'No incidents yet. Start by reporting something.', kn: 'ಇನ್ನೂ ಯಾವುದೇ ಘಟನೆಗಳಿಲ್ಲ. ಏನನ್ನಾದರೂ ವರದಿ ಮಾಡಿ.', hi: 'अभी तक कोई घटना नहीं। कुछ रिपोर्ट करके शुरू करें।', te: 'ఇంకా సంఘటనలు లేవు. ఏదైనా నివేదించడం ద్వారా ప్రారంభించండి.' },
  'track.report_something': { en: 'Report Something', kn: 'ಏನನ್ನಾದರೂ ವರದಿ ಮಾಡಿ', hi: 'कुछ रिपोर्ट करें', te: 'ఏదైనా నివేదించండి' },

  // Evidence
  'evidence.add': { en: 'Add Your Evidence', kn: 'ನಿಮ್ಮ ಸಾಕ್ಷ್ಯ ಸೇರಿಸಿ', hi: 'अपना सबूत जोड़ें', te: 'మీ సాక్ష్యం జోడించండి' },
  'evidence.paste_link': { en: 'Paste a link to any of these below:', kn: 'ಇವುಗಳಿಗೆ ಲಿಂಕ್ ಅಂಟಿಸಿ:', hi: 'इनमें से किसी का लिंक पेस्ट करें:', te: 'వీటిలో దేనికైనా లింక్ పేస్ట్ చేయండి:' },
  'evidence.photo': { en: 'Photo', kn: 'ಫೋಟೋ', hi: 'फ़ोटो', te: 'ఫోటో' },
  'evidence.video': { en: 'Video', kn: 'ವೀಡಿಯೋ', hi: 'वीडियो', te: 'వీడియో' },
  'evidence.document': { en: 'Document', kn: 'ಡಾಕ್ಯುಮೆಂಟ್', hi: 'दस्तावेज़', te: 'పత్రం' },
  'evidence.geo_tip': { en: 'Tip: Add Geo Location', kn: 'ಸಲಹೆ: ಭೌಗೋಳಿಕ ಸ್ಥಳ ಸೇರಿಸಿ', hi: 'सुझाव: जियो लोकेशन जोड़ें', te: 'సూచన: జియో లొకేషన్ జోడించండి' },
  'evidence.geo_desc': { en: 'Photos with location are more helpful — they show where, when, and what time.', kn: 'ಸ್ಥಳವಿರುವ ಫೋಟೋಗಳು ಹೆಚ್ಚು ಸಹಾಯಕವಾಗಿವೆ — ಎಲ್ಲಿ, ಯಾವಾಗ, ಯಾವ ಸಮಯ ತೋರಿಸುತ್ತವೆ.', hi: 'लोकेशन वाली फ़ोटो ज़्यादा मददगार होती हैं — ये दिखाती हैं कि कहाँ, कब, और किस समय।', te: 'లొకేషన్ ఉన్న ఫోటోలు ఎక్కువ సహాయకరంగా ఉంటాయి — ఎక్కడ, ఎప్పుడు, ఏ సమయం చూపిస్తాయి.' },
  'evidence.invalid_link': { en: '❌ Invalid link format.\n\nPlease use one of these:\n📸 Google Drive\n🎥 YouTube\n📷 Imgur\n📁 Dropbox\n📤 OneDrive\n\nPaste a valid evidence link.', kn: '❌ ಅಮಾನ್ಯ ಲಿಂಕ್ ಫಾರ್ಮ್ಯಾಟ್.\n\nದಯವಿಟ್ಟು ಇವುಗಳಲ್ಲಿ ಒಂದನ್ನು ಬಳಸಿ:\n📸 Google Drive\n🎥 YouTube\n📷 Imgur\n📁 Dropbox\n📤 OneDrive\n\nಅಮಾನ್ಯ ಸಾಕ್ಷ್ಯ ಲಿಂಕ್ ಅಂಟಿಸಿ.', hi: '❌ अमान्य लिंक प्रारूप।\n\nकृपया इनमें से किसी का उपयोग करें:\n📸 Google Drive\n🎥 YouTube\n📷 Imgur\n📁 Dropbox\n📤 OneDrive\n\nमान्य सबूत लिंक पेस्ट करें।', te: '❌ చెల్లని లింక్ ఫార్మాట్.\n\nదయచేసి వీటిలో ఒకదాన్ని ఉపయోగించండి:\n📸 Google Drive\n🎥 YouTube\n📷 Imgur\n📁 Dropbox\n📤 OneDrive\n\nచెల్లుబాటు అయ్యే సాక్ష్య లింక్ పేస్ట్ చేయండి.' },
  'evidence.link_added': { en: '✅ Evidence link added!\n\nYou can add more links or continue.', kn: '✅ ಸಾಕ್ಷ್ಯ ಲಿಂಕ್ ಸೇರಿಸಲಾಗಿದೆ!\n\nನೀವು ಹೆಚ್ಚಿನ ಲಿಂಕ್‌ಗಳನ್ನು ಸೇರಿಸಬಹುದು ಅಥವಾ ಮುಂದುವರಿಯಬಹುದು.', hi: '✅ सबूत लिंक जोड़ दिया!\n\nआप और लिंक जोड़ सकते हैं या आगे बढ़ सकते हैं।', te: '✅ సాక్ష్య లింక్ జోడించబడింది!\n\nమీరు మరిన్ని లింక్‌లు జోడించవచ్చు లేదా కొనసాగించవచ్చు.' },

  // Language names
  'lang.kn': { en: 'Kannada', kn: 'ಕನ್ನಡ', hi: 'कन्नड़', te: 'కన్నడ' },
  'lang.en': { en: 'English', kn: 'ಇಂಗ್ಲಿಷ್', hi: 'अंग्रेज़ी', te: 'ఆంగ్లం' },
  'lang.hi': { en: 'Hindi', kn: 'ಹಿಂದಿ', hi: 'हिन्दी', te: 'హిందీ' },
  'lang.te': { en: 'Telugu', kn: 'ತೆಲುಗು', hi: 'तेलुगु', te: 'తెలుగు' },
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
