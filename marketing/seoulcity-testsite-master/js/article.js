async function loadPosts(){
  const res = await fetch("api/posts.json");
  return await res.json();
}

function getId(){
  const p = new URLSearchParams(location.search);
  return p.get("id");
}

function getUTM(){
  const p = new URLSearchParams(location.search);
  return {
    utm_source: p.get("utm_source") || "",
    utm_medium: p.get("utm_medium") || "",
    utm_campaign: p.get("utm_campaign") || "",
    utm_content: p.get("utm_content") || "",
    utm_term: p.get("utm_term") || ""
  };
}

(async function init(){
  const id = getId();
  const posts = await loadPosts();
  const post = posts.find(p=>p.id===id);

  document.title = post ? post.title : "Article";
  document.getElementById("title").textContent = post?.title || "게시글 없음";
  document.getElementById("dept").textContent = post?.dept || "-";
  document.getElementById("date").textContent = post?.modified_date || "-";
  document.getElementById("category").textContent = post?.category || "-";
  document.getElementById("summary").textContent = post?.summary || "";

  const tags = document.getElementById("tags");
  tags.innerHTML = (post?.tags||[]).map(t=>`<span class="tag">#${t}</span>`).join("");

  const utm = getUTM();

  // 상세 조회 이벤트 (Landing Page View 역할)
  if (typeof gtag === "function" && post) {
    gtag("event", "article_view", {
      article_id: post.id,
      dept: post.dept,
      category: post.category,
      ...utm
    });
  }

  // 체류시간(engaged) 이벤트: 10초 이상
  const start = Date.now();
  let sentEngaged = false;

  const timer = setInterval(()=>{
    const sec = Math.floor((Date.now()-start)/1000);
    if (!sentEngaged && sec >= 10 && typeof gtag === "function" && post) {
      sentEngaged = true;
      gtag("event", "article_engaged_10s", {
        article_id: post.id,
        dept: post.dept,
        category: post.category,
        ...utm
      });
    }
  }, 1000);

  // 스크롤 50% 이벤트
  let sentScroll50 = false;
  window.addEventListener("scroll", ()=>{
    const doc = document.documentElement;
    const scrolled = (doc.scrollTop + window.innerHeight) / doc.scrollHeight;
    if (!sentScroll50 && scrolled >= 0.5 && typeof gtag === "function" && post) {
      sentScroll50 = true;
      gtag("event", "scroll_50", {
        article_id: post.id,
        dept: post.dept,
        category: post.category,
        ...utm
      });
    }
  });

  // CTA 클릭 이벤트 (전환 KPI 후보)
  document.getElementById("cta").addEventListener("click", ()=>{
    if (typeof gtag === "function" && post) {
      gtag("event", "cta_click", {
        article_id: post.id,
        dept: post.dept,
        category: post.category,
        ...utm
      });
    }
    alert("데모 CTA입니다. (실습에서는 신청 폼/문의 폼으로 연결 가능)");
  });

  // 공유 이벤트
  document.getElementById("share").addEventListener("click", async ()=>{
    if (navigator.share && post) {
      await navigator.share({ title: post.title, url: location.href });
    }
    if (typeof gtag === "function" && post) {
      gtag("event", "share_click", {
        article_id: post.id,
        dept: post.dept,
        category: post.category,
        ...utm
      });
    }
  });

  window.addEventListener("beforeunload", ()=>clearInterval(timer));
})();
