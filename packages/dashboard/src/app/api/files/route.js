// import { NextResponse } from 'next/server';
// import OpenAI from 'openai';
// const openAIKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
// // Initialize the OpenAI client
// const openai = new OpenAI({
//   apiKey: openAIKey,
// });

// export async function GET(request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const assistantId = searchParams.get('assistantId');
//     // Step 1: Retrieve the assistant details to get the vector store IDs
//     const assistantResponse = await openai.beta.assistants.retrieve(assistantId);

//     // Extract vector store IDs from assistant details
//     const vectorStoreIds = assistantResponse?.tool_resources?.file_search?.vector_store_ids || [];
//     if (vectorStoreIds.length === 0) {
//       return NextResponse.json({ data: [], message: 'No vector stores attached to this assistant' });
//     }

//     let allFiles = [];

//     // Step 2: Retrieve files from each vector store
//     for (const vectorStoreId of vectorStoreIds) {
//       const vectorStoreResponse = await openai.beta.vectorStores.files.list(vectorStoreId);
//       allFiles = [...vectorStoreResponse.data];
//     }

//     return NextResponse.json({ data: allFiles });
//   } catch (error) {
//     return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
//   }
// }
