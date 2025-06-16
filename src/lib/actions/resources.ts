'use server';
import { type NewResourceParams, insertResourceSchema } from "~/server/db/schema";
import { resources, embeddings as embeddingsTable } from "~/server/db/schema";
import { db } from "~/server/db";
import { generateEmbeddings } from '../ai/embedding';

// This function is a Server Action, as denoted by the “use server”; directive at the top of the file. This means that it can be called anywhere in your Next.js application. This function will take an input, run it through a Zod schema to ensure it adheres to the correct schema, and then creates a new resource in the database. This is the ideal location to generate and store embeddings of the newly created resources.

export const createResource = async (input: NewResourceParams) => {
    try {
        const { content } = insertResourceSchema.parse(input);

        const [resource] = await db
            .insert(resources)
            .values({ content })
            .returning();

        const embeddings = await generateEmbeddings(content);
        await db.insert(embeddingsTable).values(
            embeddings.map(embedding => ({
                resourceId: resource!.id,
                ...embedding,
            })),
        );

        return 'Resource successfully created and embedded.';
    } catch (e) {
        if (e instanceof Error)
            return e.message.length > 0 ? e.message : 'Error, please try again.';
    }
};