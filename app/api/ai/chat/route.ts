import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, context } = body

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get relevant context from the knowledge base
    const { data: blogPosts } = await supabase
      .from("blog_posts")
      .select("title, excerpt, content")
      .eq("status", "published")
      .limit(3)

    const { data: questions } = await supabase
      .from("questions")
      .select("title, content")
      .eq("status", "answered")
      .limit(3)

    // Build context for the AI
    const knowledgeBase = [
      ...(blogPosts || []).map((post) => `Blog: ${post.title} - ${post.excerpt}`),
      ...(questions || []).map((q) => `Q&A: ${q.title} - ${q.content.substring(0, 200)}...`),
    ].join("\n")

    const userContext = context?.user
      ? `User: ${context.user.name || "Anonymous"} (Role: ${context.user.role || "customer"})`
      : "User: Anonymous visitor"

    const conversationHistory =
      context?.previousMessages?.map((msg: any) => `${msg.role}: ${msg.content}`).join("\n") || ""

    const systemPrompt = `You are an AI Insurance Assistant for Insurance AI Hub, a comprehensive insurance platform. You help users with insurance-related questions, provide guidance on coverage options, explain insurance concepts, and assist with general insurance inquiries.

IMPORTANT GUIDELINES:
- Always be helpful, professional, and accurate
- Focus specifically on insurance topics (auto, home, life, health, business insurance)
- If asked about non-insurance topics, politely redirect to insurance matters
- Provide practical, actionable advice when possible
- Suggest relevant resources from the platform when appropriate
- Always include disclaimers for specific policy or legal advice
- Be concise but thorough in your responses
- If you're unsure about something, acknowledge it and suggest consulting a licensed professional

AVAILABLE PLATFORM RESOURCES:
- Q&A Forum: For community discussions and expert answers
- Blog: Educational content about insurance topics
- Contact Form: For personalized quotes and expert consultation
- Company Directory: Approved insurance providers

KNOWLEDGE BASE:
${knowledgeBase}

CURRENT USER CONTEXT:
${userContext}

CONVERSATION HISTORY:
${conversationHistory}

Remember to:
1. Stay focused on insurance topics
2. Provide helpful, accurate information
3. Include appropriate disclaimers
4. Suggest platform resources when relevant
5. Be conversational but professional`

    const { text } = await generateText({
      model: groq("llama-3.1-70b-versatile"),
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: message,
        },
      ],
      maxTokens: 500,
      temperature: 0.7,
    })

    // Log the AI interaction
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        event_type: "ai_chat_interaction",
        resource_type: "ai_chat",
        resource_id: null,
        details: {
          message: message.substring(0, 100),
          response_length: text.length,
        },
      })
    }

    return NextResponse.json({
      response: text,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("AI chat error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate AI response",
        response:
          "I apologize, but I'm experiencing technical difficulties. Please try again in a moment, or feel free to ask your question in our Q&A forum where our community can help.",
      },
      { status: 500 },
    )
  }
}
