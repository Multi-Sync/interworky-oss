// import { NextResponse } from 'next/server';

// export async function GET(request) {
//   const { searchParams } = new URL(request.url);
//   const fileId = searchParams.get('fileId');
//   const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

//   if (!fileId) {
//     return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
//   }

//   try {
//     const response = await fetch(`https://api.openai.com/v1/files/${fileId}`, {
//       headers: {
//         Authorization: `Bearer ${apiKey}`,
//         'Content-Type': 'application/json',
//       },
//     });

//     if (!response.ok) {
//       return NextResponse.json({ error: 'Failed to retrieve file details' }, { status: response.status });
//     }

//     const fileData = await response.json();
//     return NextResponse.json(fileData);
//   } catch (error) {
//     return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
//   }
// }
