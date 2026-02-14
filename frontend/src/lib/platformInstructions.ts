export type Platform =
  | 'whatsapp_mobile'
  | 'whatsapp_desktop'
  | 'telegram'
  | 'imessage'
  | 'instagram'
  | 'messenger'
  | 'snapchat'
  | 'android_sms';

export type AnalysisFocus =
  | 'romantic_relationship'
  | 'personality_communication'
  | 'just_for_fun';

export interface PlatformInfo {
  id: Platform;
  name: string;
  icon: string; // emoji or icon identifier
  description: string;
  exportInstructions: {
    title: string;
    steps: string[];
    notes?: string[];
    timeEstimate?: string;
  };
}

export interface AnalysisFocusInfo {
  id: AnalysisFocus;
  name: string;
  icon: string;
  description: string;
  includes: string[];
}

export const PLATFORMS: Record<Platform, PlatformInfo> = {
  whatsapp_mobile: {
    id: 'whatsapp_mobile',
    name: 'WhatsApp Mobile',
    icon: '💬',
    description: 'Export chat from your WhatsApp mobile app',
    exportInstructions: {
      title: 'Export WhatsApp Chat (Mobile)',
      steps: [
        'Open the chat you want to export in WhatsApp',
        'Tap the three-dot menu (⋮) in the top-right corner',
        'Select "More" → "Export Chat"',
        'Choose "Without Media" (important for privacy and faster processing)',
        'Select a sharing method (Email, Google Drive, or any messaging app)',
        'Send or save the exported .txt file'
      ],
      notes: [
        'You can export up to 40,000 messages without media',
        'The export will be a .txt file, sometimes bundled in a .zip',
        'Exported chats cannot be re-imported into WhatsApp'
      ],
      timeEstimate: '2-3 minutes'
    }
  },
  whatsapp_desktop: {
    id: 'whatsapp_desktop',
    name: 'WhatsApp Web/Desktop',
    icon: '💻',
    description: 'Export chat from WhatsApp Web or Desktop app',
    exportInstructions: {
      title: 'Export WhatsApp Chat (Web/Desktop)',
      steps: [
        'Open WhatsApp Web (web.whatsapp.com) or WhatsApp Desktop app',
        'Click on the chat you want to export',
        'Click the three-dot menu (⋮) at the top of the chat',
        'Select "More" → "Export Chat"',
        'Choose "Without Media"',
        'Save the .txt file to your computer'
      ],
      notes: [
        'Faster than mobile export for large conversations',
        'File saves directly to your Downloads folder'
      ],
      timeEstimate: '1-2 minutes'
    }
  },
  telegram: {
    id: 'telegram',
    name: 'Telegram',
    icon: '✈️',
    description: 'Analyze messages from your Telegram chats',
    exportInstructions: {
      title: 'Export Telegram Chat',
      steps: [
        'Download and install Telegram Desktop (desktop.telegram.org)',
        'Open the chat you want to export',
        'Click the three-dot menu (⋮) in the upper-right corner',
        'Select "Export Chat History"',
        'Choose what to include (uncheck all media types for faster export)',
        'Select format: Choose "HTML" for easy reading',
        'Choose destination folder and click "Export"'
      ],
      notes: [
        'Export ONLY works on Telegram Desktop, not mobile',
        'Secret chats cannot be exported (they\'re device-only)',
        'You can also export all chats at once via Settings → Advanced → Export Telegram Data'
      ],
      timeEstimate: '3-5 minutes'
    }
  },
  imessage: {
    id: 'imessage',
    name: 'iMessage',
    icon: '💙',
    description: 'Analyze messages from your iPhone Messages app',
    exportInstructions: {
      title: 'Export iMessage Conversation',
      steps: [
        'Method 1 (Mac Required): Open Messages app on your Mac',
        'Select the conversation you want to export',
        'Press Command + A to select all messages',
        'Press Command + C to copy',
        'Open TextEdit or Notes and paste (Command + V)',
        'Save as a .txt file',
        '',
        'Method 2 (iPhone Only): Open Messages app on iPhone',
        'Long-press a message → tap "More..."',
        'Select all messages you want (tap multiple)',
        'Tap the Share icon → choose "Mail"',
        'Email the messages to yourself as a .txt file'
      ],
      notes: [
        'iOS doesn\'t have a direct export feature',
        'For large conversations, using a Mac is much faster',
        'Third-party tools like iMazing can export to PDF/Excel (paid)'
      ],
      timeEstimate: '5-10 minutes'
    }
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    description: 'Analyze messages from your Instagram DMs',
    exportInstructions: {
      title: 'Export Instagram Direct Messages',
      steps: [
        'Open Instagram app or website',
        'Go to Settings → Accounts Center',
        'Select "Your Information and Permissions"',
        'Tap "Download Your Information"',
        'Select your Instagram account',
        'Tap "Request Download" → "Some of your information"',
        'Select "Messages" only → tap "Next"',
        'Choose format: JSON, and Date range: All time',
        'Submit request and wait for email notification (24-48 hours)',
        'Download the .zip file from the email link',
        'Extract the folder and find "messages.json"'
      ],
      notes: [
        'This is Instagram\'s official export tool',
        'You\'ll receive an email when data is ready (usually <48 hours)',
        'The file will be in JSON format (we\'ll handle the conversion)'
      ],
      timeEstimate: '2 minutes setup, then 24-48 hour wait'
    }
  },
  messenger: {
    id: 'messenger',
    name: 'Messenger',
    icon: '💬',
    description: 'Analyze messages from Facebook Messenger',
    exportInstructions: {
      title: 'Export Facebook Messenger Chat',
      steps: [
        'Log in to Facebook on desktop (facebook.com)',
        'Click your profile picture → Settings & Privacy → Settings',
        'From the left menu, select "Your Facebook Information"',
        'Click "Download Your Information"',
        'Scroll down and select "Messages" only (uncheck everything else)',
        'Choose format: JSON, Quality: High, Date range: All time',
        'Click "Create File"',
        'Wait for Facebook notification (can take hours)',
        'Download the .zip file when ready',
        'Extract and find "messages" folder with your conversations'
      ],
      notes: [
        'This is Facebook\'s official "Download Your Information" tool',
        'Processing time varies from minutes to several hours',
        'You\'ll get a Facebook notification when ready'
      ],
      timeEstimate: '3 minutes setup, then 1-6 hour wait'
    }
  },
  snapchat: {
    id: 'snapchat',
    name: 'Snapchat',
    icon: '👻',
    description: 'Analyze messages from your Snapchat chats',
    exportInstructions: {
      title: 'Export Snapchat Messages',
      steps: [
        'Go to accounts.snapchat.com and log in',
        'Or in app: Settings → "My Data"',
        'Toggle on "Chat History" (and "Chat Media" if you want)',
        'Choose format: HTML or JSON',
        'Select date range: All time',
        'Click "Submit Request"',
        'Wait for email titled "Your Snapchat Data is Ready"',
        'Download the .zip file (arrives in 24-48 hours)',
        'Extract and look for chat files'
      ],
      notes: [
        'IMPORTANT: Only saved messages will be exported',
        'To save messages: Long-press a message → "Save in Chat"',
        'Unsaved messages are lost forever and cannot be exported',
        'Export shows only messages currently saved in your chats'
      ],
      timeEstimate: '2 minutes setup, then 24-48 hour wait'
    }
  },
  android_sms: {
    id: 'android_sms',
    name: 'Android SMS',
    icon: '📱',
    description: 'Analyze text messages from your Android device',
    exportInstructions: {
      title: 'Export Android Text Messages',
      steps: [
        'Method 1 (Google Messages Web): Open messages.google.com',
        'Scan QR code with your Google Messages app',
        'Open the conversation you want',
        'Use browser Print → Save as PDF',
        '',
        'Method 2 (Backup App): Download "SMS Backup & Restore" app',
        'Open app → "Backup" → Select conversations',
        'Choose format: XML or JSON',
        'Backup to local storage',
        'Transfer file to your computer via USB or email',
        '',
        'Method 3 (PC Software): Download Droid Transfer software',
        'Connect Android phone to PC',
        'Export messages to TXT, CSV, HTML, or PDF'
      ],
      notes: [
        'Method 1 is fastest for small conversations',
        'Method 2 is free and works for large exports',
        'Method 3 requires paid software but gives most format options'
      ],
      timeEstimate: '5-10 minutes'
    }
  }
};

export const ANALYSIS_FOCUSES: Record<AnalysisFocus, AnalysisFocusInfo> = {
  romantic_relationship: {
    id: 'romantic_relationship',
    name: 'Romantic Relationship',
    icon: '💕',
    description: 'Explore love languages, attachment patterns, and deep compatibility analysis',
    includes: [
      'Attachment style assessment',
      'Love languages breakdown',
      'Compatibility scoring',
      'Relationship trajectory analysis',
      'Emotional intimacy patterns',
      'Communication balance'
    ]
  },
  personality_communication: {
    id: 'personality_communication',
    name: 'Personality & Communication',
    icon: '🧠',
    description: 'Understand communication patterns, conflict resolution styles, and personality traits',
    includes: [
      'Communication style analysis',
      'Conflict resolution patterns',
      'Emotional intelligence scoring',
      'Personality trait mapping',
      'Response time patterns',
      'Topic distribution analysis'
    ]
  },
  just_for_fun: {
    id: 'just_for_fun',
    name: 'Just for Fun',
    icon: '🎉',
    description: 'Entertaining stats, superlatives, and quirky conversation insights',
    includes: [
      'Fun conversation statistics',
      'Most used words and phrases',
      'Emoji usage patterns',
      'Conversation superlatives',
      'Time-of-day activity',
      'Longest exchanges'
    ]
  }
};
