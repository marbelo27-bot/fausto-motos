# Active Context: Motorcycle Workshop Management System — FAUSTO MOTOS

## Current State

**App Status**: ✅ Fully functional motorcycle workshop management system with earnings dashboard

The app is a complete workshop management system for Argentine motorcycle shops, built with Next.js 16, TypeScript, Tailwind CSS 4, Zustand for state management, and jsPDF for PDF generation.

## Recently Completed

- [x] Base Next.js 16 setup with App Router
- [x] TypeScript configuration with strict mode
- [x] Tailwind CSS 4 integration
- [x] ESLint configuration
- [x] Memory bank documentation
- [x] Recipe system for common features
- [x] **Full motorcycle workshop management app**
  - [x] Dashboard with stats and quick actions
  - [x] Clients module (CRUD, full profile, history view)
  - [x] Motorcycles module (24 Argentine brands, 500+ models)
  - [x] Reception module (condition sliders, image upload)
  - [x] Service Orders module (parts, labor, warranty, status)
  - [x] Parts/Repuestos module (inventory, cost/sale price)
  - [x] Payments module (anticipo/total/saldo, multiple methods)
  - [x] PDF generation (reception, service order, payment receipt)
  - [x] Zustand store with localStorage persistence
- [x] **Logo integration**
  - [x] `public/logo.svg` — placeholder SVG logo (replace with actual logo)
  - [x] `src/lib/logoData.ts` — async logo loader for PDF use (canvas-based PNG conversion)
  - [x] Sidebar shows logo via `next/image` with fallback to emoji icon
  - [x] All PDF headers include logo (top-right corner, white background)

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Main app with section routing | ✅ Ready |
| `src/app/layout.tsx` | Root layout | ✅ Ready |
| `src/app/globals.css` | Global styles + custom CSS classes | ✅ Ready |
| `src/components/Sidebar.tsx` | Navigation sidebar | ✅ Ready |
| `src/components/Dashboard.tsx` | Stats dashboard | ✅ Ready |
| `src/components/Clients.tsx` | Client management | ✅ Ready |
| `src/components/Motorcycles.tsx` | Motorcycle management | ✅ Ready |
| `src/components/Reception.tsx` | Vehicle reception | ✅ Ready |
| `src/components/ServiceOrders.tsx` | Service order management | ✅ Ready |
| `src/components/Parts.tsx` | Parts inventory | ✅ Ready |
| `src/components/Payments.tsx` | Payment management | ✅ Ready |
| `src/lib/types.ts` | TypeScript interfaces | ✅ Ready |
| `src/lib/store.ts` | Zustand store with persistence | ✅ Ready |
| `src/lib/motorcycleData.ts` | Argentina motorcycle brands/models | ✅ Ready |
| `src/lib/pdfGenerator.ts` | PDF generation (jsPDF) | ✅ Ready |
| `src/components/Quotes.tsx` | Quote management (CRUD + PDF) | ✅ Ready |
| `.kilocode/` | AI context & recipes | ✅ Ready |

## Dependencies Added

- `jspdf` + `jspdf-autotable` — PDF generation
- `zustand` — State management with localStorage persistence
- `uuid` + `@types/uuid` — Unique ID generation

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| 2025-02 | Full motorcycle workshop management system built |
| 2026-02 | Logo integration: public/logo.svg, logoData.ts, Sidebar + PDF headers |
| 2026-02 | Added detailed earnings breakdown section to Dashboard: total earnings (labor + parts), individual cards for mano de obra and repuestos with percentages, and a visual proportional bar chart |
| 2026-02 | Renamed to FAUSTO MOTOS, removed logo from PDFs, fixed date bug in ServiceOrders |
| 2026-02 | Fixed date bug in all form components: use local date + getEmptyForm() factory functions in Reception, Payments, ServiceOrders |
| 2026-02 | Fixed date display bug: new Date("YYYY-MM-DD") parses as UTC midnight, showing wrong day in UTC-3. Fixed by appending "T00:00:00" in all toLocaleDateString() calls across ServiceOrders, Reception, Payments, Dashboard, Clients, pdfGenerator (re-applied comprehensively) |
| 2026-02 | Added Parts Inventory Margin section to Dashboard: total cost price, total sale price, profit difference, and margin percentage with visual bar chart |
| 2026-02 | Applied full dark color theme: #CAF404 (lime), #11A900 (green), #FFF, #000, #0F0 — updated globals.css, all components, Sidebar, Dashboard, and pdfGenerator (black header with lime accent) |
| 2026-02 | Fixed dark theme contrast: explicit background on tbody tr, td, table; improved td text color to #ddd; form inputs/selects/textareas use #222 background; select options styled dark; hover row uses #242424 |
| 2026-02 | Replaced table-based lists in all 6 section pages (Clients, Motorcycles, Reception, ServiceOrders, Parts, Payments) with Dashboard-style card rows: background #f8fafc, border #e2e8f0, flex layout matching "Últimas Órdenes" in Dashboard |
| 2026-02 | Changed card background color in all 6 section pages to dark blue (#1e2a4a) with matching dark blue border (#2d3f6b) |
| 2026-02 | Set card text to bold white (#fff, fontWeight: bold) in all 6 section pages (Clients, Motorcycles, Reception, ServiceOrders, Parts, Payments) — primary, secondary, and detail-view card text |
| 2026-02 | Redesigned cards in all 6 section pages to match Dashboard aesthetic: container #1e293b bg / #334155 border / 12px radius; primary text #ffffff fw700; secondary text #94a3b8 fw500; prices/amounts #22c55e fw800 |
| 2026-02 | Redesigned PDF headers: black (#000) background, logo on left (22mm height, 2.5:1 ratio), title/order number/date on right in white, neon green (#39FF14) accent line below header. Updated all table styles (dark bg, green headers), client info box (dark bg + green border), footer (black + green top line). Applied to all 3 PDF generators (reception, service order, payment). |
| 2026-02 | Updated PDF header to match HTML mockup: logoData.ts now loads /LOGO1_PNG_CALCO.png first (fallback: /logo.png → /logo.svg); header height increased to 38mm; logo wider (24mm × 84mm, 3.5:1 ratio); title 18pt bold white, N° 14pt bold white, date 10pt #CCCCCC; green accent line thickened to 1.4mm (≈4px). |
| 2026-02 | Changed primary PDF logo to /logo-taller.png (public/logo-taller.png uploaded by user); fallback chain: logo-taller.png → LOGO1_PNG_CALCO.png → logo.png → logo.svg |
| 2026-02 | Added Cotizaciones (Quotes) module: Quote + QuoteItem types, Zustand CRUD, Quotes.tsx (list/form/detail views), generateQuotePDF(), Sidebar nav item, page.tsx routing |
| 2026-02 | Redesigned Quotes detail view as modal overlay matching ServiceOrders style (modal-overlay, modal-lg, section-title, table-container, btn-* CSS classes) |
| 2026-02 | Switched all PDF generators to light color theme: light gray header (#f5f5f5), white/light-blue table rows, dark slate table headers, dark green accents, bold dark text throughout — replaces previous all-black/neon-green dark theme |
| 2026-02 | Split Quotes form into two separate sections: 🔧 Mano de Obra (blue) and ⚙️ Repuestos (amber), each with independent add-item row and subtotal; removed combined type selector |
| 2026-02 | Fixed Parts price/stock inputs: changed from type=number with numeric state to type=text with string state, parsed only on submit — fixes "only one digit" entry bug |
| 2026-02 | Added inline item editing to Quotes form: clicking any item row in Mano de Obra or Repuestos tables switches it to an editable row with inputs (description, quantity, price) and ✔/✕ buttons; added ✏️ Editar button directly on list cards |
| 2026-02 | Linked Quotes to Service Orders: added `quoteId?` to ServiceOrder and `convertedToOrderId?` to Quote types; "🔧 Convertir a Orden de Servicio" button in quote detail (only when status=aceptada and not yet converted); "✅ Orden creada" badge on list cards; "✅ Convertida a Orden #XXXXXXXX" label in detail view; "📋 Generada desde Cotización #XXXXXXXX" badge in ServiceOrders list card and detail modal |
| 2026-02 | Changed ServiceOrder ID format from UUID to sequential YYYYMM-NNN (e.g. 202602-001); updated all display references in ServiceOrders.tsx, Quotes.tsx, Payments.tsx, and pdfGenerator.ts to show full ID instead of sliced UUID |
| 2026-02 | Added inline new-part form and inline price editing in ServiceOrders form: "➕ Nuevo" button opens mini-form to create a repuesto (description, costPrice, salePrice, stock) and auto-adds it to the order; clicking a unit price in the parts table enables inline editing (Enter/✔ to save, Escape/✕ to cancel) |
| 2026-02 | Applied full dark theme: body bg #0f172a, cards #1e293b, sidebar dark gradient, blue (#3b82f6/#60a5fa) primary accent, green (#4ade80) for income/success, amber (#fbbf24) for warnings, red (#f87171) for danger; updated globals.css + all component inline styles |
| 2026-02 | Added Turnos (Appointments) module: Turno type with date, time, client, motorcycle, service, status; Zustand CRUD; Turnos.tsx with form/list/detail modal; inline client creation in form; generateTurnoPDF() for printing; Sidebar nav item and page.tsx routing |
