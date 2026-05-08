import { supabase } from "@/integrations/supabase/client";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface UserContext {
  profile_summary?: string;
  completed_surveys?: Array<{
    survey_name: string;
    score: number;
    date: string;
    recommendations: string;
  }>;
  key_topics?: string[];
  preferences?: Record<string, any>;
}

export interface ChatbotMemory {
  conversation_history: ConversationMessage[];
  user_context: UserContext;
}

/**
 * Fetch or create chatbot memory for a user
 */
export async function getChatbotMemory(userId: string): Promise<ChatbotMemory> {
  try {
    const { data, error } = await supabase
      .from("chatbot_memory")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (data) {
      return {
        conversation_history: data.conversation_history || [],
        user_context: data.user_context || {},
      };
    }

    // Create new memory entry if doesn't exist
    const newMemory: ChatbotMemory = {
      conversation_history: [],
      user_context: {},
    };

    await supabase.from("chatbot_memory").insert({
      user_id: userId,
      conversation_history: newMemory.conversation_history,
      user_context: newMemory.user_context,
    });

    return newMemory;
  } catch (error) {
    console.error("[v0] Error fetching chatbot memory:", error);
    return {
      conversation_history: [],
      user_context: {},
    };
  }
}

/**
 * Update chatbot memory with new conversation message
 */
export async function updateChatbotMemory(
  userId: string,
  message: ConversationMessage,
  userContext?: Partial<UserContext>
): Promise<void> {
  try {
    const memory = await getChatbotMemory(userId);

    // Add message to history
    const updatedHistory = [
      ...memory.conversation_history,
      { ...message, timestamp: new Date().toISOString() },
    ];

    // Keep only last 50 messages to avoid bloat
    const trimmedHistory =
      updatedHistory.length > 50
        ? updatedHistory.slice(updatedHistory.length - 50)
        : updatedHistory;

    // Merge user context
    const updatedContext = {
      ...memory.user_context,
      ...userContext,
    };

    await supabase
      .from("chatbot_memory")
      .update({
        conversation_history: trimmedHistory,
        user_context: updatedContext,
      })
      .eq("user_id", userId);
  } catch (error) {
    console.error("[v0] Error updating chatbot memory:", error);
  }
}

/**
 * Load user context from profile and survey history
 */
export async function loadUserContext(userId: string): Promise<UserContext> {
  try {
    // Fetch user profile
    const { data: profile } = await supabase
      .from("Profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    // Fetch survey history
    const { data: surveyHistory } = await supabase
      .from("survey_history")
      .select("survey_id, total_score, survey_date, recommendations")
      .eq("user_id", userId)
      .order("survey_date", { ascending: false })
      .limit(10);

    // Fetch survey titles
    const surveyIds = surveyHistory?.map((h: any) => h.survey_id) || [];
    let surveys: Record<string, string> = {};

    if (surveyIds.length > 0) {
      const { data: surveyData } = await supabase
        .from("surveys")
        .select("id, title")
        .in("id", surveyIds);

      surveyData?.forEach((s: any) => {
        surveys[s.id] = s.title;
      });
    }

    const context: UserContext = {
      profile_summary: profile ? `Name: ${profile.name}, Age: ${profile.age || "not specified"}` : undefined,
      completed_surveys: surveyHistory?.map((h: any) => ({
        survey_name: surveys[h.survey_id] || "Survey",
        score: h.total_score,
        date: new Date(h.survey_date).toLocaleDateString(),
        recommendations: h.recommendations,
      })) || [],
      key_topics: [],
      preferences: {},
    };

    return context;
  } catch (error) {
    console.error("[v0] Error loading user context:", error);
    return { key_topics: [], preferences: {} };
  }
}

/**
 * Build system prompt with user context
 */
export function buildSystemPrompt(userContext: UserContext): string {
  let prompt = `You are MindHaven Companion, a compassionate AI assistant dedicated to mental health support. 
You listen without judgment and provide thoughtful, empathetic responses.

Important guidelines:
- Be warm, supportive, and non-judgmental
- Ask clarifying questions to better understand the user's situation
- Suggest coping strategies and mindfulness techniques when appropriate
- Always remind users that you're not a therapist and they should reach out to professionals for serious concerns
- Remember the user's previous conversations and reference relevant topics when helpful`;

  if (userContext.profile_summary) {
    prompt += `\n\nUser Profile: ${userContext.profile_summary}`;
  }

  if (userContext.completed_surveys && userContext.completed_surveys.length > 0) {
    prompt += `\n\nRecent Surveys Completed:\n`;
    userContext.completed_surveys.slice(0, 3).forEach((survey) => {
      prompt += `- ${survey.survey_name} (Score: ${survey.score}, Date: ${survey.date}): ${survey.recommendations}\n`;
    });
  }

  prompt += `\n\nBased on this context, provide personalized support that acknowledges the user's history and situation.`;

  return prompt;
}

/**
 * Clear all memory for a user (privacy/cleanup)
 */
export async function clearChatbotMemory(userId: string): Promise<void> {
  try {
    await supabase
      .from("chatbot_memory")
      .update({
        conversation_history: [],
        user_context: {},
      })
      .eq("user_id", userId);
  } catch (error) {
    console.error("[v0] Error clearing chatbot memory:", error);
  }
}
