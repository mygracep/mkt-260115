// 간단 버전: 모듈 없이 전역으로 track/getUTM 사용한다고 가정
// (원하면 module 버전으로 정리해드릴게요)

async function loadPosts(){
  const res = await fetch("api/posts.json");
  return await res.json();
}

function uniq(arr){ return [...new Set(arr)]; }

function render(posts){
  const list = document.getElementById("list");
  list.innerHTML = posts.map(p => `
    <div class="card">
      <h3 class="item-title">${p.title}</h3>
      <div class="meta">${p.dept} • ${p.modified_date} • ${p.category}</div>
      <p class="summary">${p.summary}</p>
      <div class="tags">${(p.tags||[]).slice(0,4).map(t=>`<span class="tag">#${t}</span>`).join("")}</div>
      <a class="btn" href="${p.cta_url}&from=list">상세 보기</a>
    </div>
  `).join("");
}

function applyFilters(all){
  const q = document.getElementById("q").value.trim().toLowerCase();
  const dept = document.getElementById("dept").value;
  const category = document.getElementById("category").value;
  const sort = document.getElementById("sort").value;

  let rows = all.filter(p=>{
    const hay = (p.title+" "+p.dept+" "+(p.tags||[]).join(" ")).toLowerCase();
    const okQ = q ? hay.includes(q) : true;
    const okD = dept ? p.dept === dept : true;
    const okC = category ? p.category === category : true;
    return okQ && okD && okC;
  });

  rows.sort((a,b)=>{
    if(sort==="new") return b.modified_date.localeCompare(a.modified_date);
    if(sort==="old") return a.modified_date.localeCompare(b.modified_date);
    if(sort==="title") return a.title.localeCompare(b.title);
    return 0;
  });

  render(rows);

  // KPI 이벤트(검색/필터 사용)
  if (typeof gtag === "function") {
    gtag("event", "filter_change", { q, dept, category, sort, results: rows.length });
  }
}

(async function init(){
  const all = await loadPosts();

  // 드롭다운 옵션 세팅
  const deptSel = document.getElementById("dept");
  uniq(all.map(p=>p.dept)).sort().forEach(d=>{
    const o = document.createElement("option");
    o.value = d; o.textContent = d;
    deptSel.appendChild(o);
  });

  const catSel = document.getElementById("category");
  uniq(all.map(p=>p.category)).sort().forEach(c=>{
    const o = document.createElement("option");
    o.value = c; o.textContent = c;
    catSel.appendChild(o);
  });

  // 초기 렌더
  render(all);

  // 이벤트
  ["q","dept","category","sort"].forEach(id=>{
    document.getElementById(id).addEventListener("input", ()=>applyFilters(all));
    document.getElementById(id).addEventListener("change", ()=>applyFilters(all));
  });

  // Pageview 외에 “뉴스룸 방문” 커스텀 이벤트(선택)
  if (typeof gtag === "function") {
    gtag("event", "newsroom_view", { total_posts: all.length });
  }
})();
