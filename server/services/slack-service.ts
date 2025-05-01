import { type ChatPostMessageArguments, WebClient } from "@slack/web-api"

// Validate environment variables
if (!process.env.SLACK_BOT_TOKEN) {
  console.warn("SLACK_BOT_TOKEN environment variable is not set; Slack integration will be disabled");
}

if (!process.env.SLACK_CHANNEL_ID) {
  console.warn("SLACK_CHANNEL_ID environment variable is not set; Slack integration will use fallback channel");
}

// Create Slack web client if token is available
const slack = process.env.SLACK_BOT_TOKEN 
  ? new WebClient(process.env.SLACK_BOT_TOKEN)
  : null;

// Default channel ID to use when none is specified
const defaultChannelId = process.env.SLACK_CHANNEL_ID || "";

/**
 * Sends a structured message to a Slack channel using the Slack Web API
 * 
 * @param message - Structured message to send
 * @returns Promise resolving to the sent message's timestamp (ts)
 */
async function sendSlackMessage(
  message: ChatPostMessageArguments
): Promise<string | null> {
  if (!slack) {
    console.error('Slack integration is not configured. Set SLACK_BOT_TOKEN in .env file.');
    return null;
  }

  try {
    // Set default channel if none specified
    if (!message.channel) {
      if (!defaultChannelId) {
        console.error('No channel specified and no default channel configured.');
        return null;
      }
      message.channel = defaultChannelId;
    }

    // Send the message
    const response = await slack.chat.postMessage(message);

    // Return the timestamp of the sent message
    return response.ts || null;
  } catch (error) {
    console.error('Error sending Slack message:', error);
    return null;
  }
}

/**
 * Sends a simple text message to the default Slack channel
 * 
 * @param text The message text to send
 * @param channel Optional channel override
 * @returns Promise resolving to success status
 */
async function sendSimpleMessage(text: string, channel?: string): Promise<boolean> {
  try {
    const messageChannel = channel || defaultChannelId;
    const result = await sendSlackMessage({
      channel: messageChannel,
      text: text,
    });
    return result !== null;
  } catch (error) {
    console.error('Error sending simple message to Slack:', error);
    return false;
  }
}

/**
 * Sends an OKR update to Slack
 * 
 * @param objective The objective that was updated
 * @param keyResult Optional key result that was updated
 * @param progress The new progress value
 * @param user The user who made the update
 * @returns Promise resolving to success status
 */
async function sendOkrUpdate(
  objective: { id: number; title: string; progress: number },
  keyResult: { id: number; title: string; progress: number } | null,
  progress: number,
  user: { firstName: string; lastName: string }
): Promise<boolean> {
  try {
    let text = '';
    let blocks = [];
    
    if (keyResult) {
      // Key result update
      text = `*Key Result Update*: ${keyResult.title} is now at ${progress}% completion`;
      
      blocks = [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🎯 Key Result Update",
            emoji: true
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${keyResult.title}* is now at *${progress}%* completion`
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Objective:*\n${objective.title}`
            },
            {
              type: "mrkdwn",
              text: `*Updated by:*\n${user.firstName} ${user.lastName}`
            }
          ]
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Updated on ${new Date().toLocaleString()}`
            }
          ]
        }
      ];
    } else {
      // Objective update
      text = `*Objective Update*: ${objective.title} is now at ${progress}% completion`;
      
      blocks = [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🚀 Objective Update",
            emoji: true
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${objective.title}* is now at *${progress}%* completion`
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Updated by:*\n${user.firstName} ${user.lastName}`
            }
          ]
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Updated on ${new Date().toLocaleString()}`
            }
          ]
        }
      ];
    }
    
    const result = await sendSlackMessage({
      channel: defaultChannelId,
      text: text,
      blocks: blocks as any,
    });
    
    return result !== null;
  } catch (error) {
    console.error('Error sending OKR update to Slack:', error);
    return false;
  }
}

/**
 * Checks if the Slack integration is properly configured
 * 
 * @returns true if configured, false otherwise
 */
function isSlackConfigured(): boolean {
  return !!slack && !!defaultChannelId;
}

/**
 * Test the Slack connection by sending a test message
 * 
 * @returns Promise resolving to the connection status
 */
async function testSlackConnection(): Promise<{ success: boolean; message: string }> {
  if (!slack) {
    return { 
      success: false, 
      message: "Slack client not initialized. Check your SLACK_BOT_TOKEN."
    };
  }

  if (!defaultChannelId) {
    return { 
      success: false, 
      message: "No default channel configured. Check your SLACK_CHANNEL_ID."
    };
  }

  try {
    // Try to get channel info to verify permissions and channel existence
    const result = await slack.conversations.info({
      channel: defaultChannelId
    });

    if (!result.ok) {
      return { 
        success: false, 
        message: `Could not access channel: ${result.error || "Unknown error"}`
      };
    }

    // Send a test message
    const testMessage = await sendSimpleMessage("🔍 Test message from OKR Platform");
    
    if (!testMessage) {
      return { 
        success: false, 
        message: "Failed to send test message. Check bot permissions."
      };
    }

    return { 
      success: true, 
      message: "Successfully connected to Slack and sent test message."
    };
  } catch (error: any) {
    return { 
      success: false, 
      message: `Connection test failed: ${error.message || "Unknown error"}`
    };
  }
}

export const slackService = {
  sendSlackMessage,
  sendSimpleMessage,
  sendOkrUpdate,
  isSlackConfigured,
  testSlackConnection
};