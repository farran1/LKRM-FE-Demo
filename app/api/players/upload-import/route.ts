import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file.' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse Excel file
    let workbook: XLSX.WorkBook
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' })
    } catch (error) {
      console.error('Error parsing Excel file:', error)
      return NextResponse.json(
        { error: 'Unable to parse the file. Please ensure it\'s a valid Excel or CSV file.' },
        { status: 400 }
      )
    }

    // Get first worksheet
    const worksheetName = workbook.SheetNames[0]
    if (!worksheetName) {
      return NextResponse.json(
        { error: 'The file appears to be empty or invalid.' },
        { status: 400 }
      )
    }

    const worksheet = workbook.Sheets[worksheetName]

    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false
    })

    if (!rawData || rawData.length === 0) {
      return NextResponse.json(
        { error: 'The file appears to be empty.' },
        { status: 400 }
      )
    }

    // Process the data
    const headers = rawData[0] as string[]
    const rows = rawData.slice(1) as any[][]

    // Generate unique import ID
    const importId = uuidv4()

    // Store processed data in memory for validation step
    // In a production app, you might want to store this in a database or cache
    const processedData = rows.map((row, index) => {
      const player: any = {}

      // Map columns based on headers
      headers.forEach((header, colIndex) => {
        const value = row[colIndex] || ''
        const normalizedHeader = header.toLowerCase().trim()

        // Map common column names to expected fields
        if (normalizedHeader.includes('name') || normalizedHeader.includes('full name')) {
          player.name = value
        } else if (normalizedHeader.includes('first') && normalizedHeader.includes('name')) {
          player.firstName = value
        } else if (normalizedHeader.includes('last') && normalizedHeader.includes('name')) {
          player.lastName = value
        } else if (normalizedHeader.includes('position') || normalizedHeader.includes('pos')) {
          player.position = value
        } else if (normalizedHeader.includes('jersey') || normalizedHeader.includes('number')) {
          player.jersey = value
        } else if (normalizedHeader.includes('phone') || normalizedHeader.includes('mobile')) {
          player.phoneNumber = value
        } else if (normalizedHeader.includes('height') || normalizedHeader.includes('ht')) {
          player.height = value
        } else if (normalizedHeader.includes('school') || normalizedHeader.includes('year')) {
          player.schoolYear = value
        }
      })

      return {
        id: index + 1,
        ...player,
        rowNumber: index + 2 // +2 because of 0-indexing and header row
      }
    })

    // Store in global for the validation step (in production, use proper storage)
    if (typeof globalThis !== 'undefined') {
      // @ts-ignore
      if (!globalThis.importSessions) {
        // @ts-ignore
        globalThis.importSessions = new Map()
      }
      // @ts-ignore
      globalThis.importSessions.set(importId, {
        data: processedData,
        headers: headers,
        timestamp: Date.now()
      })
    }

    return NextResponse.json({
      success: true,
      importId,
      totalRows: processedData.length,
      headers: headers,
      preview: processedData.slice(0, 5) // First 5 rows as preview
    })

  } catch (error) {
    console.error('Error processing file upload:', error)
    return NextResponse.json(
      { error: 'Failed to process the uploaded file. Please try again.' },
      { status: 500 }
    )
  }
}
