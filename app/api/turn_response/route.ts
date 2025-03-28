import { MODEL } from "@/config/constants";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const { messages, tools } = await request.json();
    console.log("Received messages:", messages);

    // Format messages to ensure they have the required structure
    const formattedMessages = messages.map((message: any) => {
      // For function call outputs
      if (message.type === 'function_call_output') {
        return {
          type: 'function_call_output',
          call_id: message.call_id || uuidv4(),
          name: message.name,
          output: message.output,
          status: message.status || 'completed'
        };
      }
      
      // For tool calls
      if (message.type === 'tool_call') {
        return {
          type: 'function_call',
          id: message.id,
          call_id: message.call_id || message.id || uuidv4(),
          name: message.name,
          arguments: message.arguments,
          status: message.status || 'completed'
        };
      }

      // For regular messages, keep them as is
      return message;
    });

    const openai = new OpenAI();

    const events = await openai.responses.create({
      model: MODEL,
      input: formattedMessages,
      tools,
      stream: true,
      parallel_tool_calls: false,
    });

    // Create a ReadableStream that emits SSE data
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of events) {
            // Sending all events to the client
            const data = JSON.stringify({
              event: event.type,
              data: event,
            });
            controller.enqueue(`data: ${data}\n\n`);
          }
          // End of stream
          controller.close();
        } catch (error) {
          console.error("Error in streaming loop:", error);
          controller.error(error);
        }
      },
    });

    // Return the ReadableStream as SSE
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
