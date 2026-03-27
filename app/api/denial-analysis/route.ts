import { NextRequest, NextResponse } from 'next/server'

const DENIAL_ENGINE_URL = process.env.DENIAL_ENGINE_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') // 'build' or 'run'

  const endpoint =
    action === 'run'
      ? `${DENIAL_ENGINE_URL}/api/cases/run-analysis`
      : `${DENIAL_ENGINE_URL}/api/cases/build`

  try {
    const body = await request.json()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout))

    if (!upstream.ok) {
      const err = await upstream.text()
      return NextResponse.json({ error: err }, { status: upstream.status })
    }

    const data = await upstream.json()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Denial engine unavailable' }, { status: 502 })
  }
}
