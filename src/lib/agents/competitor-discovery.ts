import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

export const competitorDiscovery = async (url: string, focus: string, location: string) => {
  const model = new ChatOpenAI({ modelName: "gpt-4o", temperature: 0 });

  const prompt = `Find 5 direct and closest competitors for a company with the following details:
  URL: ${url}
  Focus: ${focus}
  Location: ${location}

  Return the results as a JSON array of objects with 'name' and 'url' properties.`;

  const response = await model.invoke(prompt);
  try {
    const competitors = JSON.parse(response.content as string);
    return competitors;
  } catch (e) {
    console.error("Failed to parse competitors response:", e);
    return [];
  }
};
