// pages/api/models/users.js

import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import axios from 'axios';
import { getToken } from '@/_common/utils/tokenManager';

// Get all users
export async function GET() {
  try {
    const response = await axios.get(`${apiUrl}/api/users/`);
    return NextResponse.json(response.data);
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// Create a new user
export async function POST(request) {
  try {
    const userData = await request.json();
    const response = await axios.post(`${apiUrl}/api/users`, userData);
    return NextResponse.json(response.data);
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// Update a user
export async function PUT(request) {
  try {
    const { id, ...userData } = await request.json();
    const token = await getToken();

    const response = await axios.put(`${apiUrl}/api/users/${id}`, userData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// Delete a user
export async function DELETE(request) {
  try {
    const { id } = await request.json();
    await axios.delete(`${apiUrl}/api/users/${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
