import { NextResponse } from 'next/server';
import { join } from 'path';
import { readFileSync } from 'fs';

export async function GET() {
  const packageJsonPath = join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  return NextResponse.json({ version: packageJson.version });
}
