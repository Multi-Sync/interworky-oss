// import { NextResponse } from 'next/server';
// import OpenAI from 'openai';
// import fs from 'fs/promises';
// import path from 'path';
// import { createReadStream } from 'fs';
// const openAIKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
// const openai = new OpenAI({
//   apiKey: openAIKey,
// });

// export const GET = {
//   config: {
//     api: {
//       bodyParser: false,
//     },
//   },
// };

// export async function POST(request) {
//   const MAX_FILE_SIZE_MB = 150;
//   const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

//   try {
//     // Parse form data
//     const formData = await request.formData();
//     const file = formData.get('file');
//     const assistantId = formData.get('assistantId');
//     if (!file) {
//       return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
//     }

//     const fileBuffer = await file.arrayBuffer();
//     const fileSize = fileBuffer.byteLength;

//     // Check file size limit
//     if (fileSize > MAX_FILE_SIZE_BYTES) {
//       return NextResponse.json({ error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit` }, { status: 400 });
//     }

//     // Define temp file path
//     const tempDir = '/tmp'; // Standard temp directory
//     const tempFilePath = path.join(tempDir, file.name);

//     // Write file to temp directory
//     await fs.writeFile(tempFilePath, Buffer.from(fileBuffer));

//     // Upload file to OpenAI
//     const fileStream = createReadStream(tempFilePath);
//     const uploadedFile = await openai.files.create({
//       file: fileStream,
//       purpose: 'assistants',
//     });

//     // Remove file from temp directory after upload
//     await fs.unlink(tempFilePath);

//     // Retrieve assistant to get vector store IDs
//     const assistantResponse = await openai.beta.assistants.retrieve(assistantId);
//     const vectorStoreIds = assistantResponse?.tool_resources?.file_search?.vector_store_ids || [];

//     let vectorStoreId;

//     if (vectorStoreIds.length > 0) {
//       vectorStoreId = vectorStoreIds[0]; // Use existing vector store
//     } else {
//       // Create a new vector store if none exists
//       const vectorStore = await openai.beta.vectorStores.create({
//         name: 'generated-from-dashboard',
//       });
//       vectorStoreId = vectorStore.id;

//       // Add new vector store ID to Assistant without affecting other settings
//       await openai.beta.assistants.update(assistantId, {
//         tool_resources: {
//           file_search: {
//             vector_store_ids: [...vectorStoreIds, vectorStoreId], // Preserve existing IDs
//           },
//         },
//       });
//     }

//     // Attach file to vector store
//     await openai.beta.vectorStores.files.create(vectorStoreId, {
//       file_id: uploadedFile.id,
//     });

//     return NextResponse.json({
//       message: 'File uploaded and added to vector store successfully',
//       fileId: uploadedFile.id,
//     });
//   } catch (error) {
//     console.error('Upload error:', error);
//     return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
//   }
// }
