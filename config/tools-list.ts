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
  {
    name: "create_contact",
    description: "Create a new contact in the user's contact list",
    parameters: {
      first_name: {
        type: "string",
        description: "First name of the contact"
      },
      last_name: {
        type: "string",
        description: "Last name of the contact"
      },
      nickname: {
        type: "string",
        description: "Nickname of the contact"
      },
      email: {
        type: "string",
        description: "Email address of the contact"
      },
      phone: {
        type: "string",
        description: "Phone number of the contact"
      },
      birthday: {
        type: "string",
        description: "Birthday of the contact in YYYY-MM-DD format"
      },
      occupation: {
        type: "string",
        description: "Occupation or job title of the contact"
      },
      company: {
        type: "string",
        description: "Company or organization where the contact works"
      },
      location: {
        type: "string",
        description: "Location or address of the contact"
      },
      linkedin: {
        type: "string",
        description: "LinkedIn profile URL of the contact"
      },
      twitter: {
        type: "string",
        description: "Twitter handle or profile URL of the contact"
      },
      instagram: {
        type: "string",
        description: "Instagram handle or profile URL of the contact"
      },
      relationship_status: {
        type: "string",
        description: "Type of relationship with the contact",
        enum: ["friend", "family", "colleague", "acquaintance", "other"]
      },
      met_at: {
        type: "string",
        description: "Where you met the contact"
      },
      met_through: {
        type: "string",
        description: "Who introduced you to the contact"
      },
      bio: {
        type: "string",
        description: "Brief biography or description of the contact"
      },
      interests: {
        type: "array",
        items: {
          type: "string"
        },
        description: "List of interests or hobbies of the contact"
      },
      tags: {
        type: "array",
        items: {
          type: "string"
        },
        description: "List of tags to categorize the contact"
      },
      notes: {
        type: "string",
        description: "Additional notes about the contact"
      }
    }
  },
  {
    name: "edit_contact",
    description: "Update an existing contact's information",
    parameters: {
      contact_id: {
        type: "string",
        description: "ID of the contact to edit"
      },
      first_name: {
        type: "string",
        description: "New first name of the contact"
      },
      last_name: {
        type: "string",
        description: "New last name of the contact"
      },
      nickname: {
        type: "string",
        description: "New nickname of the contact"
      },
      email: {
        type: "string",
        description: "New email address of the contact"
      },
      phone: {
        type: "string",
        description: "New phone number of the contact"
      },
      birthday: {
        type: "string",
        description: "New birthday of the contact in YYYY-MM-DD format"
      },
      occupation: {
        type: "string",
        description: "New occupation or job title of the contact"
      },
      company: {
        type: "string",
        description: "New company or organization where the contact works"
      },
      location: {
        type: "string",
        description: "New location or address of the contact"
      },
      linkedin: {
        type: "string",
        description: "New LinkedIn profile URL of the contact"
      },
      twitter: {
        type: "string",
        description: "New Twitter handle or profile URL of the contact"
      },
      instagram: {
        type: "string",
        description: "New Instagram handle or profile URL of the contact"
      },
      relationship_status: {
        type: "string",
        description: "New type of relationship with the contact",
        enum: ["friend", "family", "colleague", "acquaintance", "other"]
      },
      met_at: {
        type: "string",
        description: "New information about where you met the contact"
      },
      met_through: {
        type: "string",
        description: "New information about who introduced you to the contact"
      },
      bio: {
        type: "string",
        description: "New biography or description of the contact"
      },
      interests: {
        type: "array",
        items: {
          type: "string"
        },
        description: "New list of interests or hobbies of the contact"
      },
      tags: {
        type: "array",
        items: {
          type: "string"
        },
        description: "New list of tags to categorize the contact"
      },
      notes: {
        type: "string",
        description: "New additional notes about the contact"
      }
    }
  },
  {
    name: "get_contacts",
    description: "Search and retrieve contacts from the user's contact list. You can search using natural language queries like 'Do I know someone named Dave?' or 'Who works at ABC Inc?'. The search looks across names, nicknames, companies, occupations, locations, emails, and bios. Only use relationship_status parameter when specifically asked about a type of relationship (e.g. 'Show me all my friends' or 'List my colleagues').",
    parameters: {
      contact_id: {
        type: "string",
        description: "Optional: ID of a specific contact to retrieve"
      },
      search_term: {
        type: "string",
        description: "Optional: Search term to find contacts. Can be a name, company, occupation, location, or any other identifying information. For example: 'Dave', 'ABC Inc', 'engineer', 'New York'. For relationship queries like 'Who is Dave to me?', just search for 'Dave' without specifying a relationship_status."
      },
      relationship_status: {
        type: "string",
        description: "Optional: Only use when explicitly filtering for a specific relationship type. For example, use this for queries like 'Show me all my friends' but NOT for queries like 'Who is Dave to me?'",
        enum: ["friend", "family", "colleague", "acquaintance", "other"]
      }
    }
  },
  {
    name: "get_tasks",
    description: "Retrieve tasks from the user's task list. Can filter by status or get a specific task by ID.",
    parameters: {
      task_id: {
        type: "string",
        description: "Optional: ID of a specific task to retrieve"
      },
      status: {
        type: "string",
        description: "Optional: Filter tasks by status",
        enum: ["pending", "in_progress", "completed", "cancelled"]
      }
    }
  }
];
