import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const ALLOWED_UNITS = ['kg', 'g', 'L', 'mL', 'pcs', 'box', 'pack', 'bag'] as const
type Unit = typeof ALLOWED_UNITS[number]

const UNIT_LOOKUP: Record<string, Unit> = ALLOWED_UNITS.reduce(
  (acc, u) => {
    acc[u.toLowerCase()] = u
    return acc
  },
  {} as Record<string, Unit>,
)

const MAX_FILE_BYTES = 200 * 1024
const MAX_ROWS = 1000

function unquote(s: string): string {
  const trimmed = s.trim()
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/""/g, '"')
  }
  return trimmed
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `File too large (max ${MAX_FILE_BYTES / 1024} KB)` },
        { status: 400 }
      )
    }

    const text = await file.text()
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0)

    if (lines.length === 0) {
      return NextResponse.json({ error: 'No rows found in file' }, { status: 400 })
    }

    const headerPattern = /^(name|category)\s*,\s*unit$/i
    const startIndex = headerPattern.test(lines[0]) ? 1 : 0
    const dataLines = lines.slice(startIndex)

    if (dataLines.length === 0) {
      return NextResponse.json({ error: 'No data rows found in file' }, { status: 400 })
    }

    if (dataLines.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `Too many rows (max ${MAX_ROWS})` },
        { status: 400 }
      )
    }

    const errors: Array<{ row: number; name: string; reason: string }> = []
    const parsedRows: Array<{ row: number; name: string; unit: Unit }> = []

    dataLines.forEach((line, idx) => {
      const rowNumber = startIndex + idx + 1
      const commaIdx = line.indexOf(',')
      const rawName = commaIdx === -1 ? line : line.slice(0, commaIdx)
      const rawUnit = commaIdx === -1 ? '' : line.slice(commaIdx + 1)
      const name = unquote(rawName)
      const unitInput = unquote(rawUnit)

      if (!name) {
        errors.push({ row: rowNumber, name: '', reason: 'Name is required' })
        return
      }
      if (name.length > 100) {
        errors.push({ row: rowNumber, name, reason: 'Name exceeds 100 characters' })
        return
      }
      if (!unitInput) {
        errors.push({ row: rowNumber, name, reason: 'Unit is required' })
        return
      }
      const canonicalUnit = UNIT_LOOKUP[unitInput.toLowerCase()]
      if (!canonicalUnit) {
        errors.push({
          row: rowNumber,
          name,
          reason: `Invalid unit "${unitInput}". Allowed: ${ALLOWED_UNITS.join(', ')}`,
        })
        return
      }
      parsedRows.push({ row: rowNumber, name, unit: canonicalUnit })
    })

    if (parsedRows.length === 0) {
      return NextResponse.json({ created: 0, reactivated: 0, skipped: 0, errors })
    }

    const names = Array.from(new Set(parsedRows.map((r) => r.name)))
    const existing = await prisma.materialCategory.findMany({
      where: { name: { in: names } },
      select: { id: true, name: true, active: true },
    })
    const existingByName = new Map(existing.map((c) => [c.name, c]))

    let skipped = 0
    const seenInBatch = new Set<string>()
    const toCreate: Array<{ name: string; unit: Unit }> = []
    const toReactivate: Array<{ id: string; unit: Unit }> = []

    for (const row of parsedRows) {
      if (seenInBatch.has(row.name)) {
        skipped++
        continue
      }
      seenInBatch.add(row.name)

      const existingRow = existingByName.get(row.name)
      if (existingRow) {
        if (existingRow.active) {
          skipped++
        } else {
          toReactivate.push({ id: existingRow.id, unit: row.unit })
        }
      } else {
        toCreate.push({ name: row.name, unit: row.unit })
      }
    }

    let created = 0
    if (toCreate.length > 0) {
      const result = await prisma.materialCategory.createMany({
        data: toCreate,
        skipDuplicates: true,
      })
      created = result.count
      const racedSkipped = toCreate.length - result.count
      if (racedSkipped > 0) skipped += racedSkipped
    }

    if (toReactivate.length > 0) {
      await Promise.all(
        toReactivate.map((r) =>
          prisma.materialCategory.update({
            where: { id: r.id },
            data: { active: true, unit: r.unit },
          }),
        ),
      )
    }

    return NextResponse.json({
      created,
      reactivated: toReactivate.length,
      skipped,
      errors,
    })
  } catch (error) {
    console.error('Error importing material categories:', error)
    return NextResponse.json(
      { error: 'Failed to import categories' },
      { status: 500 }
    )
  }
}
