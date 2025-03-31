// Functions mapping to tool calls
// Define one function per tool call - each tool call should have a matching function
// Parameters for a tool call are passed as an object to the corresponding function
import { handleCreateTask, handleEditTask, handleGetTasks } from "@/app/api/functions/tasks/handler";
import { handleCreateContact, handleUpdateContact, handleGetContacts } from "@/app/api/functions/contacts/handler";
import { handleCreateNote, handleUpdateNote, handleGetNotes } from "@/app/api/functions/notes/handler";

export const get_weather = async ({
  location,
  unit,
}: {
  location: string;
  unit: string;
}) => {
  console.log("location", location);
  console.log("unit", unit);
  const res = await fetch(
    `/api/functions/get_weather?location=${location}&unit=${unit}`
  ).then((res) => res.json());

  console.log("executed get_weather function", res);

  return res;
};

export const get_joke = async () => {
  const res = await fetch(`/api/functions/get_joke`).then((res) => res.json());
  return res;
};

export const create_contact = handleCreateContact;

export const create_task = handleCreateTask;
export const edit_task = handleEditTask;

export const edit_contact = handleUpdateContact;

export const get_contacts = handleGetContacts;
export const get_tasks = handleGetTasks;

export const create_note = handleCreateNote;
export const edit_note = handleUpdateNote;
export const get_notes = handleGetNotes;

export const functionsMap = {
  get_weather,
  get_joke,
  create_contact,
  create_task,
  edit_task,
  edit_contact,
  get_contacts,
  get_tasks,
  create_note,
  edit_note,
  get_notes,
};
