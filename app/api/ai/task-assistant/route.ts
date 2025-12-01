import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { fetchMembers } from "@/lib/db/actions";
import type { User } from "@/lib/db/schema";

// Initialize Gemini API (will be initialized in route handler to check for key)
let genAI: GoogleGenerativeAI | null = null;

export interface AIResponse {
  action: "LOG_TASK" | "CONVERSATION" | "EDIT_TASK";
  conversationReply: string;
  proposedTask?: {
    title: string;
    description: string;
    assigneeId: string;
    dueDate: string;
    status: "TO_DO";
  };
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured. Please set it in your environment variables." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { prompt, currentUsers } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Fetch current members with workload data
    const members = await fetchMembers();
    const usersList = currentUsers || members;

    // Fetch all tasks for context (AI needs full database access)
    const { fetchTasks } = await import('@/lib/db/actions');
    const allTasks = await fetchTasks();

    // Build system instruction
    const systemInstruction = `You are Aura, an intelligent and diligent Project Manager Assistant.

CRITICAL: You MUST respond ONLY with valid JSON. Do not include any text before or after the JSON object. No explanations, no conversational text outside the JSON.

Your goal is to extract task details (title, description, assignee, dueDate) from user conversations and achieve workload balance.

WORKLOAD BALANCING RULE: If the user does not specify an assignee, compare the complexity of the task (inferred from the prompt) against the members' tasksCount. Suggest the least busy employee in your conversationReply.

Available members and their current workload:
${usersList.map((u: User) => `- ${u.name} (ID: ${u.id}): ${u.tasksCount} active tasks`).join("\n")}

Current tasks in the system (for context):
${allTasks.slice(0, 10).map((t: any) => `- "${t.title}" (${t.status}) - Assigned to: ${usersList.find((u: User) => u.id === t.assigneeId)?.name || 'Unassigned'}`).join("\n")}
${allTasks.length > 10 ? `... and ${allTasks.length - 10} more tasks` : ''}

You MUST respond with ONLY a valid JSON object matching this exact schema (no markdown, no code blocks, just pure JSON):
{
  "action": "LOG_TASK" | "CONVERSATION" | "EDIT_TASK",
  "conversationReply": "string - The text to display/speak to the user",
  "proposedTask": {
    "title": "string",
    "description": "string",
    "assigneeId": "string - must match one of the provided user IDs",
    "dueDate": "string - flexible text field (e.g., '2025-02-15', 'by end of Q4', 'next Monday')",
    "status": "TO_DO"
  }
}

Rules:
- If the user wants to create/log a task, set action to "LOG_TASK" and provide proposedTask
- If the user is just chatting, set action to "CONVERSATION" and omit proposedTask
- If the user wants to edit a task, set action to "EDIT_TASK"
- Always provide a helpful, conversational reply in conversationReply
- If no assignee is specified, choose the member with the lowest tasksCount
- dueDate can be flexible: dates, events, or seasons (e.g., "by end of Q4", "next week")
- REMEMBER: Output ONLY JSON, nothing else. Start with { and end with }`;

    // Initialize Gemini API
    if (!genAI) {
      genAI = new GoogleGenerativeAI(apiKey);
    }

    // Get the model
    // Note: Update model name to "gemini-2.5-flash-preview-09-2025" when available
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction,
    });

    // Generate response - try with JSON mode if supported
    let result;
    try {
      // Try with JSON response format (if supported by the model)
      result = await model.generateContent({
        contents: prompt,
        generationConfig: {
          responseMimeType: "application/json",
        },
      });
    } catch (jsonModeError) {
      // Fallback to regular generation if JSON mode not supported
      console.log("JSON mode not supported, using regular generation");
      result = await model.generateContent(prompt);
    }
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response (handle various formats)
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.includes("```json")) {
      const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      }
    } else if (jsonText.includes("```")) {
      const codeMatch = jsonText.match(/```\s*([\s\S]*?)\s*```/);
      if (codeMatch) {
        jsonText = codeMatch[1].trim();
      }
    }
    
    // Try to extract JSON object if it's embedded in text
    if (!jsonText.startsWith("{")) {
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
    }
    
    // If still not valid JSON, try to find the JSON part
    if (!jsonText.startsWith("{")) {
      // Look for JSON object anywhere in the text
      const jsonStart = jsonText.indexOf("{");
      const jsonEnd = jsonText.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
      }
    }

    let aiResponse: AIResponse;
    try {
      aiResponse = JSON.parse(jsonText);
    } catch (parseError) {
      // If JSON parsing fails, return a fallback response
      console.error("Failed to parse AI response as JSON:", jsonText);
      console.error("Parse error:", parseError);
      
      // Return a conversation response as fallback
      aiResponse = {
        action: "CONVERSATION",
        conversationReply: text || "I apologize, but I'm having trouble processing that request. Could you please rephrase it?",
      };
    }

    // Validate assigneeId exists
    if (aiResponse.proposedTask?.assigneeId) {
      const assigneeExists = usersList.some(
        (u: User) => u.id === aiResponse.proposedTask!.assigneeId
      );
      if (!assigneeExists) {
        // Auto-correct to least busy member
        const leastBusy = usersList.reduce((prev: User, curr: User) =>
          prev.tasksCount < curr.tasksCount ? prev : curr
        );
        aiResponse.proposedTask.assigneeId = leastBusy.id;
        aiResponse.conversationReply += ` I've assigned this to ${leastBusy.name} as they have the lightest workload.`;
      }
    }

    return NextResponse.json(aiResponse);
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

