// pdf.js - provide a simple "download page as PDF" action using html2pdf

function ensureHtml2Pdf(){
  return new Promise((resolve, reject) => {
    if (window.html2pdf) return resolve();
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.2/html2pdf.bundle.min.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load html2pdf')); 
    document.head.appendChild(s);
  });
}

async function downloadPagePdf(){
  try {
    await ensureHtml2Pdf();
  } catch(e){
    alert('Could not load PDF generator. Try again later.');
    return;
  }

  // Prefer the reader element for book pages, otherwise the main container
  const content = document.querySelector('#reader') || document.querySelector('.reader') || document.querySelector('.container') || document.body;
  if (!content){
    alert('No content found to export.');
    return;
  }

  const filenameSafe = (document.title || 'page').replace(/[^a-z0-9\-_ ]+/ig, '').trim() || 'page';

  const opt = {
    margin: 0.5,
    filename: `${filenameSafe}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    // use a moderate scale to avoid oversized rendering that can cause odd page splits
    html2canvas: { scale: 1, useCORS: true },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  // Run the export and trigger download
  html2pdf().set(opt).from(content).save();
}

// Attach click handler to button(s) with id 'downloadPdfBtn'
function attachPdfButton(){
  const btns = document.querySelectorAll('#downloadPdfBtn');
  btns.forEach(b => {
    b.addEventListener('click', function(e){
      e.stopPropagation();
      // open a clean PDF in a new tab (no browser headers) but do not auto-print
      openPdfInNewTab(false);
    });
  });
}

// Open a generated PDF in a new tab (no browser headers) and optionally auto-print
async function openPdfInNewTab(autoPrint = false){
  try {
    await ensureHtml2Pdf();
  } catch(e){
    alert('Could not load PDF generator. Try again later.');
    return;
  }

  const content = document.querySelector('#reader') || document.querySelector('.reader') || document.querySelector('.container') || document.body;
  if (!content){
    alert('No content found to export.');
    return;
  }

  const filenameSafe = (document.title || 'page').replace(/[^a-z0-9\-_ ]+/ig, '').trim() || 'page';
  const opt = {
    margin: 0.5,
    filename: `${filenameSafe}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 1, useCORS: true },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  // prefer CSS-driven page-break rules but avoid breaking inside critical blocks
  opt.pagebreak = { mode: ['css', 'legacy'], avoid: ['.quran-block', '.content-text', 'p', 'h1'] };

  // generate PDF and get the jsPDF instance, then create a blob and open it
  try {
    const worker = html2pdf().set(opt).from(content).toPdf();
    worker.get('pdf').then(function (pdf) {
      try {
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        const newWin = window.open('about:blank');
        if (!newWin){
          // popup blocked - fallback to direct download
          const a = document.createElement('a');
          a.href = url;
          a.download = `${filenameSafe}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          return;
        }

        // write an iframe with the blob url so browser renders it without print headers
        const tabTitle = 'Tawheed';
        newWin.document.write(`<html><head><title>${tabTitle}</title></head><body style="margin:0"><iframe src="${url}" style="border:none;width:100%;height:100vh"></iframe></body></html>`);
        newWin.document.close();

        if (autoPrint){
          newWin.onload = function(){
            const iframe = newWin.document.querySelector('iframe');
            if (iframe) {
              iframe.onload = function(){
                try { newWin.focus(); newWin.print(); } catch(e){}
              };
            } else {
              try { newWin.focus(); newWin.print(); } catch(e){}
            }
          };
        }
      } catch(err){
        alert('Failed to open PDF in new tab.');
      }
    }).catch(()=>{
      alert('Failed to generate PDF');
    });
  } catch(e){
    alert('Error creating PDF');
  }
}

function attachOpenPdfButton(){
  const btn = document.getElementById('openPdfBtn');
  if (!btn) return;
  btn.addEventListener('click', function(e){
    e.stopPropagation();
    openPdfInNewTab(true); // open and trigger print
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attachPdfButton);
else attachPdfButton();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attachOpenPdfButton);
else attachOpenPdfButton();
