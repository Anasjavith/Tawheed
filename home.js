
function escapeHtml(s){
  return s
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;");
}

async function loadChapters(){
  const list = document.getElementById("list");
  list.innerHTML = "Loading…";

  try {
    const res = await fetch("hadiths/hadiths.json");
    const chapters = await res.json();

    let html = "";

    chapters.forEach(ch => {
      html += `
        <div class="card" onclick="openChapter('${escapeHtml(ch.file)}')">
          <div class="card-left">
            <div class="card-title">${escapeHtml(ch.title)}</div>
          </div>

          <div class="card-actions">
            <button class="btn-download" onclick="event.stopPropagation(); openChapterPdfInNewTab('${escapeHtml(ch.file)}')">
              <img src="static/icons/download-button-icon.png">
            </button>
          </div>
        </div>
      `;
    });

    list.innerHTML = html;

  } catch(e){
    list.innerHTML = "Error loading hadiths.json";
  }
}

function openChapter(filename){
  window.location.href = `book.html?file=${encodeURIComponent(filename)}`;
}


// Download a chapter as PDF: fetch content, render to HTML, and use html2pdf
async function downloadChapterPdf(filename){
  // load html2pdf if needed
  async function ensureHtml2Pdf(){
    if (window.html2pdf) return;
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.2/html2pdf.bundle.min.js';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load html2pdf'));
      document.head.appendChild(s);
    });
  }

  try {
    await ensureHtml2Pdf();
  } catch (e){
    alert('Could not load PDF generator. Try again later.');
    return;
  }

  try {
    const res = await fetch(`hadiths/${filename}`);
    const txt = await res.text();
    const html = parseBookText(txt);


    const container = document.createElement('div');
    container.className = 'printable';
    container.style.padding = '24px';
    container.style.background = 'white';
    // constrain printable width to A4 content width (A4 8.27in minus 1in margins => 7.27in)
    container.style.width = '7.27in';
    container.style.maxWidth = '100%';
    // Add print-specific CSS to avoid page breaks inside paragraphs/blocks
    const style = document.createElement('style');
    style.textContent = `
      .printable, .printable * {
        box-sizing: border-box;
      }
      .printable p, .printable .content-text, .printable .quran-block, .printable h1, .printable .verse-ref {
        page-break-inside: avoid;
        break-inside: avoid;
        orphans: 2;
        widows: 2;
      }
      .printable {
        font-family: 'Noto Sans Tamil', 'Noto Naskh Arabic', serif;
        font-size: 1.05rem;
        line-height: 1.8;
        color: #111;
      }
    `;
    container.appendChild(style);
    container.innerHTML += html;
    document.body.appendChild(container);

    const filenameSafe = (filename || 'chapter').replace(/[^a-z0-9\-_ ]+/ig, '').trim() || 'chapter';

    const opt = {
      margin: 0.5,
      filename: `${filenameSafe}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      // use scale 1 to avoid oversized rendering which can cause odd page splits
      html2canvas: { scale: 1, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['.quran-block', '.content-text', 'p', 'h1'] }
    };

    // generate and save, then remove temporary container
    html2pdf().set(opt).from(container).save().then(()=> container.remove()).catch(()=> container.remove());

  } catch (e){
    alert('Failed to download PDF');
  }
}

// Open a chapter as a clean PDF in a new tab (no browser headers) and optionally auto-print
async function openChapterPdfInNewTab(filename, autoPrint = false){
  async function ensureHtml2Pdf(){
    if (window.html2pdf) return;
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.2/html2pdf.bundle.min.js';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load html2pdf'));
      document.head.appendChild(s);
    });
  }

  try {
    await ensureHtml2Pdf();
  } catch (e){
    alert('Could not load PDF generator. Try again later.');
    return;
  }

  try {
    const res = await fetch(`hadiths/${filename}`);
    const txt = await res.text();
    const html = parseBookText(txt);

    const container = document.createElement('div');
    container.className = 'printable';
    container.style.padding = '24px';
    container.style.background = 'white';
    container.style.width = '7.27in';
    container.style.maxWidth = '100%';

    const style = document.createElement('style');
    style.textContent = `
      .printable, .printable * { box-sizing: border-box; }
      .printable p, .printable .content-text, .printable .quran-block, .printable h1, .printable .verse-ref { page-break-inside: avoid; break-inside: avoid; orphans:2; widows:2; }
      .printable { font-family: 'Noto Sans Tamil', 'Noto Naskh Arabic', serif; font-size:1.05rem; line-height:1.8; color:#111 }
    `;
    container.appendChild(style);
    container.innerHTML += html;
    document.body.appendChild(container);

    const filenameSafe = (filename || 'chapter').replace(/[^a-z0-9\-_ ]+/ig, '').trim() || 'chapter';
    const opt = { margin:0.5, filename:`${filenameSafe}.pdf`, image:{type:'jpeg', quality:0.98}, html2canvas:{scale:1, useCORS:true}, jsPDF:{unit:'in', format:'a4', orientation:'portrait'}, pagebreak:{ mode:['css','legacy'], avoid:['.quran-block','.content-text','p','h1'] } };

    const worker = html2pdf().set(opt).from(container).toPdf();
    worker.get('pdf').then(function(pdf){
      try {
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        const newWin = window.open('about:blank');
        if (!newWin){
          const a = document.createElement('a'); a.href = url; a.download = `${filenameSafe}.pdf`; document.body.appendChild(a); a.click(); a.remove(); container.remove(); return;
        }
        // set the new tab title to the site/document title instead of the filename
        const tabTitle = 'Tawheed';
        newWin.document.write(`<html><head><title>${tabTitle}</title></head><body style="margin:0"><iframe src="${url}" style="border:none;width:100%;height:100vh"></iframe></body></html>`);
        newWin.document.close();
        container.remove();
        if (autoPrint){
          newWin.onload = function(){ const iframe = newWin.document.querySelector('iframe'); if (iframe) { iframe.onload = function(){ try { newWin.focus(); newWin.print(); } catch(e){} }; } else { try { newWin.focus(); newWin.print(); } catch(e){} } };
        }
      } catch(err){ alert('Failed to open PDF in new tab.'); container.remove(); }
    }).catch(()=>{ alert('Failed to generate PDF'); container.remove(); });

  } catch(e){ alert('Failed to download PDF'); }
}

loadChapters();
