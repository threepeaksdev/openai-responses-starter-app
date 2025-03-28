// List of tools available to the assistant
// No need to include the top-level wrapper object as it is added in lib/tools/tools.ts
// More information on function calling: https://platform.openai.com/docs/guides/function-calling

export const toolsList = [
  {
    name: "get_weather",
    description: "Get the weather for a given location",
    parameters: {
      location: {
        type: "string",
        description: "Location to get weather for",
      },
      unit: {
        type: "string",
        description: "Unit to get weather in",
        enum: ["celsius", "fahrenheit"],
      },
    },
  },
  {
    name: "get_joke",
    description: "Get a programming joke",
    parameters: {},
  },
  {
    name: "create_task",
    description: "Create a simple task",
    parameters: {
      title: {
        type: "string",
        description: "Title of the task",
      },
      description: {
        type: "string",
        description: "Description of the task",
      },
    },
  },
  {
    name: "edit_task",
    description: "Edit an existing task",
    parameters: {
      task_id: {
        type: "string",
        description: "ID of the task to edit",
      },
      title: {
        type: "string",
        description: "New title of the task",
      },
      description: {
        type: "string",
        description: "New description of the task",
      },
      status: {
        type: "string",
        description: "New status of the task",
        enum: ["pending", "in_progress", "completed", "cancelled"],
      },
    },
  },
];
