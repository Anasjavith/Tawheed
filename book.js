
document.getElementById("backBtn").onclick = () => {
  history.back();
};


(async function(){
  const reader = document.getElementById("reader");

  function query(name){
    return new URLSearchParams(location.search).get(name);
  }

  const file = query("file");
  if (!file){
    reader.innerHTML = "No file selected.";
    return;
  }

  try {
    const res = await fetch(`hadiths/${file}`);
    const txt = await res.text();
    reader.innerHTML = parseBookText(txt);
    
    try { reader.classList.add('printable'); } catch(e){}
  } catch(e){
    reader.innerHTML = "Error loading file.";
  }
})();
