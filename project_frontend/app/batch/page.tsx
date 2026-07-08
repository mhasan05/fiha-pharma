'use client'
import { useBatchIdSearchQuery, useBatchIdSearchapiQuery } from '@/redux/feature/stockSlice'
import React, { useState } from 'react'

interface Product {
  id: number
  product: string
  stock: number
  cost_price: string
  mrp: string
  selling_price: string
  total: string
  created_on: string
}

interface BatchEntry {
  batch_id: string
  products: Product[]
  total_products: number
  total_value: string
  created_on?: string
}

interface BatchSearchResponse {
  status?: string
  data?: Array<{ batch_id: string }>
  start_date?: string
  end_date?: string
  grand_total_products?: number
  grand_total_value?: string
  batches?: BatchEntry[]
}

export default function Batch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [activeFilter, setActiveFilter] = useState<{ q: string; start_date: string; end_date: string } | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const { data: raw, isLoading: isBatchLoading, error: batchError } = useBatchIdSearchapiQuery(
    activeFilter ?? { q: '', start_date: '', end_date: '' },
    { skip: !activeFilter }
  ) as { data: BatchSearchResponse | undefined; isLoading: boolean; error: unknown }

  const isBatchIdOnlySearch = Boolean(activeFilter?.q && !activeFilter?.start_date && !activeFilter?.end_date)

  const {
    data: singleBatchRaw,
    isLoading: isSingleBatchLoading,
    error: singleBatchError,
  } = useBatchIdSearchQuery(activeFilter?.q ?? '', { skip: !isBatchIdOnlySearch }) as {
    data: {
      batch_id?: string
      total_products?: number
      total_value?: string
      created_on?: string
      products?: Product[]
      batches?: BatchEntry[]
    } | undefined
    isLoading: boolean
    error: unknown
  }

  const { data: suggestionRaw } = useBatchIdSearchapiQuery(
    { q: searchQuery.trim(), start_date: '', end_date: '' },
    { skip: !searchQuery.trim() }
  ) as { data: BatchSearchResponse | undefined }

  // Default view: every confirmed batch id (shown when no search is active).
  const { data: allBatchesRaw, isLoading: isAllBatchesLoading, error: allBatchesError } =
    useBatchIdSearchapiQuery(
      { q: '', start_date: '', end_date: '' },
      { skip: !!activeFilter }
    ) as { data: BatchSearchResponse | undefined; isLoading: boolean; error: unknown }

  const allBatchIds = Array.from(
    new Set((allBatchesRaw?.data ?? []).map((b) => b.batch_id).filter(Boolean))
  )

  const batchSuggestions = Array.from(
    new Set(
      [
        ...(suggestionRaw?.data?.map((item) => item.batch_id) ?? []),
        ...(suggestionRaw?.batches?.map((batch) => batch.batch_id) ?? []),
      ].filter((id) => id?.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    )
  ).slice(0, 10)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchQuery.trim()

    // Batch ID only search: ignore date filter and search globally by batch id.
    if (query) {
      setActiveFilter({ q: query, start_date: '', end_date: '' })
      setShowSuggestions(false)
      return
    }

    // Date only search
    setActiveFilter({ q: '', start_date: startDate, end_date: endDate })
  }

  const handleSuggestionClick = (batchId: string) => {
    setSearchQuery(batchId)
    setActiveFilter({ q: batchId, start_date: '', end_date: '' })
    setShowSuggestions(false)
  }

  const handleReset = () => {
    setSearchQuery('')
    setStartDate('')
    setEndDate('')
    setShowSuggestions(false)
    setActiveFilter(null)
  }

  const showResults = !!activeFilter

  // A date-range search shows matched batches as cards (like "All Batches"); the
  // user clicks one to drill into its detailed product breakdown.
  const isDateRangeSearch = showResults && !isBatchIdOnlySearch
  const filteredBatchIds = Array.from(
    new Set(
      [
        ...(raw?.data?.map((b) => b.batch_id) ?? []),
        ...(raw?.batches?.map((b) => b.batch_id) ?? []),
      ].filter(Boolean)
    )
  )

  const normalizedBatches: BatchEntry[] = isBatchIdOnlySearch
    ? (() => {
      if (!singleBatchRaw) return []
      if (Array.isArray(singleBatchRaw?.batches)) return singleBatchRaw.batches
      if (Array.isArray(singleBatchRaw?.products)) {
        return [
          {
            batch_id: singleBatchRaw.batch_id || activeFilter?.q || '-',
            products: singleBatchRaw.products,
            total_products: singleBatchRaw.total_products ?? singleBatchRaw.products.length,
            total_value: singleBatchRaw.total_value ?? '0.00',
            created_on: singleBatchRaw.created_on,
          },
        ]
      }
      return []
    })()
    : raw?.batches ?? []

  const summaryTotalBatches = normalizedBatches.length
  const summaryTotalProducts = normalizedBatches.reduce(
    (sum, batch) => sum + (batch.total_products ?? batch.products?.length ?? 0),
    0
  )
  const summaryGrandTotalValue = normalizedBatches
    .reduce((sum, batch) => sum + Number(batch.total_value ?? 0), 0)
    .toFixed(2)

  const effectiveIsLoading = isBatchLoading || (isBatchIdOnlySearch && isSingleBatchLoading)
  const effectiveError = batchError || (isBatchIdOnlySearch ? singleBatchError : null)

  const tableRows = normalizedBatches.flatMap((batch) =>
    batch.products.map((product) => ({
      batch_id: batch.batch_id,
      total_products: batch.total_products,
      batch_total_value: batch.total_value,
      created_on: batch.created_on,
      ...product,
    }))
  ) ?? []

  const formatPrintDate = (value?: string | null) => {
    if (!value) return ''
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const handlePrint = () => {
    if (!tableRows.length) {
      return
    }

    const startLabel = activeFilter?.start_date || ''
    const endLabel = activeFilter?.end_date || ''
    const periodLabel =
      startLabel || endLabel ? `${startLabel} ${endLabel}`.trim() : 'All Time'
    const queryLabel = activeFilter?.q || 'All Batches'
    const logoSrc = `${window.location.origin}/invoicelogo.jpg`

    const renderRow = (row: typeof tableRows[number], i: number) => `
          <tr>
            <td class="ctr">${i + 1}</td>
            <td class="batch-cell">${row.batch_id}</td>
            <td>${row.id}</td>
            <td class="product-cell">${row.product}</td>
            <td class="num">${row.stock}</td>
            <td class="num">৳${row.cost_price}</td>
            <td class="num">৳${row.mrp}</td>
            <td class="num">৳${row.selling_price}</td>
            <td class="num strong">৳${row.total}</td>
            <td>${formatPrintDate(row.created_on)}</td>
          </tr>
        `

    const firstPageRows = tableRows.slice(0, 10)
    const overflowRows = tableRows.slice(10)
    const firstPageMarkup = firstPageRows.map((r, i) => renderRow(r, i)).join('')
    const overflowMarkup = overflowRows
      .map((r, i) => renderRow(r, i + 10))
      .join('')

    const printHtml = `<!DOCTYPE html>
<html>
  <head>
    <title>Batch Report</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        background: #fff;
        color: #000;
        line-height: 1.45;
        font-size: 12px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .page { padding: 14px 22px; max-width: 1200px; margin: 0 auto; }

      .letterhead {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #1a3a52;
        padding-bottom: 8px;
        margin-bottom: 10px;
        page-break-inside: avoid;
      }
      .letterhead-brand { display: flex; align-items: center; gap: 12px; }
      .letterhead-brand img { height: 44px; object-fit: contain; }
      .letterhead-brand .name h2 {
        font-size: 17px;
        color: #000;
        letter-spacing: 0.4px;
        margin-bottom: 1px;
        font-weight: 700;
      }
      .letterhead-brand .name p { font-size: 10.5px; color: #000; }
      .letterhead-contact { text-align: right; font-size: 10.5px; color: #000; line-height: 1.35; }
      .letterhead-contact p { margin-bottom: 1px; }
      .letterhead-contact strong { color: #000; }

      .report-title { text-align: center; margin-bottom: 10px; }
      .report-title h1 {
        font-size: 19px;
        color: #000;
        letter-spacing: 2.5px;
        font-weight: 700;
      }
      .report-title .subtitle {
        font-size: 10.5px;
        color: #000;
        margin-top: 2px;
        letter-spacing: 0.4px;
      }

      .filter-panel {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 3px 22px;
        padding: 8px 14px;
        background: #f8fafc;
        border-left: 3px solid #1a3a52;
        margin-bottom: 10px;
        font-size: 11px;
        page-break-inside: avoid;
      }
      .filter-row { display: flex; gap: 6px; }
      .filter-label { color: #000; min-width: 92px; }
      .filter-value { color: #000; font-weight: 600; }

      table.data {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
      }
      table.data thead { display: table-header-group; }
      table.data thead tr { border-bottom: 2px solid #1a3a52; }
      table.data thead th {
        padding: 9px 8px;
        text-align: left;
        color: #000;
        font-weight: 700;
        font-size: 10.5px;
        letter-spacing: 0.4px;
        text-transform: uppercase;
      }
      table.data thead th.num { text-align: right; }
      table.data thead th.ctr { text-align: center; }

      table.data tbody td {
        padding: 5px 8px;
        border-bottom: 1px solid #e5e7eb;
        font-size: 11px;
        vertical-align: middle;
      }
      table.data tbody tr { page-break-inside: avoid; }
      table.data tbody tr:nth-child(odd) { background: #fafbfc; }
      .page-break { page-break-before: always; break-before: page; }

      .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
      .ctr { text-align: center; }
      .batch-cell { font-family: 'Consolas', 'Monaco', monospace; font-size: 10.5px; color: #000; font-weight: 600; white-space: nowrap; }
      .product-cell { font-weight: 500; color: #000; }
      .strong { font-weight: 700; color: #000; }

      .summary {
        margin-top: 10px;
        display: flex;
        justify-content: flex-end;
        page-break-inside: avoid;
      }
      .summary-box {
        min-width: 300px;
        border: 1px solid #d1d5db;
        border-top: 2px solid #1a3a52;
      }
      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 14px;
        font-size: 11.5px;
        border-bottom: 1px solid #e5e7eb;
      }
      .summary-row:last-child { border-bottom: 0; }
      .summary-row .label { color: #000; }
      .summary-row .value { font-variant-numeric: tabular-nums; font-weight: 600; color: #000; }
      .summary-row.grand {
        border-top: 2px solid #1a3a52;
        font-size: 13px;
      }
      .summary-row.grand .label,
      .summary-row.grand .value { color: #000; font-weight: 700; }

      .signatures {
        margin-top: 28px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 80px;
        page-break-inside: avoid;
      }
      .sig-block { text-align: center; }
      .sig-line {
        border-top: 1px solid #000;
        padding-top: 4px;
        font-size: 10.5px;
        color: #000;
        font-weight: 500;
        letter-spacing: 0.3px;
      }

      .doc-footer {
        margin-top: 14px;
        padding-top: 8px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        font-size: 9.5px;
        color: #000;
        letter-spacing: 0.2px;
      }

      .first-page-block { page-break-inside: avoid; }

      @media print {
        body { margin: 0; padding: 0; }
        .page { padding: 0; max-width: none; }
        table.data thead { display: table-header-group; }
      }
      @page { size: A4 landscape; margin: 12mm; }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="letterhead">
        <div class="letterhead-brand">
          <img src="${logoSrc}" alt="Fiha Pharma" />
          <div class="name">
            <h2>Fiha Pharma</h2>
            <p>Wholesale Pharmaceutical Supplier</p>
          </div>
        </div>
        <div class="letterhead-contact">
          <p><strong>Phone:</strong> 01558920438</p>
          <p>Holding No-58, Word No-45, Helal Market</p>
          <p>Uttar Khan, Uttara, Dhaka-1230</p>
        </div>
      </div>

      <div class="report-title">
        <h1>BATCH REPORT</h1>
        <div class="subtitle">${periodLabel}</div>
      </div>

      <div class="filter-panel">
        <div class="filter-row"><span class="filter-label">Query:</span><span class="filter-value">${queryLabel}</span></div>
        <div class="filter-row"><span class="filter-label">Total Batches:</span><span class="filter-value">${summaryTotalBatches}</span></div>
        <div class="filter-row"><span class="filter-label">Total Products:</span><span class="filter-value">${summaryTotalProducts}</span></div>
        <div class="filter-row"><span class="filter-label">From:</span><span class="filter-value">${startLabel}</span></div>
        <div class="filter-row"><span class="filter-label">To:</span><span class="filter-value">${endLabel}</span></div>
        <div class="filter-row"><span class="filter-label">Generated:</span><span class="filter-value">${new Date().toLocaleString()}</span></div>
      </div>

      <div class="first-page-block">
        <table class="data">
          <thead>
            <tr>
              <th class="ctr" style="width:30px;">#</th>
              <th>Batch ID</th>
              <th>Prod. ID</th>
              <th>Product</th>
              <th class="num">Stock</th>
              <th class="num">Cost</th>
              <th class="num">MRP</th>
              <th class="num">Sell</th>
              <th class="num">Total</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>${firstPageMarkup}</tbody>
        </table>

        <div class="summary">
          <div class="summary-box">
            <div class="summary-row">
              <span class="label">Total Batches</span>
              <span class="value">${summaryTotalBatches}</span>
            </div>
            <div class="summary-row">
              <span class="label">Total Products</span>
              <span class="value">${summaryTotalProducts}</span>
            </div>
            <div class="summary-row grand">
              <span class="label">GRAND TOTAL VALUE</span>
              <span class="value">৳${summaryGrandTotalValue}</span>
            </div>
          </div>
        </div>

        <div class="signatures">
          <div class="sig-block">
            <div class="sig-line">Prepared By</div>
          </div>
          <div class="sig-block">
            <div class="sig-line">Authorized Signature</div>
          </div>
        </div>
      </div>

      ${overflowRows.length > 0 ? `
      <div class="page-break"></div>
      <table class="data">
        <thead>
          <tr>
            <th class="ctr" style="width:30px;">#</th>
            <th>Batch ID</th>
            <th>Prod. ID</th>
            <th>Product</th>
            <th class="num">Stock</th>
            <th class="num">Cost</th>
            <th class="num">MRP</th>
            <th class="num">Sell</th>
            <th class="num">Total</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>${overflowMarkup}</tbody>
      </table>
      ` : ''}

      <div class="doc-footer">
        <span>Fiha Pharma Confidential Business Document</span>
        <span>Printed: ${new Date().toLocaleString()}</span>
      </div>
    </div>
  </body>
</html>`

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.style.opacity = '0'
    iframe.setAttribute('aria-hidden', 'true')

    const cleanup = () => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
    }

    iframe.onload = () => {
      const cw = iframe.contentWindow
      if (!cw) {
        cleanup()
        return
      }
      cw.addEventListener('afterprint', cleanup)
      cw.focus()
      cw.print()
      setTimeout(cleanup, 10000)
    }

    iframe.srcdoc = printHtml
    document.body.appendChild(iframe)
  }

  // Derived disable flags
  const isBatchIdTyped = Boolean(searchQuery.trim())
  const isDatesSet = Boolean(startDate || endDate)

  return (
    <div className="min-h-screen p-3 sm:p-4 lg:p-6">
      <div className="">

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-100 md:text-3xl">Batch Management</h1>
          <p className="mt-1 text-sm text-slate-400">Search and filter batches by date range and batch ID</p>
        </div>

        {/* Filter Card */}
        <div className="mb-6 rounded-xl border border-slate-700/60 bg-gray-800 p-4 shadow-xl backdrop-blur md:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">Search Filters</h2>
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

              {/* Start Date — disabled when batch ID is typed */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-400">
                  Start Date
                  {isBatchIdTyped && (
                    <span className="ml-1 text-slate-500">(cleared by Batch ID)</span>
                  )}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate}
                  disabled={isBatchIdTyped}
                  className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:select-none"
                />
              </div>

              {/* End Date — disabled when batch ID is typed */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-400">
                  End Date
                  {isBatchIdTyped && (
                    <span className="ml-1 text-slate-500">(cleared by Batch ID)</span>
                  )}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  disabled={isBatchIdTyped}
                  className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:select-none"
                />
              </div>

              {/* Search Query — disabled when dates are set; dropdown fixed with z-50 + top-full */}
              <div className="relative flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-400">
                  Batch ID / Keyword
                  {isDatesSet && (
                    <span className="ml-1 text-slate-500">(cleared by Date)</span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="e.g. bat, uuid..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowSuggestions(Boolean(e.target.value.trim()))
                  }}
                  onFocus={() => setShowSuggestions(Boolean(searchQuery.trim()))}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 150)
                  }}
                  disabled={isDatesSet}
                  className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:select-none"
                />

                {/* Suggestions dropdown — z-50, top-full, w-full scoped to relative parent */}
                {showSuggestions && batchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 z-50 mt-1 max-h-36 w-full overflow-y-auto rounded-lg border border-slate-600 bg-slate-900 shadow-lg">
                    {batchSuggestions.map((batchId) => (
                      <button
                        key={batchId}
                        type="button"
                        onMouseDown={() => handleSuggestionClick(batchId)}
                        className="block w-full border-b border-slate-800 px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800"
                      >
                        {batchId}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 active:scale-95"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Active filter summary */}
            {activeFilter && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                {activeFilter.start_date && (
                  <span className="rounded-full border border-slate-600 bg-slate-800 px-3 py-1">
                    From: <span className="text-slate-200">{activeFilter.start_date}</span>
                  </span>
                )}
                {activeFilter.end_date && (
                  <span className="rounded-full border border-slate-600 bg-slate-800 px-3 py-1">
                    To: <span className="text-slate-200">{activeFilter.end_date}</span>
                  </span>
                )}
                {activeFilter.q && (
                  <span className="rounded-full border border-cyan-600/40 bg-cyan-500/10 px-3 py-1 text-cyan-300">
                    Query: {activeFilter.q}
                  </span>
                )}
              </div>
            )}
          </form>
        </div>

        {/* All Batches list (default view, when no search is active) */}
        {!showResults && (
          <div className="mb-6 rounded-xl border border-slate-700/60 bg-gray-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-700/60 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-100">All Batches</h2>
              <span className="text-sm text-slate-400">{allBatchIds.length} batch(es)</span>
            </div>
            <div className="p-4">
              {isAllBatchesLoading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-800" />
                  ))}
                </div>
              ) : allBatchesError ? (
                <p className="text-sm text-red-400">Error loading batches. Please try again.</p>
              ) : allBatchIds.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">No batches found.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {allBatchIds.map((batchId) => (
                    <button
                      key={batchId}
                      type="button"
                      onClick={() => handleSuggestionClick(batchId)}
                      className="group flex items-center justify-between gap-2 rounded-lg border border-slate-700/60 bg-slate-900/40 px-4 py-3 text-left transition hover:border-cyan-500/40 hover:bg-slate-800"
                    >
                      <span className="truncate font-mono text-xs text-cyan-300">{batchId}</span>
                      <span className="shrink-0 text-xs text-slate-500 group-hover:text-cyan-300">
                        View details →
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Grand Summary Bar */}
        {showResults && (
          <div className="mb-4 flex flex-wrap gap-4 rounded-xl border border-slate-700/50 bg-slate-800/60 px-5 py-3">
            <p className="text-sm text-slate-400">
              Total Batches: <span className="font-semibold text-slate-100">{summaryTotalBatches}</span>
            </p>
            <p className="text-sm text-slate-400">
              Grand Total Products: <span className="font-semibold text-slate-100">{summaryTotalProducts}</span>
            </p>
            <p className="text-sm text-slate-400">
              Grand Total Value: <span className="font-bold text-emerald-400">৳{summaryGrandTotalValue}</span>
            </p>
            <button
              type="button"
              onClick={handlePrint}
              className="ml-auto rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
              disabled={!tableRows.length}
            >
              Print Table
            </button>
          </div>
        )}

        {/* Date-range results — batch cards (drill into one for details) */}
        {showResults && isDateRangeSearch && (
          <div className="mb-6 rounded-xl border border-slate-700/60 bg-gray-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-700/60 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-100">Search Results</h2>
              <span className="text-sm text-slate-400">{filteredBatchIds.length} batch(es)</span>
            </div>
            <div className="p-4">
              {effectiveIsLoading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-800" />
                  ))}
                </div>
              ) : effectiveError ? (
                <p className="text-sm text-red-400">Error loading batches. Please try again.</p>
              ) : filteredBatchIds.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">No batches found for the selected date range.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredBatchIds.map((batchId) => (
                    <button
                      key={batchId}
                      type="button"
                      onClick={() => handleSuggestionClick(batchId)}
                      className="group flex items-center justify-between gap-2 rounded-lg border border-slate-700/60 bg-slate-900/40 px-4 py-3 text-left transition hover:border-cyan-500/40 hover:bg-slate-800"
                    >
                      <span className="truncate font-mono text-xs text-cyan-300">{batchId}</span>
                      <span className="shrink-0 text-xs text-slate-500 group-hover:text-cyan-300">
                        View details →
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Batch Table Results — detailed view for a specific batch */}
        {showResults && isBatchIdOnlySearch && (
          <div className="mb-6 rounded-xl border border-slate-700/60 bg-gray-800 shadow-xl backdrop-blur">
            <div className="border-b border-slate-700/60 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-100">Batch Table</h2>
            </div>
            <div className="p-4">
              {effectiveIsLoading && (
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-800" />
                  ))}
                </div>
              )}
              {Boolean(effectiveError) ? (
                <p className="text-sm text-red-400">Error loading batches. Please try again.</p>
              ) : null}
              {!effectiveIsLoading && !effectiveError && normalizedBatches.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-500">No batches found for the selected filters.</p>
              )}
              {!effectiveIsLoading && tableRows.length > 0 && (
                <>
                  <div className="overflow-x-auto rounded-lg border border-slate-700/60">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700 bg-slate-800/80">
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Batch ID</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Product ID</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Product</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Stock</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Cost Price</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">MRP</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Sell Price</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Total</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableRows.map((row, idx) => (
                          <tr
                            key={`${row.batch_id}-${row.id}`}
                            className={`border-b border-slate-700/50 transition hover:bg-slate-800/40 ${idx % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-800/20'}`}
                          >
                            <td className="px-4 py-3 font-mono text-xs text-cyan-300">{row.batch_id}</td>
                            <td className="px-4 py-3 text-slate-400">{row.id}</td>
                            <td className="px-4 py-3 font-medium text-slate-100">{row.product}</td>
                            <td className="px-4 py-3 text-right text-slate-200">{row.stock}</td>
                            <td className="px-4 py-3 text-right text-slate-200">৳{row.cost_price}</td>
                            <td className="px-4 py-3 text-right text-slate-200">৳{row.mrp}</td>
                            <td className="px-4 py-3 text-right text-slate-200">৳{row.selling_price}</td>
                            <td className="px-4 py-3 text-right font-semibold text-emerald-400">৳{row.total}</td>
                            <td className="px-4 py-3 text-right text-xs text-slate-400">
                              {formatPrintDate(row.created_on)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700/50 bg-slate-800/50 px-5 py-3">
                    <p className="text-sm text-slate-400">
                      Total Batches: <span className="font-semibold text-slate-100">{summaryTotalBatches}</span>
                    </p>
                    <p className="text-sm text-slate-400">
                      Grand Total Products: <span className="font-semibold text-slate-100">{summaryTotalProducts}</span>
                    </p>
                    <p className="text-sm text-slate-400">
                      Grand Total Value: <span className="text-lg font-bold text-emerald-400">৳{summaryGrandTotalValue}</span>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}