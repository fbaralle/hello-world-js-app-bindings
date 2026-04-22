async function checkD1(db) {
  const start = performance.now()
  try {
    await db.prepare('SELECT 1').first()
    return { status: 'ok', latency: Math.round(performance.now() - start) }
  } catch (e) {
    return {
      status: 'error',
      latency: Math.round(performance.now() - start),
      error: e instanceof Error ? e.message : 'Unknown error',
    }
  }
}

async function checkKV(kv) {
  const start = performance.now()
  try {
    await kv.get('__healthcheck__')
    return { status: 'ok', latency: Math.round(performance.now() - start) }
  } catch (e) {
    return {
      status: 'error',
      latency: Math.round(performance.now() - start),
      error: e instanceof Error ? e.message : 'Unknown error',
    }
  }
}

async function checkR2(r2) {
  const start = performance.now()
  try {
    await r2.head('__healthcheck__')
    return { status: 'ok', latency: Math.round(performance.now() - start) }
  } catch (e) {
    return {
      status: 'error',
      latency: Math.round(performance.now() - start),
      error: e instanceof Error ? e.message : 'Unknown error',
    }
  }
}

export async function handleBindingStatus(_request, env) {
  const [d1, kv_sessions, kv_flags, r2] = await Promise.all([
    checkD1(env.DB),
    checkKV(env.SESSIONS),
    checkKV(env.FLAGS),
    checkR2(env.MEDIA),
  ])

  const services = { d1, kv_sessions, kv_flags, r2 }
  const errorCount = Object.values(services).filter((s) => s.status === 'error').length
  const status = errorCount === 0 ? 'healthy' : errorCount < 3 ? 'degraded' : 'unhealthy'

  return new Response(
    JSON.stringify({ status, timestamp: new Date().toISOString(), services }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
