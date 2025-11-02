import { getExceptionMessage } from '@first2apply/core/build';
import { tool } from '@openai/agents';
import Storage from 'electron-store';
import { z } from 'zod';

const store = new Storage();

export async function saveToMemory(key: string, value: string) {
  store.set(key, value);
}

export async function getFromMemory(key: string) {
  return store.get(key);
}

export async function clearMemory() {
  store.clear();
}

export const SAVE_TO_MEMORY_TOOL = tool({
  name: 'save_to_memory',
  description: 'Save the a user preference or resume to memory for later retrieval.',
  parameters: z.object({
    key: z.string(),
    value: z.string(),
  }),
  execute: async ({ key, value }: { key: string; value: string }) => {
    try {
      await saveToMemory(key, value);
      return `Successfully saved preference to memory with key: ${key}`;
    } catch (error) {
      return `An error occurred while saving to memory: ${getExceptionMessage(error, true)}`;
    }
  },
});
export const GET_FROM_MEMORY_TOOL = tool({
  name: 'get_from_memory',
  description: 'Retrieve a user preference or resume from memory.',
  parameters: z.object({
    key: z.string(),
  }),
  execute: async ({ key }: { key: string }) => {
    try {
      const value = await getFromMemory(key);
      if (value) {
        return `Retrieved key from memory: ${key}. Content: ${value}`;
      } else {
        return `No memory found with key: ${key}`;
      }
    } catch (error) {
      return `An error occurred while retrieving from memory: ${getExceptionMessage(error, true)}`;
    }
  },
});

export const CLEAR_MEMORY_TOOL = tool({
  name: 'clear_memory',
  description: 'Clear all stored user preferences or resumes from memory.',
  parameters: z.object({}),
  execute: async () => {
    try {
      await clearMemory();
      return `Successfully cleared all user preferences from memory.`;
    } catch (error) {
      return `An error occurred while clearing memory: ${getExceptionMessage(error, true)}`;
    }
  },
});

export const MEMOR_TOOLS = [SAVE_TO_MEMORY_TOOL, GET_FROM_MEMORY_TOOL, CLEAR_MEMORY_TOOL];
