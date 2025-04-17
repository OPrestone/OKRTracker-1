// Sample chat room data with realistic conversations about OKRs and objectives

export const sampleChatRooms = [
  {
    id: 1,
    name: "Marketing Team Chat",
    type: "team",
    createdBy: 1,
    description: "Marketing team discussion channel for OKRs and campaigns",
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days ago
  },
  {
    id: 2,
    name: "Leadership Group",
    type: "group",
    createdBy: 4,
    description: "Executive leadership discussions for company-wide OKRs and strategic alignment",
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days ago
  },
  {
    id: 3,
    name: "Product Development",
    type: "team",
    createdBy: 3,
    description: "Product team collaboration on feature development OKRs",
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() // 45 days ago
  },
  {
    id: 4,
    name: "Sarah Chen / Alex Johnson",
    type: "direct",
    createdBy: 2,
    description: "1:1 conversation about individual OKRs and performance",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days ago
  },
  {
    id: 5,
    name: "Q3 Strategy Discussion",
    type: "group",
    createdBy: 4,
    description: "Cross-functional team planning for Q3 OKRs",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
  },
  {
    id: 6,
    name: "Customer Success Team",
    type: "team",
    createdBy: 5,
    description: "Customer Success team discussions about support and satisfaction OKRs",
    createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString() // 75 days ago
  }
];

export const sampleChatRoomMembers = [
  // Marketing Team Chat members
  { userId: 1, chatRoomId: 1, role: "admin" },
  { userId: 2, chatRoomId: 1, role: "member" },
  { userId: 5, chatRoomId: 1, role: "member" },
  { userId: 7, chatRoomId: 1, role: "member" },
  
  // Leadership Group members
  { userId: 4, chatRoomId: 2, role: "admin" },
  { userId: 1, chatRoomId: 2, role: "member" },
  { userId: 3, chatRoomId: 2, role: "member" },
  { userId: 6, chatRoomId: 2, role: "member" },
  
  // Product Development members
  { userId: 3, chatRoomId: 3, role: "admin" },
  { userId: 6, chatRoomId: 3, role: "member" },
  { userId: 8, chatRoomId: 3, role: "member" },
  { userId: 9, chatRoomId: 3, role: "member" },
  
  // 1:1 Chat members
  { userId: 2, chatRoomId: 4, role: "member" },
  { userId: 4, chatRoomId: 4, role: "member" },
  
  // Q3 Strategy Discussion members
  { userId: 4, chatRoomId: 5, role: "admin" },
  { userId: 1, chatRoomId: 5, role: "member" },
  { userId: 2, chatRoomId: 5, role: "member" },
  { userId: 3, chatRoomId: 5, role: "member" },
  { userId: 6, chatRoomId: 5, role: "member" },
  
  // Customer Success Team members
  { userId: 5, chatRoomId: 6, role: "admin" },
  { userId: 7, chatRoomId: 6, role: "member" },
  { userId: 10, chatRoomId: 6, role: "member" }
];

export const sampleMessages = [
  // Marketing Team Chat messages
  {
    id: 1,
    content: "Hey team, let's track our progress on the Q3 campaign OKRs. We're currently at 65% for the social media engagement KR.",
    userId: 1,
    chatRoomId: 1,
    type: "text",
    replyToId: null,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
  },
  {
    id: 2,
    content: "I've updated our email conversion numbers. We're trending about 8% above target for the quarter!",
    userId: 2,
    chatRoomId: 1,
    type: "text",
    replyToId: 1,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString() // 10 days ago + 15 minutes
  },
  {
    id: 3,
    content: "Great work on those email numbers. For the website traffic KR, we're still about 12% behind. I've added some initiatives to the objective that should help us close the gap.",
    userId: 1,
    chatRoomId: 1,
    type: "text",
    replyToId: 2,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString() // 10 days ago + 45 minutes
  },
  {
    id: 4,
    content: "Just scheduled our weekly check-in for Friday at 2pm to review all marketing OKRs. Please update your progress before then.",
    userId: 1,
    chatRoomId: 1,
    type: "text",
    replyToId: null,
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() // 9 days ago
  },
  {
    id: 5,
    content: "FYI - I've attached the latest analytics dashboard for our campaign metrics.",
    userId: 5,
    chatRoomId: 1,
    type: "text",
    replyToId: null,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() // 8 days ago
  },
  
  // Leadership Group messages
  {
    id: 6,
    content: "The company-wide revenue objective is currently marked as 'at risk'. Let's discuss strategies to get back on track in our meeting tomorrow.",
    userId: 4,
    chatRoomId: 2,
    type: "text",
    replyToId: null,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days ago
  },
  {
    id: 7,
    content: "I've reviewed the Marketing team's OKRs. Their campaign performance KR is exceeding expectations, but the website traffic KR needs attention.",
    userId: 1,
    chatRoomId: 2,
    type: "text",
    replyToId: 6,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000).toISOString() // 15 days ago + 2 hours
  },
  {
    id: 8,
    content: "Product team is on track with all objectives. We're slightly ahead on the feature launch timeline KR.",
    userId: 3,
    chatRoomId: 2,
    type: "text",
    replyToId: 6,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 + 180 * 60 * 1000).toISOString() // 15 days ago + 3 hours
  },
  {
    id: 9,
    content: "After reviewing all department OKRs, I suggest reallocating some resources from Product to Marketing to address the website traffic gap.",
    userId: 4,
    chatRoomId: 2,
    type: "text",
    replyToId: null,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days ago
  },
  
  // Product Development messages
  {
    id: 10,
    content: "Let's update our development roadmap OKR to reflect the new priorities from the leadership team.",
    userId: 3,
    chatRoomId: 3,
    type: "text",
    replyToId: null,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() // 20 days ago
  },
  {
    id: 11,
    content: "I've adjusted the sprint plans to accommodate the changes. This will impact our delivery timeline by about 1 week.",
    userId: 8,
    chatRoomId: 3,
    type: "text",
    replyToId: 10,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString() // 20 days ago + 1.5 hours
  },
  {
    id: 12,
    content: "The feature adoption KR might be at risk with the timeline shift. Let's add some initiatives to ensure a smooth launch.",
    userId: 9,
    chatRoomId: 3,
    type: "text",
    replyToId: 11,
    createdAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString() // 19 days ago
  },
  {
    id: 13,
    content: "Let's create a comprehensive onboarding flow to improve adoption rates. I've added this as a new initiative linked to our feature adoption KR.",
    userId: 6,
    chatRoomId: 3,
    type: "text",
    replyToId: 12,
    createdAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString() // 19 days ago + 1 hour
  },
  
  // 1:1 Chat messages
  {
    id: 14,
    content: "Sarah, I wanted to check in on your individual OKRs. How's progress on your skill development objective?",
    userId: 4,
    chatRoomId: 4,
    type: "text",
    replyToId: null,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
  },
  {
    id: 15,
    content: "Thanks for checking in, Alex. I'm at about 70% on the skill development objective. I've completed two of the three training courses and I'm implementing the new techniques in our current campaigns.",
    userId: 2,
    chatRoomId: 4,
    type: "text",
    replyToId: 14,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString() // 7 days ago + 30 minutes
  },
  {
    id: 16,
    content: "That's great progress! For your campaign performance objective, do you need any additional resources to reach the target?",
    userId: 4,
    chatRoomId: 4,
    type: "text",
    replyToId: 15,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString() // 7 days ago + 45 minutes
  },
  {
    id: 17,
    content: "Actually, I could use some help with the analytics tracking. Our current tools are missing some key metrics I need for one of my KRs.",
    userId: 2,
    chatRoomId: 4,
    type: "text",
    replyToId: 16,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString() // 7 days ago + 1 hour
  },
  {
    id: 18,
    content: "Let's schedule a meeting with the data team to get you those metrics. I'll set it up for tomorrow afternoon.",
    userId: 4,
    chatRoomId: 4,
    type: "text",
    replyToId: 17,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString() // 7 days ago + 1.5 hours
  },
  
  // Q3 Strategy Discussion messages
  {
    id: 19,
    content: "Welcome everyone to our Q3 planning channel. Let's use this space to align on our strategic objectives for the quarter.",
    userId: 4,
    chatRoomId: 5,
    type: "text",
    replyToId: null,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
  },
  {
    id: 20,
    content: "I've drafted the marketing department objectives in the OKR system. The primary focus is on increasing our market share by 15%.",
    userId: 1,
    chatRoomId: 5,
    type: "text",
    replyToId: 19,
    createdAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString() // 29 days ago
  },
  {
    id: 21,
    content: "Product team's main objective will be launching the new platform with 95% feature parity and improving user retention by 20%.",
    userId: 3,
    chatRoomId: 5,
    type: "text",
    replyToId: 19,
    createdAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000).toISOString() // 29 days ago + 2 hours
  },
  {
    id: 22,
    content: "I've reviewed all department objectives and they align nicely with our company-wide goal of 30% revenue growth. Let's finalize these in our meeting tomorrow.",
    userId: 4,
    chatRoomId: 5,
    type: "text",
    replyToId: null,
    createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString() // 28 days ago
  },
  
  // Customer Success Team messages
  {
    id: 23,
    content: "Team, our customer satisfaction objective is currently at 82% against our target of 95%. Let's brainstorm some initiatives to close this gap.",
    userId: 5,
    chatRoomId: 6,
    type: "text",
    replyToId: null,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
  },
  {
    id: 24,
    content: "I've been analyzing our support ticket data. The biggest pain points are response time and resolution quality. We could focus initiatives there.",
    userId: 7,
    chatRoomId: 6,
    type: "text",
    replyToId: 23,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString() // 5 days ago + 1 hour
  },
  {
    id: 25,
    content: "Good insights. I suggest we create two new key results: 1) Reduce first response time by 40% and 2) Implement a quality assurance process for support responses.",
    userId: 5,
    chatRoomId: 6,
    type: "text",
    replyToId: 24,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000).toISOString() // 5 days ago + 2 hours
  },
  {
    id: 26,
    content: "I've added these KRs to our objective in the system. I also scheduled a training session for the team on our new response templates.",
    userId: 10,
    chatRoomId: 6,
    type: "text",
    replyToId: 25,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() // 4 days ago
  }
];

export const sampleReactions = [
  // Marketing Team Chat reactions
  { userId: 2, messageId: 1, emoji: "👍" },
  { userId: 5, messageId: 1, emoji: "👍" },
  { userId: 7, messageId: 1, emoji: "🚀" },
  { userId: 1, messageId: 2, emoji: "🎉" },
  { userId: 5, messageId: 2, emoji: "🎉" },
  { userId: 7, messageId: 2, emoji: "👏" },
  { userId: 2, messageId: 3, emoji: "👍" },
  { userId: 5, messageId: 3, emoji: "💯" },
  { userId: 2, messageId: 4, emoji: "👍" },
  { userId: 7, messageId: 4, emoji: "👍" },
  { userId: 1, messageId: 5, emoji: "👍" },
  { userId: 7, messageId: 5, emoji: "🙏" },
  
  // Leadership Group reactions
  { userId: 1, messageId: 6, emoji: "👍" },
  { userId: 3, messageId: 6, emoji: "👍" },
  { userId: 6, messageId: 6, emoji: "👀" },
  { userId: 4, messageId: 7, emoji: "👍" },
  { userId: 6, messageId: 7, emoji: "🔍" },
  { userId: 4, messageId: 8, emoji: "🎉" },
  { userId: 1, messageId: 8, emoji: "👏" },
  { userId: 1, messageId: 9, emoji: "👍" },
  { userId: 3, messageId: 9, emoji: "👍" },
  
  // Product Development reactions
  { userId: 6, messageId: 10, emoji: "👍" },
  { userId: 8, messageId: 10, emoji: "👍" },
  { userId: 9, messageId: 10, emoji: "👍" },
  { userId: 3, messageId: 11, emoji: "👍" },
  { userId: 9, messageId: 11, emoji: "⏱️" },
  { userId: 3, messageId: 12, emoji: "👍" },
  { userId: 8, messageId: 12, emoji: "💡" },
  { userId: 3, messageId: 13, emoji: "👍" },
  { userId: 8, messageId: 13, emoji: "👍" },
  { userId: 9, messageId: 13, emoji: "🚀" },
  
  // 1:1 Chat reactions
  { userId: 2, messageId: 14, emoji: "👍" },
  { userId: 4, messageId: 15, emoji: "👍" },
  { userId: 2, messageId: 16, emoji: "🤔" },
  { userId: 4, messageId: 17, emoji: "👍" },
  { userId: 2, messageId: 18, emoji: "🙏" },
  
  // Q3 Strategy Discussion reactions
  { userId: 1, messageId: 19, emoji: "👍" },
  { userId: 2, messageId: 19, emoji: "👍" },
  { userId: 3, messageId: 19, emoji: "👍" },
  { userId: 6, messageId: 19, emoji: "👍" },
  { userId: 4, messageId: 20, emoji: "👍" },
  { userId: 2, messageId: 20, emoji: "💪" },
  { userId: 4, messageId: 21, emoji: "👍" },
  { userId: 1, messageId: 21, emoji: "👏" },
  { userId: 1, messageId: 22, emoji: "👍" },
  { userId: 2, messageId: 22, emoji: "👍" },
  { userId: 3, messageId: 22, emoji: "👍" },
  { userId: 6, messageId: 22, emoji: "👍" },
  
  // Customer Success Team reactions
  { userId: 7, messageId: 23, emoji: "👍" },
  { userId: 10, messageId: 23, emoji: "👍" },
  { userId: 5, messageId: 24, emoji: "👍" },
  { userId: 10, messageId: 24, emoji: "💡" },
  { userId: 7, messageId: 25, emoji: "👍" },
  { userId: 10, messageId: 25, emoji: "👍" },
  { userId: 5, messageId: 26, emoji: "👍" },
  { userId: 7, messageId: 26, emoji: "🎉" }
];

export const sampleAttachments = [
  {
    id: 1,
    messageId: 5,
    fileName: "marketing_analytics_dashboard.pdf",
    fileType: "application/pdf",
    fileSize: 2458000,
    fileUrl: "https://example.com/files/marketing_analytics_dashboard.pdf",
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() // 8 days ago
  },
  {
    id: 2,
    messageId: 21,
    fileName: "product_roadmap_q3.xlsx",
    fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileSize: 1245000,
    fileUrl: "https://example.com/files/product_roadmap_q3.xlsx",
    createdAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000).toISOString() // 29 days ago + 2 hours
  },
  {
    id: 3,
    messageId: 24,
    fileName: "support_ticket_analysis.png",
    fileType: "image/png",
    fileSize: 857000,
    fileUrl: "https://example.com/files/support_ticket_analysis.png",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString() // 5 days ago + 1 hour
  },
  {
    id: 4,
    messageId: 26,
    fileName: "customer_response_templates.docx",
    fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    fileSize: 345000,
    fileUrl: "https://example.com/files/customer_response_templates.docx",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() // 4 days ago
  }
];