# PDF Generation Implementation Status

## Completed ✅

### 1. Fixed "Add Document to Product" Error
- **Issue**: FormData vs JSON mismatch causing "unexpected error"
- **Fix**: Updated `/api/products/add-document.ts` to use FormData
- **Fix**: Updated `ProductDocumentsForm.tsx` to send FormData with better error handling

### 2. Auto-Add New Documents to Products
- **Feature**: Create new document and automatically add it to current product
- **Implementation**: `handleCreateDocument()` in `ProductDocumentsForm.tsx`
- **Flow**:
  1. User clicks "Create a new document" in product modal
  2. Document is created via API
  3. Document is automatically added to product with $0.00 price
  4. Modal shows success message
  5. Document appears in product's document list

### 3. Database Schema for PDF Storage
- **Migration**: `20251213_add_pdf_to_product_documents.sql`
- **Added fields to `product_documents` table**:
  - `pdf_url` TEXT - URL of auto-generated PDF
  - `pdf_storage_path` TEXT - Storage path for PDF file
  - `pdf_generated_at` TIMESTAMPTZ - Last generation timestamp
- **TypeScript**: Updated `ProductDocument` interface in `products.types.ts`

### 4. PDF Generation API Endpoint
- **Endpoint**: `/api/products/generate-document-pdfs.ts`
- **Method**: POST
- **Parameters**: productId
- **Functionality**:
  - Verifies product ownership
  - Fetches all documents attached to product
  - Generates PDFs for each document (placeholder for now)
  - Updates `product_documents` table with PDF paths
- **Status**: Endpoint structure complete, actual PDF generation pending

### 5. Auto-Generate PDFs on Product Publish
- **Hook Location**: `/api/products/update-product.ts` (PUT handler)
- **Trigger**: When product status changes from non-public to 'public'
- **Implementation**:
  - Detects status change to 'public'
  - Calls PDF generation endpoint asynchronously
  - Doesn't block product update if PDF generation fails

### 6. Auto-Regenerate PDFs on Document Updates
- **Hook Location**: `/api/documents/update-content.ts`
- **Trigger**: When document content is saved
- **Implementation**:
  - Queries for all published products using the document
  - Triggers PDF regeneration for each product asynchronously
  - Fire-and-forget approach (doesn't block document save)

## Pending Implementation 🚧

### Actual PDF Generation Library
The PDF generation endpoint currently creates placeholders. To complete this feature, implement:

**Option 1: Puppeteer/Playwright (Server-side rendering)**
```typescript
// Install: npm install puppeteer
import puppeteer from 'puppeteer';

async function generatePDF(documentContent: TipTapContent): Promise<Buffer> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Convert TipTap JSON to HTML
  const html = convertTipTapToHTML(documentContent);

  await page.setContent(html);
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
  });

  await browser.close();
  return pdf;
}
```

**Option 2: jsPDF (Client-side library)**
- Lighter weight but less feature-rich
- Better for simple documents

**Option 3: External Service (Browserless, PDFShift, etc.)**
- Offload rendering to cloud service
- Easier scaling, costs money

### TipTap to HTML Conversion
Need to convert TipTap JSON to styled HTML before PDF rendering:

```typescript
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
// ... other extensions

function convertTipTapToHTML(content: TipTapContent): string {
  return generateHTML(content, [
    StarterKit,
    Image,
    Table,
    // ... match all extensions from DocumentEditor
  ]);
}
```

### PDF Upload to Supabase Storage
After generating PDF buffer, upload to storage:

```typescript
import { uploadFile } from '@/lib/storage';

// In generate-document-pdfs.ts, after PDF generation:
const pdfBuffer = await generatePDF(content);
const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });

const uploadResult = await uploadFile({
  bucket: 'product-pdfs',
  path: storagePath,
  file: pdfBlob,
  accessToken: accessToken.value,
});

// Update product_documents with actual PDF URL
await serverClient
  .from('product_documents')
  .update({
    pdf_url: uploadResult.url,
    pdf_generated_at: new Date().toISOString(),
  })
  .eq('id', productDoc.id);
```

### Supabase Storage Bucket Setup
Create a new storage bucket for product PDFs:

```sql
-- In Supabase dashboard or migration
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-pdfs', 'product-pdfs', true);

-- RLS policy for product PDFs
CREATE POLICY "Anyone can view product PDFs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-pdfs');

CREATE POLICY "Product owners can upload PDFs"
  ON storage.objects FOR INSERT
  USING (
    bucket_id = 'product-pdfs' AND
    auth.uid() IS NOT NULL
  );
```

## Testing Checklist

Once PDF generation is implemented:

- [ ] Create a new document and add it to a product
- [ ] Add content to the document (text, images, tables)
- [ ] Publish the product (status = 'public')
- [ ] Verify PDF is generated and stored
- [ ] Verify PDF URL is in `product_documents.pdf_url`
- [ ] Update document content
- [ ] Verify PDF is regenerated automatically
- [ ] Download PDF and verify it matches document content
- [ ] Test with multiple documents on one product
- [ ] Test with one document on multiple products

## Notes

- PDF generation is non-blocking (fire-and-forget)
- Failed PDF generation doesn't prevent product publish or document updates
- PDFs are regenerated on every document content save
- Consider adding a debounce/queue system for frequent document updates
- Consider caching PDFs and only regenerating on significant changes
- PDF generation logs errors to console but doesn't surface to users
