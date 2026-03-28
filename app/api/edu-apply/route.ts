import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const userId = formData.get('user_id') as string
    const email = formData.get('email') as string
    const role = formData.get('role') as string
    const institution = formData.get('institution') as string
    const idFile = formData.get('id_file') as File

    if (!userId || !email || !role || !institution || !idFile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    // Upload ID using service role (bypasses RLS)
    const ext = idFile.name.split('.').pop() || 'jpg'
    const filePath = `${userId}/id.${ext}`
    const buffer = Buffer.from(await idFile.arrayBuffer())

    const { error: uploadErr } = await supabase.storage
      .from('edu-ids')
      .upload(filePath, buffer, {
        upsert: true,
        contentType: idFile.type,
      })

    if (uploadErr) {
      console.error('Edu ID upload error:', uploadErr)
      return NextResponse.json({ error: 'Failed to upload ID' }, { status: 500 })
    }

    // Set plan to pending_edu
    await supabase.from('profiles').upsert(
      { id: userId, plan: 'pending_edu' },
      { onConflict: 'id' }
    )

    // Create application record
    await supabase.from('edu_applications').insert({
      user_id: userId,
      email,
      role,
      institution,
      id_file_path: filePath,
      status: 'pending',
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Edu apply error:', err)
    return NextResponse.json({ error: 'Application failed' }, { status: 500 })
  }
}
