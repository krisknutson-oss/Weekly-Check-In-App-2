import JSZip from 'jszip';

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

/**
 * Extracts plain text from an uploaded Microsoft PowerPoint (.pptx) file
 * by parsing the slide XMLs inside the ZIP bundle.
 */
export async function extractPptxText(file: File): Promise<{ text: string; slideCount: number }> {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  const slideKeys = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
      const nb = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
      return na - nb;
    });

  if (slideKeys.length === 0) {
    throw new Error('No slides were detected in this PowerPoint file.');
  }

  let fullContent = '';
  let validSlideCount = 0;

  for (const key of slideKeys) {
    const xml = await zip.files[key].async('text');
    const slideNumber = key.match(/slide(\d+)\.xml/i)?.[1] || `${validSlideCount + 1}`;
    
    // Extract text blocks inside <a:t>...</a:t>
    const matches = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) =>
      decodeXmlEntities(m[1])
    );
    
    const slideText = matches.join(' ').replace(/\s+/g, ' ').trim();
    if (slideText) {
      validSlideCount++;
      fullContent += `\n\n[Slide ${slideNumber}]\n${slideText}`;
    }
  }

  if (!fullContent.trim()) {
    throw new Error(
      'No readable text found on the slides. The presentation might contain only images or flattened graphics.'
    );
  }

  return {
    text: fullContent.trim(),
    slideCount: slideKeys.length,
  };
}
