// import { NextResponse } from 'next/server';

// export async function DELETE(request) {
//   const { searchParams } = new URL(request.url);
//   const vectorStoreId = searchParams.get('vectorStoreId');
//   const fileId = searchParams.get('fileId');
//   const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

//   if (!vectorStoreId || !fileId) {
//     return NextResponse.json({ error: 'vectorStoreId and fileId are required' }, { status: 400 });
//   }

//   try {
//     // Step 1: Delete from Vector Store
//     const vectorStoreResponse = await fetch(
//       `https://api.openai.com/v1/vector_stores/${vectorStoreId}/files/${fileId}`,
//       {
//         method: 'DELETE',
//         headers: {
//           Authorization: `Bearer ${apiKey}`,
//           'Content-Type': 'application/json',
//           'OpenAI-Beta': 'assistants=v2',
//         },
//       },
//     );

//     if (!vectorStoreResponse.ok) {
//       return NextResponse.json(
//         { error: 'Failed to delete file from vector store' },
//         { status: vectorStoreResponse.status },
//       );
//     }

//     // Step 2: Delete from OpenAI File Storage
//     const fileDeleteResponse = await fetch(`https://api.openai.com/v1/files/${fileId}`, {
//       method: 'DELETE',
//       headers: {
//         Authorization: `Bearer ${apiKey}`,
//         'Content-Type': 'application/json',
//       },
//     });

//     if (!fileDeleteResponse.ok) {
//       return NextResponse.json(
//         { error: 'Failed to delete file from OpenAI storage' },
//         { status: fileDeleteResponse.status },
//       );
//     }

//     return NextResponse.json({ message: 'File deleted successfully' });
//   } catch (error) {
//     return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
//   }
// }
