
function escapeHtml(s){
  return String(s)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;");
}

function parseBookText(text){
  const lines = text.split(/\r?\n/);
  let html = "";
  let mode = null;
  let quran = [];
  let contentLines = [];

  function renderContentBlock(){
    if (!contentLines || contentLines.length === 0) return;
    // split collected lines into paragraphs separated by empty lines
    const paragraphs = [];
    let buffer = [];
    for (const line of contentLines){
      if (line === ''){
        if (buffer.length){ paragraphs.push(buffer); buffer = []; }
      } else {
        buffer.push(line);
      }
    }
    if (buffer.length) paragraphs.push(buffer);

    // render paragraphs as <p class="content-text"> with lines joined by spaces
    paragraphs.forEach(pLines => {
      const inner = pLines.map(l => escapeHtml(l)).join(' ');
      html += `<p class="content-text">${inner}</p>`;
    });
    contentLines = [];
  }

  function renderQuranBlock(){
    if (quran.length === 0) return;

    // if the last line of the quran block looks like a verse reference (e.g. "(...)")
    // treat it as the verse reference and render it inside the quran-block with
    let verseRef = null;
    const last = quran[quran.length - 1].trim();
    if (/^\(.*\)$/.test(last)){
      verseRef = quran.pop();
    }

    html += `<div class="quran-block">`;
    quran.forEach(l => html += `<div class="q-line">${escapeHtml(l)}</div>`);
    if (verseRef) html += `<div class="verse-ref">${escapeHtml(verseRef)}</div>`;
    html += `</div>`;
    quran = [];
  }

  for (let line of lines){
    const t = line.trim();
    if (t === ""){
      if (mode === "QURAN"){ renderQuranBlock(); mode = null; }
      else if (mode === "CONTENT") { contentLines.push(''); }
      else html += "<br>";
      continue;
    }

    if (t === "[TITLE]"){ renderContentBlock(); renderQuranBlock(); mode = "TITLE"; continue; }
    if (t === "[CONTENT]"){ renderContentBlock(); renderQuranBlock(); contentLines = []; mode = "CONTENT"; continue; }
    if (t === "[QURAN]"){ renderContentBlock(); renderQuranBlock(); mode = "QURAN"; continue; }
    // Note: [VERSES] tag is no longer used. Verse references (previously under
    // [VERSES]) should appear as the last line inside the [QURAN] block in
    // parentheses, e.g. "(al-qur'an 3 : 102)", and will be rendered inside the
    // `.quran-block` by `renderQuranBlock()`.

    if (mode === "TITLE"){
      html += `<h1 class="title">${escapeHtml(t)}</h1>`;
      mode = null;
      continue;
    }
    if (mode === "CONTENT"){
      // collect content lines and render as a single block later
      contentLines.push(t);
      continue;
    }
    if (mode === "QURAN"){
      quran.push(t);
      continue;
    }
    // VERSES mode is removed; verse references are handled inside the QURAN block.

    html += `<p class="content-text">${escapeHtml(t)}</p>`;
  }

  // flush any remaining content/quran blocks
  renderContentBlock();
  renderQuranBlock();
  return html;
}
