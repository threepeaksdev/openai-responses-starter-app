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
          call_id: message.call_id,
          output: message.output,
          status: message.status || 'completed'
        };
      }
      
      // For tool calls
      if (message.type === 'tool_call') {
        const call_id = message.call_id || message.id || uuidv4();
        return {
          type: 'function_call',
          id: message.id,
          call_id,
          name: message.name,
          arguments: message.arguments,
          status: message.status || 'completed'
        };
      }

      // For regular messages, keep them as is
      return message;
    });

    // Validate that all function call outputs have matching function calls
    const functionCalls = formattedMessages.filter((m: any) => m.type === 'function_call') as Array<{
      type: 'function_call';
      id: string;
      call_id: string;
      name: string;
      arguments: string;
      status: string;
    }>;
    
    const functionOutputs = formattedMessages.filter((m: any) => m.type === 'function_call_output') as Array<{
      type: 'function_call_output';
      call_id: string;
      output: string;
      status: string;
    }>;
    
    for (const output of functionOutputs) {
      const matchingCall = functionCalls.find(call => call.call_id === output.call_id);
      if (!matchingCall) {
        console.warn(`No matching function call found for output with call_id ${output.call_id}`);
      }
    }

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
