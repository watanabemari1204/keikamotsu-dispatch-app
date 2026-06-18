const stops = [
  { id: 1, wave: 1, parcels: 22, name: "港区三田一丁目 オフィスA", area: "赤羽橋寄り", deadline: "09:40", distance: 0.8, fee: 3960, weight: 8, tags: ["1便", "22個", "オフィス"], lat: 35.65325, lng: 139.74295 },
  { id: 2, wave: 1, parcels: 21, name: "港区三田一丁目 オフィスB", area: "桜田通り側", deadline: "10:20", distance: 0.6, fee: 3780, weight: 12, tags: ["1便", "21個", "法人受付"], lat: 35.65255, lng: 139.74443 },
  { id: 3, wave: 1, parcels: 23, name: "港区芝三丁目 事務所ビル", area: "芝公園駅周辺", deadline: "11:00", distance: 0.9, fee: 4140, weight: 9, tags: ["1便", "23個", "明日来る"], lat: 35.65307, lng: 139.7453 },
  { id: 4, wave: 2, parcels: 18, name: "港区芝三丁目 法人受付", area: "三田通り側", deadline: "11:45", distance: 0.7, fee: 3240, weight: 15, tags: ["2便", "18個", "法人受付"], lat: 35.65184, lng: 139.74531 },
  { id: 5, wave: 2, parcels: 26, name: "港区三田一丁目 事務所フロア", area: "麻布十番寄り", deadline: "13:10", distance: 1.1, fee: 4680, weight: 6, tags: ["2便", "26個", "オフィス"], lat: 35.65377, lng: 139.74157 },
  { id: 6, wave: 2, parcels: 20, name: "港区芝三丁目 会社受付", area: "慶大東門方面", deadline: "13:35", distance: 1.0, fee: 3600, weight: 18, tags: ["2便", "20個", "明日来る"], lat: 35.65126, lng: 139.74886 },
  { id: 7, wave: 3, parcels: 34, name: "港区三田一丁目 オフィスC", area: "済生会方面", deadline: "16:00", distance: 0.9, fee: 6120, weight: 5, tags: ["最終便", "34個", "法人"], lat: 35.65413, lng: 139.73945 },
  { id: 8, wave: 3, parcels: 32, name: "港区芝三丁目 オフィス回収", area: "芝商店街", deadline: "17:20", distance: 1.2, fee: 5760, weight: 11, tags: ["最終便", "32個", "回収"], lat: 35.65238, lng: 139.74668 }
];

const depot = {
  name: "勝島集積所",
  address: "東京都品川区勝島",
  lat: 35.5983,
  lng: 139.7449
};

const wavePlan = [
  { wave: 1, label: "1便", load: "06:45", depart: "07:15", target: "10:45", note: "三田一丁目から芝三丁目へ抜ける" },
  { wave: 2, label: "2便", load: "10:50", depart: "11:05", target: "13:35", note: "13時台に芝三丁目を終えて勝島へ戻る" },
  { wave: 3, label: "最終便", load: "14:05", depart: "14:25", target: "17:20", note: "勝島で14時に積み込み、時間指定を優先" }
];

const runPlans = [
  { run: 1, load: "06:45", depart: "07:15", area: "三田一丁目→芝三丁目", parcels: 70, returnBy: "10:35", target: "午前指定を先に処理" },
  { run: 2, load: "10:50", depart: "11:05", area: "芝三丁目→三田一丁目", parcels: 70, returnBy: "13:34", target: "14時前に勝島へ戻る" },
  { run: 3, load: "14:05", depart: "14:25", area: "三田一丁目→芝三丁目", parcels: 70, returnBy: "17:20", target: "最終便を取り切る" },
  { run: 4, load: "17:30", depart: "17:45", area: "近場のみ 三田/芝", parcels: 40, returnBy: "19:10", target: "稼ぐ日だけ追加" }
];

let runMode = 4;

const trafficByDay = {
  "月": [42, 56, 48, 62, 78, 70, 44],
  "火": [37, 51, 46, 58, 69, 64, 42],
  "水": [39, 53, 47, 61, 73, 68, 45],
  "木": [43, 57, 50, 66, 81, 74, 47],
  "金": [51, 63, 59, 74, 88, 84, 57],
  "土": [31, 38, 46, 59, 65, 58, 40],
  "日": [24, 30, 41, 52, 49, 37, 28]
};

const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];
const weatherLabels = {
  clear: "晴れ",
  cloudy: "くもり",
  rain: "雨",
  storm: "強い雨"
};

const demoVideoScanParcels = [
  { address: "港区三田一丁目4-28 三田国際ビル", area: "三田一丁目", parcels: 18, deadline: "15:30", lat: 35.65255, lng: 139.74443 },
  { address: "港区芝三丁目15-9 セブン-イレブン周辺", area: "芝三丁目", parcels: 16, deadline: "16:10", lat: 35.65307, lng: 139.7453 },
  { address: "港区芝三丁目17-15 芝・青色申告会周辺", area: "芝三丁目", parcels: 14, deadline: "16:40", lat: 35.65184, lng: 139.74531 },
  { address: "港区三田一丁目7-2 パークコート周辺", area: "三田一丁目", parcels: 12, deadline: "17:10", lat: 35.65413, lng: 139.73945 }
];

const $ = (selector) => document.querySelector(selector);
const yen = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });

let orderedStops = [...stops];
let sameDayCount = 0;
let liveMap;
let liveMapLayer;
let liveBaseLayer;
let scanMap;
let scanMapLayer;
let scanBaseLayer;
let scanMapShowAllPins = true;
let scanMapWaveFilter = "all";
let lastScanGroups = [];
let lastScanReads = [];
let activeMapRoute = [];
let autopilotEnabled = false;
let reminderTimer;
let cameraStream;
let ocrReadCount = 0;
let ocrAttempts = [];
const spokenReminderKeys = new Set();
const sameDayLoadDeadline = "14:30";

const mapTiles = {
  standard: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap"
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri"
  }
};

const vicsSegments = [
  {
    name: "海岸通り 勝島戻り",
    level: "smooth",
    message: "勝島戻りは流れ良好。帰庫優先ならこの軸を使う",
    points: [[35.5983, 139.7449], [35.6205, 139.751], [35.641, 139.748]]
  },
  {
    name: "第一京浜 芝三丁目周辺",
    level: "slow",
    message: "10時台と17時台は信号待ち増。横断回数を減らす",
    points: [[35.648, 139.746], [35.653, 139.745], [35.657, 139.744]]
  },
  {
    name: "赤羽橋・三田一丁目",
    level: "busy",
    message: "雨天/五十日は詰まりやすい。三田側をまとめて処理",
    points: [[35.651, 139.739], [35.6537, 139.7416], [35.6542, 139.744]]
  }
];

const fuelStations = [
  { name: "ENEOS 勝島SS", area: "勝島近く", price: 168, detour: 4, note: "帰庫前に寄りやすい" },
  { name: "出光 芝公園SS", area: "芝三丁目寄り", price: 172, detour: 7, note: "芝三丁目便の後に寄れる" },
  { name: "宇佐美 品川ふ頭SS", area: "海岸通り", price: 166, detour: 9, note: "最安候補、時間に余裕がある日" }
];

const parkingCandidates = [
  { id: "mita-street-a", type: "street", area: "mita", name: "三田一丁目 外周短時間停車候補", price: 0, walk: 2, baseOpen: 62, risk: 42, note: "建物前に近いが標識確認必須。荷下ろし短時間向け" },
  { id: "mita-paid-a", type: "paid", area: "mita", name: "三田国際ビル周辺 コインP", price: 440, walk: 4, baseOpen: 58, risk: 12, note: "空きがあれば法人受付に回しやすい" },
  { id: "mita-paid-b", type: "paid", area: "mita", name: "赤羽橋寄り 時間貸しP", price: 330, walk: 6, baseOpen: 70, risk: 10, note: "少し歩くが満車リスクが低め" },
  { id: "shiba-street-a", type: "street", area: "shiba", name: "芝三丁目 搬入口前短時間候補", price: 0, walk: 2, baseOpen: 54, risk: 48, note: "台車移動は短い。通行量が多い時間は避ける" },
  { id: "shiba-paid-a", type: "paid", area: "shiba", name: "芝公園駅側 コインP", price: 300, walk: 5, baseOpen: 66, risk: 11, note: "芝三丁目をまとめて回る時に安定" },
  { id: "shiba-paid-b", type: "paid", area: "shiba", name: "三田通り裏 時間貸しP", price: 400, walk: 3, baseOpen: 50, risk: 9, note: "高めだが徒歩ロスが少ない" }
];

function minutesFromTime(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function riskClass(score) {
  if (score >= 75) return "risk-high";
  if (score >= 55) return "risk-mid";
  return "risk-low";
}

function riskText(score) {
  if (score >= 75) return "高";
  if (score >= 55) return "中";
  return "低";
}

function todayProfile() {
  const now = new Date();
  const day = now.getDate();
  const weekday = weekdayLabels[now.getDay()];
  const isGotobi = day % 5 === 0 || day === 25 || day === 30;
  return {
    day,
    weekday,
    isGotobi,
    dateText: `${now.getFullYear()}年${now.getMonth() + 1}月${day}日 ${weekday}曜日`
  };
}

function weatherPenalty() {
  const weather = $("#weatherMode")?.value || "cloudy";
  if (weather === "storm") return 22;
  if (weather === "rain") return 14;
  if (weather === "cloudy") return 4;
  return 0;
}

function weatherFromCode(code) {
  if ([95, 96, 99].includes(code)) return "storm";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "rain";
  if ([0, 1].includes(code)) return "clear";
  return "cloudy";
}

async function detectWeather() {
  const button = $("#autoWeather");
  if (button) button.textContent = "取得中";
  try {
    const position = await new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ coords: { latitude: 35.652, longitude: 139.744 } });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        resolve,
        () => resolve({ coords: { latitude: 35.652, longitude: 139.744 } }),
        { enableHighAccuracy: false, timeout: 3500, maximumAge: 900000 }
      );
    });
    const { latitude, longitude } = position.coords;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=weather_code,precipitation,rain&timezone=Asia%2FTokyo`;
    const response = await fetch(url);
    const data = await response.json();
    const weather = weatherFromCode(Number(data.current?.weather_code ?? 3));
    $("#weatherMode").value = weather;
    if (button) button.textContent = `天気: ${weatherLabels[weather]}`;
    renderAll();
    return weather;
  } catch (error) {
    $("#weatherMode").value = "cloudy";
    if (button) button.textContent = "天気: くもり";
    renderAll();
    return "cloudy";
  }
}

function routeAdvice() {
  const profile = todayProfile();
  const selectedHour = Number($("#timeSlot").value);
  const dayScores = trafficByDay[profile.weekday] || trafficByDay["水"];
  const slotIndex = [8, 10, 12, 15, 17, 19, 21].indexOf(selectedHour);
  const baseTraffic = dayScores[Math.max(0, slotIndex)];
  const gotobiPenalty = profile.isGotobi ? 13 : 0;
  const peakPenalty = selectedHour >= 8 && selectedHour <= 10 ? 8 : selectedHour >= 17 ? 10 : 0;
  const score = baseTraffic + gotobiPenalty + peakPenalty + weatherPenalty();
  const weather = $("#weatherMode")?.value || "cloudy";

  let recommendation = runMode === 4 ? "勝島→三田/芝を4往復、近場だけ追加" : "勝島→三田/芝を3往復で時間優先";
  let summary = runMode === 4 ? "稼ぐ日は4往復目を近場だけに絞り、遠い寄り道を入れず回転数を優先します。" : "通常日は3往復で、各便の勝島戻り時刻を守ることを最優先にします。";

  if (selectedHour >= 11 && selectedHour < 14) {
    recommendation = "2往復目は芝三丁目先行 → 三田一丁目 → 勝島";
    summary = "昼前後は芝三丁目側の法人受付を先に固めると、14時の勝島帰庫に余裕を残しやすいです。";
  }

  if (profile.isGotobi || score >= 78) {
    recommendation = "近接ブロック優先、横断を減らして勝島へ戻る";
    summary = "五十日または高混雑のため、札の辻・第一京浜側の横断回数を減らし、近い建物を固めて処理する提案です。";
  }

  if (weather === "rain" || weather === "storm") {
    recommendation = "屋内受付優先、駐車しやすい順で勝島へ戻る";
    summary = "雨天時は濡れ・台車移動のロスが増えるため、法人受付・搬入口が使いやすい配送先を先に寄せます。";
  }

  return {
    score,
    recommendation,
    summary,
    profile,
    evidence: [
      `${profile.dateText}${profile.isGotobi ? "、五十日のため車両集中を加点" : "、五十日ではないため通常補正"}`,
      `${selectedHour}時台のエリア混雑スコア ${baseTraffic}${peakPenalty ? `、ピーク補正 +${peakPenalty}` : ""}`,
      `天気: ${weatherLabels[weather]}${weatherPenalty() ? `、作業ロス補正 +${weatherPenalty()}` : "、天候補正なし"}`,
      "14:00までに勝島集積所へ戻る条件を優先",
      `${runMode}往復モード。時間が命なので、遠回りより往復回転数を優先`,
      "有料高速道路は使わない固定。ナビも一般道優先で開く"
    ]
  };
}

function optimizeStops() {
  const priority = $("#routePriority")?.value || "time";
  orderedStops = [...orderedStops].sort((a, b) => {
    if ((a.wave || 3) !== (b.wave || 3)) return (a.wave || 3) - (b.wave || 3);
    if (priority === "distance") return a.distance - b.distance;
    if (priority === "earning") return b.fee - a.fee;
    return minutesFromTime(a.deadline) - minutesFromTime(b.deadline);
  });
  renderAll();
}

function renderStops() {
  const list = $("#stopList");
  const template = $("#stopTemplate");
  list.innerHTML = "";

  orderedStops.forEach((stop, index) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector(".stop-number").textContent = index + 1;
    node.querySelector(".stop-title").textContent = stop.name;
    node.querySelector(".stop-meta").textContent = `${stop.area} / 締切 ${stop.deadline} / ${stop.distance.toFixed(1)}km / ${stop.parcels || 1}個 / ${stop.weight}kg`;
    node.querySelector(".stop-money").textContent = yen.format((stop.parcels || 1) * getUnitPrice());
    const tagWrap = node.querySelector(".stop-tags");
    stop.tags.forEach((tag) => {
      const chip = document.createElement("span");
      chip.className = "tag";
      chip.textContent = tag;
      tagWrap.appendChild(chip);
    });
    list.appendChild(node);
  });
}

function getUnitPrice() {
  return Number($("#parcelUnitPrice")?.value || 180);
}

function parcelsForRun(run) {
  const input = $(`#run${run}Parcels`);
  const plan = runPlans.find((item) => item.run === run);
  const value = Number(input?.value || plan?.parcels || 0);
  return Math.max(run === 4 ? 0 : 1, Math.min(140, value));
}

function totalPlannedParcels() {
  return runPlans
    .filter((plan) => plan.run <= runMode)
    .reduce((sum, plan) => sum + parcelsForRun(plan.run), 0);
}

function formatClock(minutes) {
  const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
  const minute = String(minutes % 60).padStart(2, "0");
  return `${hour}:${minute}`;
}

function waveStops(wave) {
  return orderedStops.filter((stop) => stop.wave === wave);
}

function estimateWaveEnd(wave) {
  const targets = waveStops(wave);
  const plan = wavePlan.find((item) => item.wave === wave);
  const depart = minutesFromTime(plan.depart);
  const parcelMinutes = targets.reduce((sum, stop) => sum + (stop.parcels || 1) * 1.45, 0);
  const driveMinutes = targets.reduce((sum, stop) => sum + stop.distance * 5.2, 0);
  const stopMinutes = targets.length * 6;
  return Math.round(depart + parcelMinutes + driveMinutes + stopMinutes);
}

function loadColorSections(wave) {
  const total = parcelsForRun(wave);
  const red = Math.max(1, Math.round(total * (wave === 1 ? 0.42 : 0.34)));
  const yellow = Math.max(1, Math.round(total * (wave === 3 ? 0.38 : 0.4)));
  const blue = Math.max(0, total - red - yellow);
  return [
    {
      key: "red",
      label: "赤",
      range: "効率ルート前半",
      parcels: red,
      position: "スライドドア側・手前",
      rule: "AIが決めた配送順の前半。ここから崩さず降ろす"
    },
    {
      key: "yellow",
      label: "黄",
      range: "効率ルート中盤",
      parcels: yellow,
      position: "中央棚・腰の高さ",
      rule: "前半終了後に続けて出す。住所探しで積み直さない"
    },
    {
      key: "blue",
      label: "青",
      range: "効率ルート後半",
      parcels: blue,
      position: "奥・最後に出す箱",
      rule: "後半ブロック。先に触らず最後まで奥に固定"
    }
  ];
}

function loadColorSaving(wave) {
  const total = parcelsForRun(wave);
  return Math.max(4, Math.round(total * 0.13));
}

function loadColorLabel(color) {
  if (color === "red") return "赤";
  if (color === "yellow") return "黄";
  return "青";
}

function loadColorName(color) {
  if (color === "red") return "効率ルート前半";
  if (color === "yellow") return "効率ルート中盤";
  return "効率ルート後半";
}

function loadColorHex(color) {
  if (color === "red") return "#c74343";
  if (color === "yellow") return "#c17900";
  return "#2563eb";
}

function classifyLoadColor(group, indexInGroup, totalInGroup) {
  const ratio = totalInGroup ? indexInGroup / totalInGroup : 0;
  if (ratio < 0.34) return "red";
  if (ratio < 0.72) return "yellow";
  return "blue";
}

function renderWavePlan() {
  const grid = $("#waveGrid");
  if (!grid) return;
  grid.innerHTML = "";
  const timeline = currentOperatingTimeline();
  const reloadOnly = Number($("#bufferMinutes")?.value || 15);
  const workStart = minutesFromTime($("#workStartTime")?.value || "05:30");

  wavePlan.forEach((plan) => {
    const runTime = timeline[plan.wave - 1];
    const targets = waveStops(plan.wave);
    const parcels = parcelsForRun(plan.wave);
    const weight = targets.reduce((sum, stop) => sum + stop.weight, 0);
    const colorSections = loadColorSections(plan.wave);
    const shownEnd = runTime?.returnTime || estimateWaveEnd(plan.wave);
    const endLabel = plan.wave === 2 ? "勝島戻り見込" : "配送完了見込";
    const loadLabel = plan.wave === 1 ? `朝作業 ${formatClock(workStart)}-${formatClock(runTime.depart)}` : `車積み ${reloadOnly}分`;
    const card = document.createElement("article");
    card.className = `wave-card wave-${plan.wave}`;
    card.innerHTML = `
      <div class="wave-title">
        <strong>${plan.label}</strong>
        <span>${parcels}個</span>
      </div>
      <div class="wave-timeline">
        <span>${loadLabel}</span>
        <span>出発 ${formatClock(runTime.depart)}</span>
        <span>${endLabel} ${formatClock(shownEnd)}</span>
      </div>
      <div class="wave-bar"><span style="width: ${Math.min(100, Math.round(parcels / 80 * 100))}%"></span></div>
      <div class="color-load-sheet">
        <strong>AI色分け積み込みシート</strong>
        ${colorSections.map((section) => `
          <div class="color-load-row ${section.key}">
            <span>${section.label}</span>
            <div>
              <b>${section.range} / ${section.parcels}個</b>
              <small>${section.position}。${section.rule}</small>
            </div>
          </div>
        `).join("")}
      </div>
      <div class="load-saving">探す時間を約${loadColorSaving(plan.wave)}分短縮。色は配送順ではなく、AIルート順を守るための積み位置</div>
      <p>${plan.note}</p>
      <small>${targets.length}エリア / ${weight}kg</small>
    `;
    grid.appendChild(card);
  });
}

function waveAreaLabel(wave) {
  if (wave === 1) return "三田一丁目の午前指定 → 芝三丁目";
  if (wave === 2) return "芝三丁目の法人受付 → 三田一丁目";
  return "三田一丁目/芝三丁目の残り固定便";
}

function loadPositionLabel(wave) {
  if (wave === 1) return "手前・すぐ降ろす棚";
  if (wave === 2) return "中央・2便箱";
  return "奥・最後に出す箱";
}

function congestionAvoidanceForWave(wave, depart) {
  const hour = Math.floor(depart / 60);
  const advice = routeAdvice();
  if (wave === 1 && hour >= 8) return "8時台の第一京浜混雑を避け、三田側から早めに抜ける";
  if (wave === 2) return "昼前の混雑前に芝三丁目を先行し、勝島戻りを優先";
  if (wave === 3 && advice.score >= 65) return "午後の混雑上昇前に近接ビルをまとめて処理";
  return "混雑が低い時間帯に近接ブロックをまとめて処理";
}

function renderMorningPlan() {
  const grid = $("#morningPlanGrid");
  if (!grid) return;
  const timeline = currentOperatingTimeline();
  const reloadOnly = Number($("#bufferMinutes")?.value || 15);
  const thirdReturn = timeline[2]?.returnTime || 0;
  const loadOk = thirdReturn <= minutesFromTime(sameDayLoadDeadline);
  $("#morningPlanBadge").textContent = `4便積込 ${formatClock(thirdReturn)} ${loadOk ? "OK" : "要調整"}`;
  grid.innerHTML = "";

  [1, 2, 3].forEach((wave) => {
    const stopsForWave = waveStops(wave);
    const parcels = stopsForWave.reduce((sum, stop) => sum + (stop.parcels || 1), 0);
    const timelineItem = timeline[wave - 1];
    const navOrder = stopsForWave.map((stop) => stop.name.replace("港区", "")).join(" → ");
    const loadInstruction = wave === 1
      ? "1便を手前、2便を中央、3便を奥に置く。1便分だけすぐ降ろせる状態で出発"
      : `${reloadOnly}分で車積み。朝に便分け済みの箱だけを積み替え、現地で探さない`;
    const card = document.createElement("article");
    card.className = "morning-plan-card";
    card.innerHTML = `
      <div class="morning-plan-title">
        <strong>${wave}便目</strong>
        <span>${parcels}個 / ${stopsForWave.length}納品先</span>
      </div>
      <p><b>エリア</b>${waveAreaLabel(wave)}</p>
      <p><b>時間</b>${formatClock(timelineItem.depart)}出発 / ${formatClock(timelineItem.deliveryFinish)}配送完了 / ${formatClock(timelineItem.returnTime)} ${wave === 3 ? "勝島戻り・4便積込判断" : "勝島戻り"}</p>
      <p><b>混雑回避</b>${congestionAvoidanceForWave(wave, timelineItem.depart)}</p>
      <p><b>ナビ順</b>${navOrder}</p>
      <p><b>積み込み</b>${loadPositionLabel(wave)}。${loadInstruction}</p>
    `;
    grid.appendChild(card);
  });
}

function estimateRunReturn(run) {
  const plan = runPlans.find((item) => item.run === run);
  const base = minutesFromTime(plan.depart);
  return base + runTimeBreakdown(run).total;
}

function deliveryMinutesForRun(run) {
  const targets = run <= 3 ? waveStops(run) : orderedStops.filter((stop) => stop.wave === 3).slice(-4);
  const stopCount = Math.max(1, targets.length || (run === 4 ? 4 : 3));
  const parcelHandling = Math.round(parcelsForRun(run) * (run === 4 ? 0.55 : 0.52));
  const officeReception = stopCount * (run === 4 ? 6 : 8);
  return parcelHandling + officeReception;
}

function runTimeBreakdown(run) {
  const plan = runPlans.find((item) => item.run === run);
  const traffic = routeAdvice().score;
  const trafficExtra = traffic >= 75 ? 18 : traffic >= 55 ? 10 : 4;
  const deliveryMinutes = deliveryMinutesForRun(run);
  const outboundMinutes = run === 4 ? 18 : 22;
  const localMoveMinutes = run === 4 ? 14 : 22;
  const returnToDepotMinutes = run === 4 ? 0 : 22;
  return {
    parcels: parcelsForRun(run),
    deliveryMinutes,
    outboundMinutes,
    localMoveMinutes,
    returnToDepotMinutes,
    driveAndParkingMinutes: outboundMinutes + localMoveMinutes + returnToDepotMinutes,
    trafficExtra,
    total: deliveryMinutes + outboundMinutes + localMoveMinutes + returnToDepotMinutes + trafficExtra
  };
}

function estimateRunReturnWithLoad(run, loadMinutes) {
  const plan = runPlans.find((item) => item.run === run);
  const scheduledLoad = minutesFromTime(plan.load);
  const depart = scheduledLoad + loadMinutes;
  const traffic = routeAdvice().score;
  const trafficExtra = traffic >= 75 ? 18 : traffic >= 55 ? 10 : 4;
  const parcelMinutes = deliveryMinutesForRun(run);
  const areaMinutes = run === 4 ? 32 : 44;
  return depart + parcelMinutes + areaMinutes + trafficExtra;
}

function runRouteMinutes(run) {
  const plan = runPlans.find((item) => item.run === run);
  return estimateRunReturn(run) - minutesFromTime(plan.depart);
}

function buildMorningBatchSimulation(morningMinutes, reloadMinutes) {
  const activeRuns = runPlans.filter((plan) => plan.run <= runMode);
  let nextDepart = minutesFromTime($("#workStartTime")?.value || "05:30") + morningMinutes;

  return activeRuns.map((plan, index) => {
    let depart = index === 0 ? nextDepart : nextDepart + reloadMinutes;
    if (plan.run === 4) {
      depart = Math.max(depart, minutesFromTime(sameDayLoadDeadline) + reloadMinutes);
    }
    const breakdown = runTimeBreakdown(plan.run);
    const deliveryFinish = depart + breakdown.outboundMinutes + breakdown.localMoveMinutes + breakdown.deliveryMinutes + breakdown.trafficExtra;
    const returnTime = deliveryFinish + breakdown.returnToDepotMinutes;
    nextDepart = returnTime;
    return {
      run: plan.run,
      depart,
      deliveryFinish,
      returnTime
    };
  });
}

function currentOperatingTimeline() {
  const aiLoad = Number($("#aiLoadMinutes")?.value || 90);
  const reloadOnly = Number($("#bufferMinutes")?.value || 15);
  return buildMorningBatchSimulation(aiLoad, reloadOnly);
}

function renderSimulation() {
  const oldLoad = Number($("#oldLoadMinutes")?.value || 150);
  const aiLoad = Number($("#aiLoadMinutes")?.value || 90);
  const reloadOnly = Number($("#bufferMinutes")?.value || 15);
  const workStart = minutesFromTime($("#workStartTime")?.value || "05:30");
  const oldTimeline = buildMorningBatchSimulation(oldLoad, reloadOnly);
  const aiTimeline = buildMorningBatchSimulation(aiLoad, reloadOnly);
  const oldReturns = oldTimeline.map((item) => item.returnTime);
  const aiReturns = aiTimeline.map((item) => item.returnTime);
  const morningDelay = Math.max(0, oldLoad - aiLoad);
  const saved = morningDelay;
  const oldSecondOk = oldReturns[1] <= minutesFromTime("14:00");
  const aiSecondOk = aiReturns[1] <= minutesFromTime("14:00");
  const aiFourthOk = runMode === 4 ? aiReturns[2] <= minutesFromTime(sameDayLoadDeadline) : true;
  const oldFirstDepart = oldTimeline[0]?.depart || 0;
  const aiFirstDepart = aiTimeline[0]?.depart || 0;
  const breakdowns = runPlans
    .filter((plan) => plan.run <= runMode)
    .map((plan) => runTimeBreakdown(plan.run));
  const deliveryTotal = breakdowns.reduce((sum, item) => sum + item.deliveryMinutes, 0);
  const driveTotal = breakdowns.reduce((sum, item) => sum + item.outboundMinutes + item.localMoveMinutes, 0);
  const returnTotal = breakdowns.reduce((sum, item) => sum + item.returnToDepotMinutes, 0);
  const trafficTotal = breakdowns.reduce((sum, item) => sum + item.trafficExtra, 0);
  const firstBreakdown = breakdowns[0];

  $("#simulationBadge").textContent = `朝作業${saved}分短縮`;
  const grid = $("#simulationGrid");
  grid.innerHTML = "";

  const cards = [
    {
      title: "以前の手作業運用",
      value: `${formatClock(oldFirstDepart)}発`,
      detail: `${formatClock(workStart)}出社から、3便分の仕分け・便分け・積み順作成・1便目の車積みまで。配達時間込みで2往復目戻り ${formatClock(oldReturns[1])} / 最終戻り ${formatClock(oldReturns[oldReturns.length - 1])}`,
      status: oldSecondOk ? "14時OK" : "14時超過"
    },
    {
      title: "AI・ルート判定あり",
      value: `${formatClock(aiFirstDepart)}発`,
      detail: `朝作業90分目標、2・3便は各${reloadOnly}分で車積みだけ。2便後戻り ${formatClock(aiReturns[1])} / 4便積込の勝島戻り ${formatClock(aiReturns[2])}`,
      status: aiSecondOk ? "14時OK" : "14時超過"
    },
    {
      title: "配達時間の内訳",
      value: `${deliveryTotal + driveTotal + returnTotal + trafficTotal}分`,
      detail: `配達作業 ${deliveryTotal}分 / 往路・現地移動 ${driveTotal}分 / 勝島への復路 ${returnTotal}分 / 渋滞補正 ${trafficTotal}分。1便目は${firstBreakdown.parcels}個で配達作業${firstBreakdown.deliveryMinutes}分込み`,
      status: runMode === 4 ? (aiFourthOk ? "4便積込OK" : "4便積込注意") : "3往復安定"
    }
  ];

  cards.forEach((item) => {
    const card = document.createElement("article");
    card.className = `simulation-card ${item.status.includes("超過") || item.status.includes("注意") ? "warn" : ""}`;
    card.innerHTML = `
      <span>${item.title}</span>
      <strong>${item.value}</strong>
      <p>${item.detail}</p>
      <small>${item.status}</small>
    `;
    grid.appendChild(card);
  });
}

function driverRunDelay(seed, min, max) {
  const value = Math.sin(seed * 999.91) * 10000;
  const ratio = value - Math.floor(value);
  return Math.round(min + ratio * (max - min));
}

function simulateDriverDay(index, rescue = false) {
  const aiLoad = Math.max(70, Number($("#aiLoadMinutes")?.value || 90) - (rescue ? 15 : 0));
  const reloadOnly = Math.max(10, Number($("#bufferMinutes")?.value || 15) - (rescue ? 5 : 0));
  const workStart = minutesFromTime($("#workStartTime")?.value || "05:30");
  const advice = routeAdvice();
  const weather = $("#weatherMode")?.value || "cloudy";
  const weatherBoost = weather === "storm" ? 5 : weather === "rain" ? 3 : weather === "cloudy" ? 0 : 0;
  const gotobiBoost = todayProfile().isGotobi ? 3 : 0;
  const trafficBase = Math.max(0, Math.round((advice.score - 55) / 10) - (rescue ? 1 : 0));
  const activeRuns = runPlans.filter((plan) => plan.run <= runMode);
  const morningVariance = rescue
    ? driverRunDelay(index * 11 + 1, -12, 6) + driverRunDelay(index * 13 + 2, 0, 2)
    : driverRunDelay(index * 11 + 1, -10, 12) + driverRunDelay(index * 13 + 2, 0, 3);
  let nextDepart = workStart + aiLoad + morningVariance;
  let trafficTotal = 0;
  let parkingTotal = 0;
  let receptionTotal = 0;
  let fatigueTotal = 0;
  const timeline = activeRuns.map((plan) => {
    const loadSlip = plan.run === 1 ? 0 : driverRunDelay(index * 17 + plan.run, 0, rescue ? 3 : 7);
    let depart = plan.run === 1 ? nextDepart : nextDepart + reloadOnly + loadSlip;
    if (plan.run === 4) {
      depart = Math.max(depart, minutesFromTime(sameDayLoadDeadline) + reloadOnly + loadSlip);
    }
    const breakdown = runTimeBreakdown(plan.run);
    const trafficSlip = Math.max(0, trafficBase + weatherBoost + gotobiBoost + driverRunDelay(index * 19 + plan.run, rescue ? -6 : -5, rescue ? 3 : 6));
    const parkingSlip = driverRunDelay(index * 23 + plan.run, 0, rescue ? 1 : (plan.run === 4 ? 2 : 3));
    const receptionSlip = driverRunDelay(index * 29 + plan.run, 0, rescue ? 1 : (plan.run === 1 ? 4 : 3));
    const fatigueSlip = plan.run >= 3 ? driverRunDelay(index * 31 + plan.run, 0, rescue ? 1 : 2) : 0;
    const handlingSave = rescue && plan.run <= 3 ? Math.round(parcelsForRun(plan.run) * 0.09) : 0;
    trafficTotal += trafficSlip;
    parkingTotal += parkingSlip;
    receptionTotal += receptionSlip;
    fatigueTotal += fatigueSlip;
    const deliveryFinish = depart
      + breakdown.outboundMinutes
      + breakdown.localMoveMinutes
      + breakdown.deliveryMinutes
      + breakdown.trafficExtra
      + trafficSlip
      + parkingSlip
      + receptionSlip
      + fatigueSlip
      - handlingSave;
    const returnSlip = plan.run === 4 ? 0 : driverRunDelay(index * 37 + plan.run, 0, rescue ? 2 : 4);
    const returnTime = deliveryFinish + breakdown.returnToDepotMinutes + returnSlip;
    nextDepart = returnTime;
    return { run: plan.run, depart, deliveryFinish, returnTime };
  });
  const run2Return = timeline[1]?.returnTime || 0;
  const run3Return = timeline[2]?.returnTime || 0;
  const finalTime = timeline[timeline.length - 1]?.returnTime || 0;
  const reasonScores = [
    { key: "渋滞", value: trafficTotal },
    { key: "駐車", value: parkingTotal },
    { key: "受付待ち", value: receptionTotal },
    { key: "朝作業", value: Math.max(0, morningVariance) },
    { key: "疲労", value: fatigueTotal }
  ].sort((a, b) => b.value - a.value);
  return {
    index,
    timeline,
    run2Return,
    run3Return,
    finalTime,
    run2Ok: run2Return <= minutesFromTime("14:00"),
    fourthLoadOk: runMode === 4 ? run3Return <= minutesFromTime(sameDayLoadDeadline) : true,
    finalOk: runMode === 4 ? finalTime <= minutesFromTime("17:30") : finalTime <= minutesFromTime("15:30"),
    blocker: reasonScores[0].key,
    trafficTotal,
    parkingTotal,
    receptionTotal,
    morningVariance,
    fatigueTotal
  };
}

function renderDriverSimulation() {
  const panel = $("#driverSimulation");
  if (!panel) return;
  try {
  const results = Array.from({ length: 100 }, (_, index) => simulateDriverDay(index + 1));
  const rescueResults = Array.from({ length: 100 }, (_, index) => simulateDriverDay(index + 1, true));
  const loadOk = results.filter((item) => item.fourthLoadOk).length;
  const rescueLoadOk = rescueResults.filter((item) => item.fourthLoadOk).length;
  const run2Ok = results.filter((item) => item.run2Ok).length;
  const finalOk = results.filter((item) => item.finalOk).length;
  const avgRun3Return = Math.round(results.reduce((sum, item) => sum + item.run3Return, 0) / results.length);
  const avgFinal = Math.round(results.reduce((sum, item) => sum + item.finalTime, 0) / results.length);
  const sortedRun3 = [...results].sort((a, b) => a.run3Return - b.run3Return);
  const p80Run3 = sortedRun3[79].run3Return;
  const worst = [...results].sort((a, b) => b.run3Return - a.run3Return)[0];
  const blockerCounts = results.reduce((acc, item) => {
    acc[item.blocker] = (acc[item.blocker] || 0) + 1;
    return acc;
  }, {});
  const topBlocker = Object.entries(blockerCounts).sort((a, b) => b[1] - a[1])[0];
  const earningStable = Math.round(loadOk / 100 * parcelsForRun(4) * getUnitPrice());
  const rescueEarningStable = Math.round(rescueLoadOk / 100 * parcelsForRun(4) * getUnitPrice());
  const rescueSortedRun3 = [...rescueResults].sort((a, b) => a.run3Return - b.run3Return);
  const rescueAvgRun3 = Math.round(rescueResults.reduce((sum, item) => sum + item.run3Return, 0) / rescueResults.length);

  $("#driverSimBadge").textContent = `${loadOk}→${rescueLoadOk}/100回`;
  $("#driverSimSummary").innerHTML = `
    <strong>${loadOk}%の確率で14:30までに勝島へ戻れる想定</strong>
    <span>平均3便後戻り ${formatClock(avgRun3Return)} / 80%ライン ${formatClock(p80Run3)} / 最終平均 ${formatClock(avgFinal)}</span>
    <span>4便を取りにいける期待上乗せ ${yen.format(earningStable)}。一番多い詰まり要因は ${topBlocker[0]} ${topBlocker[1]}回。</span>
    <strong class="rescue-line">救済モードなら ${rescueLoadOk}% / 平均戻り ${formatClock(rescueAvgRun3)} / 80%ライン ${formatClock(rescueSortedRun3[79].run3Return)} / 期待上乗せ ${yen.format(rescueEarningStable)}</strong>
    <span>条件: 3便でエリアを固める、各便のAI効率ルート順で赤黄青に積み分ける、朝仕分け15分短縮、2・3便積み10分、駐車候補を先決め、受付待ち削減。</span>
  `;

  const grid = $("#driverSimGrid");
  grid.innerHTML = "";
  [
    { label: "2便後14時", value: `${run2Ok}%`, note: "2便後に勝島へ戻れる率" },
    { label: "4便積込14:30", value: `${loadOk}%`, note: "3便後に勝島へ戻れる率" },
    { label: "救済後14:30", value: `${rescueLoadOk}%`, note: "時短運用を全部入れた場合" },
    { label: "全便完了", value: `${finalOk}%`, note: "4便まで無理なく終える率" },
    { label: "最悪ケース", value: formatClock(worst.run3Return), note: `${worst.index}回目 / 主因 ${worst.blocker}` }
  ].forEach((item) => {
    const card = document.createElement("article");
    card.className = `driver-sim-card ${item.value.includes("%") && Number(item.value.replace("%", "")) < 80 ? "warn" : ""}`;
    card.innerHTML = `<span>${item.label}</span><strong>${item.value}</strong><small>${item.note}</small>`;
    grid.appendChild(card);
  });

  const samples = [results[0], results[19], results[39], results[59], results[79], results[99]];
  const log = $("#driverSimLog");
  log.innerHTML = samples.map((item) => `
    <div>
      <strong>${item.index}回目</strong>
      <span>2便後 ${formatClock(item.run2Return)} / 4便積込戻り ${formatClock(item.run3Return)} / 最終 ${formatClock(item.finalTime)} / ${item.fourthLoadOk ? "4便OK" : "4便危険"}</span>
    </div>
  `).join("");
  } catch (error) {
    $("#driverSimBadge").textContent = "再計算が必要";
    $("#driverSimSummary").innerHTML = `<strong>100回シミュレーションを表示できませんでした</strong><span>${error.message}</span>`;
    $("#driverSimGrid").innerHTML = "";
    $("#driverSimLog").innerHTML = "";
  }
}

function renderRoundTrips() {
  const activeRuns = runPlans.filter((plan) => plan.run <= runMode);
  const timeline = currentOperatingTimeline();
  const reloadOnly = Number($("#bufferMinutes")?.value || 15);
  const workStart = minutesFromTime($("#workStartTime")?.value || "05:30");
  const totalParcels = activeRuns.reduce((sum, plan) => sum + parcelsForRun(plan.run), 0);
  const totalSales = totalParcels * getUnitPrice();
  const extraSales = parcelsForRun(4) * getUnitPrice();
  const secondReturn = timeline[1]?.returnTime || estimateRunReturn(2);
  const sameDayLoadReturn = timeline[2]?.returnTime || estimateRunReturn(3);
  const sameDayLoadOk = sameDayLoadReturn <= minutesFromTime(sameDayLoadDeadline);
  const finalTime = timeline[runMode - 1]?.returnTime || estimateRunReturn(runMode);
  $("#roundtripSummary").innerHTML = `
    <strong>${runMode}往復 / ${totalParcels}個 / ${yen.format(totalSales)}</strong>
    <span>${runMode === 4 ? `4便で売上+${yen.format(extraSales)}。4便積込の勝島戻り締切 ${sameDayLoadDeadline}、見込み ${formatClock(sameDayLoadReturn)} ${sameDayLoadOk ? "OK" : "要調整"}。4便出発 ${formatClock(timeline[3].depart)} / 完了 ${formatClock(finalTime)}。` : `2便後の勝島戻り ${formatClock(secondReturn)}。3便目は配送完了 ${formatClock(finalTime)}。4便積込判定はしない。`}</span>
  `;

  const grid = $("#runGrid");
  grid.innerHTML = "";
  activeRuns.forEach((plan, index) => {
    const runTime = timeline[index];
    let finishLabel = "勝島戻り";
    if (plan.run === 2) finishLabel = "勝島戻り";
    if (plan.run === 3 && runMode === 4) finishLabel = `勝島戻り・4便積込締切${sameDayLoadDeadline}`;
    if (plan.run === 4) finishLabel = "当日配送完了";
    const prepLabel = plan.run === 1 ? `朝作業 ${formatClock(workStart)}-${formatClock(runTime.depart)}` : `車積み ${reloadOnly}分`;
    const danger = (plan.run === 2 && runTime.returnTime > minutesFromTime("14:00")) || (plan.run === 3 && runMode === 4 && runTime.returnTime > minutesFromTime(sameDayLoadDeadline));
    const timeText = plan.run === 4
      ? `${prepLabel} / ${formatClock(runTime.depart)} 出発 / ${formatClock(runTime.deliveryFinish)} ${finishLabel}`
      : `${prepLabel} / ${formatClock(runTime.depart)} 出発 / ${formatClock(runTime.deliveryFinish)} 配送完了 / ${formatClock(runTime.returnTime)} ${finishLabel}`;
    const card = document.createElement("article");
    card.className = `run-card ${danger ? "late" : ""}`;
    card.innerHTML = `
      <div><strong>${plan.run}往復目</strong><span>${parcelsForRun(plan.run)}個</span></div>
      <p>${timeText}</p>
      <small>${plan.area} / ${plan.target}</small>
    `;
    grid.appendChild(card);
  });
}

function cockpitStep() {
  const timeline = currentOperatingTimeline();
  const now = currentMinuteOfDay();
  for (const item of timeline) {
    if (now < item.depart) {
      return {
        run: item.run,
        mode: item.run === 1 ? "朝作業・1便準備" : `${item.run}便の車積み`,
        time: item.depart,
        hint: `${formatClock(item.depart)} 出発`,
        route: item.run === 4 ? "4便 当日配送の近場追加" : `${item.run}便 固定配送のナビ順で出発`
      };
    }
    if (now < item.deliveryFinish) {
      return {
        run: item.run,
        mode: `${item.run}便 配送中`,
        time: item.deliveryFinish,
        hint: `${formatClock(item.deliveryFinish)} 配送完了`,
        route: activeRouteName()
      };
    }
    if (item.run !== 4 && now < item.returnTime) {
      return {
        run: item.run,
        mode: "勝島へ戻る",
        time: item.returnTime,
        hint: `${formatClock(item.returnTime)} 勝島戻り`,
        route: item.run === 3 ? "4便積込のため勝島へ戻る" : "次便のため勝島へ戻る"
      };
    }
  }
  return {
    run: runMode,
    mode: "本日の予定完了",
    time: timeline[timeline.length - 1].returnTime,
    hint: "完了",
    route: "必要なら実績確認と燃料補給へ"
  };
}

function renderCockpit() {
  const timeline = currentOperatingTimeline();
  const step = cockpitStep();
  const thirdReturn = timeline[2]?.returnTime || 0;
  const deadline = minutesFromTime(sameDayLoadDeadline);
  const deadlineOk = thirdReturn <= deadline;
  $("#cockpitAction").textContent = step.mode;
  $("#cockpitRoute").textContent = step.route;
  $("#cockpitNextTime").textContent = formatClock(step.time);
  $("#cockpitNextHint").textContent = step.hint;
  $("#cockpitDeadline").textContent = `${formatClock(thirdReturn)} / ${sameDayLoadDeadline}`;
  $("#cockpitDeadlineHint").textContent = deadlineOk ? "4便積込OK" : "4便要調整";
  $("#cockpitDeadlineHint").className = deadlineOk ? "ok" : "warn";
}

function drawSegment(parent, a, b, className) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const line = document.createElement("div");
  line.className = className;
  line.style.left = `${a.x}%`;
  line.style.top = `${a.y}%`;
  line.style.width = `${length}%`;
  line.style.transform = `rotate(${angle}deg)`;
  parent.appendChild(line);
}

function activeWaveFromTime() {
  const hour = Number($("#timeSlot")?.value || 10);
  if (hour < 11) return 1;
  if (hour < 14) return 2;
  if (runMode === 4 && hour >= 17) return 4;
  return 3;
}

function routeStopsForMap() {
  const activeWave = activeWaveFromTime();
  const stopsForWave = activeWave === 4
    ? orderedStops.filter((stop) => stop.wave === 3).slice(-4)
    : orderedStops.filter((stop) => stop.wave === activeWave);
  return [
    { name: depot.name, area: "勝島", lat: depot.lat, lng: depot.lng, isDepot: true },
    ...stopsForWave,
    { name: depot.name, area: "勝島", lat: depot.lat, lng: depot.lng, isDepot: true }
  ];
}

function activeRouteName() {
  const activeWave = activeWaveFromTime();
  if (activeWave === 1) return "1便目 勝島→三田一丁目→芝三丁目";
  if (activeWave === 2) return "2便目 勝島→芝三丁目→三田一丁目→勝島";
  if (activeWave === 4) return "4便目 当日配送の近場追加";
  return runMode === 4 ? "3便目 配送後に勝島へ戻り、4便目を判断" : "3便目 三田一丁目→芝三丁目の配送完了";
}

function routePointForMaps(stop) {
  if (stop.lat && stop.lng) return `${stop.lat},${stop.lng}`;
  return stop.name || stop.address || depot.address;
}

function googleMapsRouteUrl() {
  const routeStops = activeMapRoute.length ? activeMapRoute : routeStopsForMap();
  const origin = encodeURIComponent(routePointForMaps(routeStops[0]));
  const destination = encodeURIComponent(routePointForMaps(routeStops[routeStops.length - 1]));
  const waypoints = routeStops.slice(1, -1).map((stop) => encodeURIComponent(routePointForMaps(stop))).join("|");
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving&avoid=tolls`;
}

function renderMap() {
  const canvas = $("#mapCanvas");
  const routeStops = routeStopsForMap();
  activeMapRoute = routeStops;
  $("#activeRouteLabel").textContent = activeRouteName();
  renderRouteSequence();
  if (!canvas || !$("#dashboard").classList.contains("active")) return;
  if (!window.L) {
    canvas.innerHTML = "<div class=\"map-fallback\">地図を読み込み中です。ネット接続後に実地図へ切り替わります。</div>";
    return;
  }

  const selectedTile = mapTiles[$("#mapStyle")?.value || "standard"];
  if (!liveMap) {
    liveMap = L.map("mapCanvas", {
      zoomControl: true,
      attributionControl: true
    });
    liveBaseLayer = L.tileLayer(selectedTile.url, {
      maxZoom: 19,
      attribution: selectedTile.attribution
    }).addTo(liveMap);
    liveMapLayer = L.layerGroup().addTo(liveMap);
  } else if (liveBaseLayer?.options?.attribution !== selectedTile.attribution) {
    liveMap.removeLayer(liveBaseLayer);
    liveBaseLayer = L.tileLayer(selectedTile.url, {
      maxZoom: 19,
      attribution: selectedTile.attribution
    }).addTo(liveMap);
  }

  if (!liveMapLayer) {
    liveMapLayer = L.layerGroup().addTo(liveMap);
  } else {
    liveMapLayer.clearLayers();
  }

  const latLngs = routeStops.map((stop) => [stop.lat, stop.lng]);
  L.polyline(latLngs, {
    color: "#0f8b8d",
    weight: 5,
    opacity: 0.9
  }).addTo(liveMapLayer);

  if ($("#vicsLayer")?.checked) {
    vicsSegments.forEach((segment) => {
      const color = segment.level === "smooth" ? "#248a5a" : segment.level === "slow" ? "#c17900" : "#c74343";
      L.polyline(segment.points, {
        color,
        weight: 7,
        opacity: 0.72,
        dashArray: segment.level === "busy" ? "8 8" : undefined
      }).bindPopup(`${segment.name}<br>${segment.message}`).addTo(liveMapLayer);
    });
  }

  routeStops.forEach((stop, index) => {
    const label = stop.isDepot ? "勝島集積所" : `${index}. ${stop.name}<br>${stop.parcels || ""}個 / 締切 ${stop.deadline || "-"}`;
    L.circleMarker([stop.lat, stop.lng], {
      radius: stop.isDepot ? 10 : 8,
      color: "#ffffff",
      weight: 3,
      fillColor: stop.isDepot ? "#172532" : "#0f8b8d",
      fillOpacity: 1
    }).bindPopup(label).addTo(liveMapLayer);
    L.marker([stop.lat, stop.lng], {
      icon: L.divIcon({
        className: "route-number-label",
        html: `<span>${index + 1}</span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      }),
      interactive: false
    }).addTo(liveMapLayer);
  });

  liveMap.invalidateSize();
  liveMap.fitBounds(L.latLngBounds(latLngs), { padding: [28, 28], maxZoom: 15 });
  setTimeout(() => liveMap.invalidateSize(), 80);
  renderMapOverlay(routeStops);
  renderVicsPanel();
}

function renderMapOverlay(routeStops) {
  const canvas = $("#mapCanvas");
  canvas.querySelector(".map-route-overlay")?.remove();
  const lats = routeStops.map((stop) => stop.lat);
  const lngs = routeStops.map((stop) => stop.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = Math.max(0.001, maxLat - minLat);
  const lngSpan = Math.max(0.001, maxLng - minLng);
  const points = routeStops.map((stop) => {
    const x = 10 + ((stop.lng - minLng) / lngSpan) * 80;
    const y = 88 - ((stop.lat - minLat) / latSpan) * 76;
    return { ...stop, x, y };
  });

  const overlay = document.createElement("div");
  overlay.className = "map-route-overlay";
  overlay.innerHTML = `
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polyline points="${points.map((point) => `${point.x},${point.y}`).join(" ")}"></polyline>
    </svg>
  `;

  points.forEach((point, index) => {
    const pin = document.createElement("div");
    pin.className = `map-overlay-pin ${point.isDepot ? "depot" : ""}`;
    pin.style.left = `${point.x}%`;
    pin.style.top = `${point.y}%`;
    pin.textContent = index + 1;
    pin.title = point.name;
    overlay.appendChild(pin);
  });

  canvas.appendChild(overlay);
}

function forceVisibleMapSync() {
  if (!$("#dashboard").classList.contains("active")) return;
  const routeStops = routeStopsForMap();
  activeMapRoute = routeStops;
  renderRouteSequence();
  renderMapOverlay(routeStops);
}

function renderVicsPanel() {
  const panel = $("#vicsPanel");
  if (!panel) return;
  const visible = $("#vicsLayer")?.checked;
  panel.innerHTML = "";
  if (!visible) {
    panel.innerHTML = "<div class=\"vics-off\">VICS表示OFF</div>";
    return;
  }
  const selectedHour = Number($("#timeSlot").value);
  const advice = routeAdvice();
  const items = [
    {
      label: "海岸通り",
      level: advice.score >= 75 ? "注意" : "良好",
      text: "勝島戻りの主軸。14時帰庫を守るため優先"
    },
    {
      label: "第一京浜",
      level: selectedHour >= 17 || advice.score >= 75 ? "混雑" : "やや混雑",
      text: "芝三丁目周辺で信号待ちが出やすい"
    },
    {
      label: "赤羽橋",
      level: $("#weatherMode").value === "rain" || $("#weatherMode").value === "storm" ? "注意" : "通常",
      text: "雨天は荷下ろし時間を多めに見る"
    }
  ];
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = `vics-item ${item.level}`;
    row.innerHTML = `<strong>${item.label}</strong><span>${item.level}</span><p>${item.text}</p>`;
    panel.appendChild(row);
  });
}

function renderRouteSequence() {
  const wrap = $("#routeSequence");
  if (!wrap) return;
  const sequence = routeStopsForMap().map((stop, index) => {
    if (index === 0) return "勝島 発";
    if (index === routeStopsForMap().length - 1) return "勝島 戻り";
    return stop.name.replace("港区", "");
  });
  wrap.innerHTML = "";
  sequence.forEach((step, index) => {
    const item = document.createElement("div");
    item.className = "route-step";
    item.innerHTML = `<span>${index + 1}</span><strong>${step}</strong>`;
    wrap.appendChild(item);
  });
}

function activeParkingArea() {
  const selected = $("#parkingArea")?.value || "auto";
  if (selected !== "auto") return selected;
  const activeWave = activeWaveFromTime();
  if (activeWave === 2) return "shiba";
  return "mita";
}

function parkingAreaLabel(area) {
  return area === "shiba" ? "芝三丁目" : "三田一丁目";
}

function parkingTypeLabel(type) {
  return type === "street" ? "路駐候補" : "有料駐車場";
}

function scoreParking(candidate) {
  const advice = routeAdvice();
  const mode = $("#parkingMode")?.value || "auto";
  const weather = $("#weatherMode")?.value || "cloudy";
  const selectedHour = Number($("#timeSlot")?.value || 10);
  const peakPenalty = selectedHour >= 10 && selectedHour <= 12 ? 8 : selectedHour >= 17 ? 12 : 0;
  const weatherRisk = weather === "rain" || weather === "storm" ? 8 : 0;
  const streetRisk = candidate.type === "street" ? candidate.risk + Math.round(advice.score / 4) + peakPenalty + weatherRisk : candidate.risk;
  const openRate = Math.max(8, Math.min(95, candidate.baseOpen - Math.round(advice.score / 5) - (candidate.type === "street" ? peakPenalty : 0)));
  const costPenalty = Math.round(candidate.price / 25);
  const walkPenalty = candidate.walk * (weather === "rain" || weather === "storm" ? 5 : 3);
  const typeBias = mode === "street" && candidate.type === "street" ? -18 : mode === "paid" && candidate.type === "paid" ? -18 : 0;
  const riskPenalty = candidate.type === "street" ? Math.round(streetRisk * 1.35) : streetRisk;
  const score = costPenalty + walkPenalty + riskPenalty - openRate + typeBias;
  return {
    ...candidate,
    openRate,
    riskScore: streetRisk,
    score
  };
}

function renderParking() {
  const body = $("#parkingBody");
  if (!body || body.hidden) return;
  const area = activeParkingArea();
  const candidates = parkingCandidates
    .filter((candidate) => candidate.area === area)
    .map(scoreParking)
    .sort((a, b) => a.score - b.score);
  const best = candidates[0];

  $("#parkingBest").innerHTML = `
    <span>今の最適解</span>
    <strong>${best.name}</strong>
    <p>${parkingAreaLabel(area)} / ${parkingTypeLabel(best.type)} / 予測空き ${best.openRate}% / ${best.price ? `${best.price}円/20分` : "0円"} / 徒歩${best.walk}分</p>
    <small>${best.type === "street" ? "短時間で降ろせる時だけ。標識と駐車禁止区間を必ず確認" : "料金はかかるが、駐禁リスクと探す時間を抑える"}</small>
  `;

  const grid = $("#parkingGrid");
  grid.innerHTML = "";
  candidates.forEach((candidate, index) => {
    const isRisky = candidate.type === "street" && candidate.riskScore >= 70;
    const card = document.createElement("article");
    card.className = `parking-card ${index === 0 ? "best" : ""} ${isRisky ? "warn" : ""}`;
    card.innerHTML = `
      <div>
        <span>${parkingTypeLabel(candidate.type)}</span>
        <strong>${candidate.name}</strong>
      </div>
      <p>${candidate.note}</p>
      <div class="parking-stats">
        <span>空き ${candidate.openRate}%</span>
        <span>${candidate.price ? `${candidate.price}円/20分` : "0円"}</span>
        <span>徒歩${candidate.walk}分</span>
        <span>リスク${candidate.riskScore}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

function setTimeSlotForNow() {
  const hour = new Date().getHours();
  const slots = [8, 10, 12, 15, 17, 19];
  const nearest = slots.reduce((best, slot) => Math.abs(slot - hour) < Math.abs(best - hour) ? slot : best, slots[0]);
  $("#timeSlot").value = String(nearest);
}

function renderAutopilot() {
  const status = $("#autopilotStatus");
  if (!status) return;
  const advice = routeAdvice();
  const nextRun = activeWaveFromTime();
  const weather = weatherLabels[$("#weatherMode")?.value || "cloudy"];
  const routeName = activeRouteName();
  const restText = $("#restBadge")?.textContent || "休憩計算中";
  if (!autopilotEnabled) {
    status.textContent = "天気・混雑・積み順・駐車判断・ナビ候補をまとめて準備します。";
    return;
  }
  status.textContent = `自動運行中: 天気 ${weather} / 混雑${riskText(advice.score)} / 次は${nextRun}便。${routeName}をナビ候補に設定済み。${restText}`;
}

async function startAutopilot() {
  autopilotEnabled = true;
  $("#startAutopilot").textContent = "自動運行中";
  $("#autopilotStatus").textContent = "天気を読み込み、今日の配送順とナビ候補を準備しています。";
  await detectWeather();
  setTimeSlotForNow();
  optimizeStops();
  const parkingBody = $("#parkingBody");
  if (parkingBody) {
    parkingBody.hidden = false;
    $("#toggleParking").setAttribute("aria-expanded", "true");
    $("#toggleParking").textContent = "駐車判断を隠す";
  }
  renderAll();
  forceVisibleMapSync();
  announceGuidance("朝の自動運行を開始しました。天気、混雑、積み順、駐車判断、ナビ候補を準備しました。画面操作を減らして走行できます。");
  startVoiceReminders();
}

function mealMinutes() {
  const preference = $("#mealPreference")?.value || "normal";
  if (preference === "light") return 10;
  if (preference === "after") return 20;
  return 15;
}

function napPlanMinutes() {
  const preference = $("#napPreference")?.value || "balanced";
  if (preference === "short") return [5, 5];
  if (preference === "none") return [];
  return [10];
}

function renderRestPlan() {
  const grid = $("#restGrid");
  const best = $("#restBest");
  if (!grid || !best) return;
  const secondReturn = estimateRunReturn(2);
  const finalReturn = estimateRunReturn(runMode);
  const mealPref = $("#mealPreference")?.value || "normal";
  const meal = mealMinutes();
  const naps = napPlanMinutes();
  const traffic = routeAdvice().score;
  const secondRunGap = Math.max(0, minutesFromTime(runPlans[1].depart) - estimateRunReturn(1));
  const afterReturnGap = Math.max(0, minutesFromTime(runPlans[2].depart) - secondReturn);
  const safeGapBefore14 = Math.max(0, minutesFromTime("14:00") - secondReturn);
  const fatigueRisk = traffic >= 75 || $("#weatherMode").value === "rain" || $("#weatherMode").value === "storm";

  const items = [];
  if (naps.length && secondRunGap >= naps[0] + 6) {
    items.push({
      title: "1便後の目閉じ休憩",
      time: `${formatClock(estimateRunReturn(1) + 3)}-${formatClock(estimateRunReturn(1) + 3 + naps[0])}`,
      detail: "2便前に頭をリセット。駐車後、目を閉じるだけでOK",
      type: "nap"
    });
  }
  if (mealPref === "after" || safeGapBefore14 < meal + 10) {
    items.push({
      title: "食事",
      time: `${formatClock(secondReturn + 8)}-${formatClock(secondReturn + 8 + meal)}`,
      detail: "14時勝島戻り後に食事。遅れが出ても崩れにくい",
      type: "meal"
    });
  } else {
    items.push({
      title: "食事",
      time: `${formatClock(Math.max(estimateRunReturn(1) + 8, minutesFromTime("11:20")))}-${formatClock(Math.max(estimateRunReturn(1) + 8, minutesFromTime("11:20")) + meal)}`,
      detail: "2便前に軽く入れる。眠気を避けるため重すぎない食事",
      type: "meal"
    });
  }
  if (naps.length > 1 && afterReturnGap >= naps[1] + 8) {
    items.push({
      title: "2回目の目閉じ休憩",
      time: `${formatClock(secondReturn + meal + 12)}-${formatClock(secondReturn + meal + 12 + naps[1])}`,
      detail: "最終便前の5分休憩。眠気がある日はここを優先",
      type: "nap"
    });
  }

  const badge = fatigueRisk ? "休憩優先" : safeGapBefore14 >= 20 ? "余裕あり" : "短く取る";
  $("#restBadge").textContent = `${badge} / ${safeGapBefore14}分余裕`;
  best.innerHTML = `
    <span>今日の最適解</span>
    <strong>${fatigueRisk ? "短い休憩を削らず、食事は軽め" : "1便後に目を閉じ、14時戻り後に食事"}</strong>
    <p>14時勝島戻りまでの余裕 ${safeGapBefore14}分。最終戻り ${formatClock(finalReturn)}。運転中の眠気を避けるため、休憩はナビの区切りで提示します。</p>
  `;
  grid.innerHTML = "";
  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = `rest-card ${item.type}`;
    card.innerHTML = `
      <span>${item.title}</span>
      <strong>${item.time}</strong>
      <p>${item.detail}</p>
    `;
    grid.appendChild(card);
  });
}

function renderTraffic() {
  const strip = $("#trafficStrip");
  const dayScores = trafficByDay["水"];
  const labels = ["8時", "10時", "12時", "15時", "17時", "19時", "21時"];
  strip.innerHTML = "";
  dayScores.forEach((score, index) => {
    const chip = document.createElement("div");
    chip.className = `traffic-chip ${riskClass(score)}`;
    chip.innerHTML = `<strong>${labels[index]}</strong>混雑 ${score}`;
    strip.appendChild(chip);
  });

  const selectedHour = Number($("#timeSlot").value);
  const slotIndex = [8, 10, 12, 15, 17, 19, 21].indexOf(selectedHour);
  const advice = routeAdvice();
  $("#trafficRisk").textContent = riskText(advice.score);
  $("#trafficHint").textContent = advice.score >= 75 ? "勝島戻りを優先し、大通り横断を減らす" : advice.score >= 55 ? "赤羽橋、芝公園、三田通りで10から18分の余裕を確保" : "三田一丁目と芝三丁目の巡回順で処理可能";
}

function renderRouteAdvisor() {
  const advice = routeAdvice();
  $("#todayCondition").textContent = `${advice.profile.weekday}曜 / ${advice.profile.isGotobi ? "五十日" : "通常日"} / ${weatherLabels[$("#weatherMode").value]}`;
  $("#routeRecommendation").textContent = advice.recommendation;
  $("#routeSummary").textContent = advice.summary;

  const evidenceList = $("#evidenceList");
  evidenceList.innerHTML = "";
  advice.evidence.forEach((item) => {
    const row = document.createElement("div");
    row.className = "evidence-item";
    row.textContent = item;
    evidenceList.appendChild(row);
  });
}

function renderMetrics() {
  const totalKm = orderedStops.reduce((sum, stop) => sum + stop.distance, 0);
  const totalWeight = orderedStops.reduce((sum, stop) => sum + stop.weight, 0);
  const listedParcels = orderedStops.reduce((sum, stop) => sum + (stop.parcels || 1), 0);
  const totalParcels = totalPlannedParcels();
  const unitPrice = getUnitPrice();
  const totalFee = totalParcels * unitPrice;
  const breakMinutes = Number($("#breakMinutes")?.value || 45);
  const timeline = currentOperatingTimeline();
  const returnMinutes = timeline[1]?.returnTime || estimateRunReturn(2);
  const finalFinish = timeline[runMode - 1]?.returnTime || Math.max(minutesFromTime("17:20"), estimateWaveEnd(3) + Math.round(breakMinutes / 3));
  const returnOk = returnMinutes <= minutesFromTime("14:00");

  $("#finishTime").textContent = formatClock(finalFinish);
  $("#returnStatus").textContent = returnOk ? "OK" : "要調整";
  $("#returnHint").textContent = `${formatClock(returnMinutes)} 2便後の勝島戻り見込み`;
  $("#parcelTotal").textContent = `${totalParcels}個`;
  $("#loadRate").textContent = `1個${unitPrice}円 / 最大便 ${Math.max(...runPlans.filter((plan) => plan.run <= runMode).map((plan) => parcelsForRun(plan.run)))}個 / リスト ${listedParcels}個`;
  $("#centerReturnBadge").textContent = `${$("#centerName")?.value || "勝島集積所"} 2便後 ${formatClock(returnMinutes)} 戻り`;
  $("#driverStatus").textContent = `${totalPlannedParcels()}個 / ${runMode}便 / 2便後14:00勝島判定`;
  $("#earningForecast").textContent = `単価 ${unitPrice}円 / 見込み売上 ${yen.format(totalFee)}、走行 ${totalKm.toFixed(1)}km、燃料控除後 ${yen.format(totalFee - Math.round(totalKm * 122))}`;
  renderAchievement();
  renderFuelPlan();
}

function completedParcelsByNow() {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  return runPlans
    .filter((plan) => plan.run <= runMode)
    .reduce((sum, plan) => current >= estimateRunReturn(plan.run) ? sum + parcelsForRun(plan.run) : sum, 0);
}

function renderAchievement() {
  const plannedParcels = totalPlannedParcels();
  const done = Math.min(plannedParcels, completedParcelsByNow());
  const rate = plannedParcels ? Math.round(done / plannedParcels * 100) : 0;
  $("#achievementRate").textContent = `${rate}%`;
  $("#achievementHint").textContent = `${done}/${plannedParcels}個 完了見込み`;
}

function fuelDueToday() {
  const interval = Number($("#fuelInterval")?.value || 2);
  const daySeed = Math.floor(new Date().getTime() / 86400000);
  return daySeed % interval === 0;
}

function cheapestFuelStation() {
  return [...fuelStations].sort((a, b) => a.price - b.price || a.detour - b.detour)[0];
}

function renderFuelPlan() {
  const cheapest = cheapestFuelStation();
  const due = fuelDueToday();
  $("#fuelStatus").textContent = due ? "補給日" : "見送り";
  $("#fuelHint").textContent = due ? `${cheapest.name} ${cheapest.price}円/L` : "明日以降に補給";
  const badge = $("#cheapestFuelBadge");
  if (badge) badge.textContent = `${cheapest.name} ${cheapest.price}円/L`;
  const grid = $("#fuelGrid");
  if (!grid) return;
  grid.innerHTML = "";
  fuelStations
    .slice()
    .sort((a, b) => a.price - b.price || a.detour - b.detour)
    .forEach((station, index) => {
      const card = document.createElement("article");
      card.className = `fuel-card ${index === 0 ? "best" : ""}`;
      card.innerHTML = `
        <strong>${station.name}</strong>
        <span>${station.area} / ${station.price}円/L / 寄り道 ${station.detour}分</span>
        <small>${station.note}</small>
      `;
      grid.appendChild(card);
    });
}

function renderAll() {
  renderCockpit();
  renderRoundTrips();
  renderMorningPlan();
  renderSimulation();
  renderDriverSimulation();
  renderStops();
  renderWavePlan();
  renderMap();
  renderTraffic();
  renderRouteAdvisor();
  renderParking();
  renderRestPlan();
  renderMetrics();
  renderAutopilot();
}

function addSameDayStop(source = "button") {
  sameDayCount += 1;
  const base = {
    id: Date.now(),
    name: source === "voice" ? "音声入力案件" : "港区芝三丁目 おかわり便",
    area: source === "voice" ? "内容確認待ち" : "三田一丁目から近距離",
    deadline: source === "voice" ? "16:00" : "17:40",
    distance: source === "voice" ? 4.4 : 5.5,
    fee: source === "voice" ? getUnitPrice() * 2 : getUnitPrice() * 8,
    weight: source === "voice" ? 9 : 20,
    wave: 3,
    parcels: source === "voice" ? 2 : 8,
    tags: source === "voice" ? ["最終便", "音声追加", "単価180円"] : ["最終便", "当日配送", "単価180円"],
    x: source === "voice" ? 32 : 55 + sameDayCount * 4,
    y: source === "voice" ? 44 : 58 - sameDayCount * 5
  };
  orderedStops.push(base);
  optimizeStops();
}

function parseVoiceText() {
  const text = $("#voiceText").value.trim();
  if (!text) {
    $("#voiceText").value = "港区芝三丁目へ16時まで、小箱2個、単価4200円";
  }
  const content = $("#voiceText").value;
  const feeMatch = content.match(/単価\s*(\d{2,5})円?/);
  const hourMatch = content.match(/(\d{1,2})時/);
  const wardMatch = content.match(/([一-龥]+区[一-龥ぁ-んァ-ンA-Za-z0-9]+)/);
  const stop = {
    id: Date.now(),
    name: wardMatch ? wardMatch[1] : "音声入力住所",
    area: "音声から登録",
    deadline: hourMatch ? `${String(hourMatch[1]).padStart(2, "0")}:00` : "16:00",
    distance: 4.6,
    fee: feeMatch ? Number(feeMatch[1]) : getUnitPrice() * 2,
    weight: content.includes("大型") ? 32 : 10,
    wave: 3,
    parcels: content.match(/(\d+)個/) ? Number(content.match(/(\d+)個/)[1]) : 2,
    tags: ["最終便", "オフィス", "音声追加"],
    x: 30 + Math.random() * 30,
    y: 30 + Math.random() * 36
  };
  if (feeMatch && $("#parcelUnitPrice")) {
    $("#parcelUnitPrice").value = feeMatch[1];
  }
  orderedStops.push(stop);
  optimizeStops();
}

async function startCamera() {
  const video = $("#cameraPreview");
  const status = $("#scanStatus");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    cameraStream = stream;
    video.srcObject = stream;
    await video.play();
    document.body.classList.add("camera-active");
    status.textContent = "カメラ接続OK。次に読取チェックで住所OCRを試します";
    showScanFeedback("retry", "カメラ接続OK");
  } catch (error) {
    status.textContent = "カメラを利用できません。デモ読取で確認できます";
    showScanFeedback("fail", "カメラ不可");
  }
}

function demoScan() {
  $("#scanStatus").textContent = "読取完了: 伝票 #K-2048 / 目黒区 / 42x31x18cm";
  $("#parcelData").innerHTML = "<span>サイズ: 42 x 31 x 18cm</span><span>重量: 6.2kg</span><span>扱い: 冷蔵</span><span>伝票: K-2048</span>";
  const box = $("#parcelBox");
  box.style.width = "190px";
  box.style.height = "128px";
}

function scannedRoutePlan(items) {
  const sorted = [...items].sort((a, b) => {
    const waveOrder = (a.wave || 99) - (b.wave || 99);
    if (waveOrder !== 0) return waveOrder;
    const deadlineOrder = minutesFromTime(a.deadline) - minutesFromTime(b.deadline);
    if (deadlineOrder !== 0) return deadlineOrder;
    const areaOrder = a.area.localeCompare(b.area, "ja");
    if (areaOrder !== 0) return areaOrder;
    return (a.address || "").localeCompare(b.address || "", "ja");
  });
  const totalParcels = sorted.reduce((sum, item) => sum + item.parcels, 0);
  const workMinutes = Math.round(totalParcels * 1.35 + sorted.length * 6 + 18);
  const finalStart = minutesFromTime("14:25");
  const finalEnd = finalStart + workMinutes;
  const canFitFinal = finalEnd <= minutesFromTime("17:20");
  return {
    sorted,
    totalParcels,
    workMinutes,
    slot: canFitFinal ? "最終便 14:25-17:20" : "最終便に一部、残りは翌朝/応援便",
    finish: formatClock(finalEnd),
    canFitFinal
  };
}

function renderRawScanLog(rawReads = []) {
  const log = $("#rawScanLog");
  if (!log) return;
  if (!rawReads.length) {
    log.hidden = true;
    log.innerHTML = "";
    return;
  }
  const sample = rawReads.slice(0, 48);
  const waveCounts = rawReads.reduce((acc, item) => {
    acc[item.wave] = (acc[item.wave] || 0) + 1;
    return acc;
  }, {});
  const colorCounts = rawReads.reduce((acc, item) => {
    acc[item.loadColor] = (acc[item.loadColor] || 0) + 1;
    return acc;
  }, {});
  log.hidden = false;
  log.innerHTML = `
    <div class="raw-scan-head">
      <strong>個別読取ログ ${rawReads.length}件</strong>
      <span>表示は先頭${sample.length}件 / 実処理は全${rawReads.length}件</span>
    </div>
    <div class="raw-scan-stats">
      <span>1便 ${waveCounts[1] || 0}件</span>
      <span>2便 ${waveCounts[2] || 0}件</span>
      <span>3便 ${waveCounts[3] || 0}件</span>
      <span>4便候補 ${waveCounts[4] || 0}件</span>
      <span class="raw-color red">赤 ${colorCounts.red || 0}件</span>
      <span class="raw-color yellow">黄 ${colorCounts.yellow || 0}件</span>
      <span class="raw-color blue">青 ${colorCounts.blue || 0}件</span>
    </div>
    <div class="raw-scan-list">
      ${sample.map((item) => `<span><b class="read-color ${item.loadColor}">${loadColorLabel(item.loadColor)}</b>${item.wave}便-${item.routeOrder || "-"}番 ${item.code} ${item.address} / ${item.deadline} / ${loadColorName(item.loadColor)}</span>`).join("")}
    </div>
  `;
}

function renderVideoScanResults(items, routeText, rawReads = []) {
  $("#videoScanCount").textContent = `${items.reduce((sum, item) => sum + item.parcels, 0)}個読取`;
  $("#videoRouteSummary").textContent = routeText;
  lastScanGroups = items;
  lastScanReads = rawReads;
  renderRawScanLog(rawReads);
  renderScanDetailMap(items, rawReads);
  if (rawReads.length) renderDoubleScanSimulation(rawReads);
  const plan = scannedRoutePlan(items);
  const slotPlan = $("#slotPlan");
  slotPlan.innerHTML = `
    <strong>${plan.canFitFinal ? "空き時間に入ります" : "時間超過の可能性あり"}</strong>
    <span>割当: ${runMode === 4 ? "4往復目の近場枠" : plan.slot} / 作業見込 ${plan.workMinutes}分 / 完了見込 ${plan.finish}</span>
    <span>推奨順: ${plan.sorted.map((item) => item.area.replace("港区", "")).join(" → ")}</span>
  `;
  const grid = $("#scanResultGrid");
  grid.innerHTML = "";

  plan.sorted.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "scan-result-card";
    card.innerHTML = `
      <strong>${index + 1}. ${item.address}</strong>
      <span>${item.area} / ${item.parcels}個 / 締切 ${item.deadline}</span>
    `;
    grid.appendChild(card);
  });
}

function scanWaveName(wave) {
  if (wave === "all") return "全体";
  return `${wave}便`;
}

function scanWaveColor(wave) {
  return {
    1: "#d83b3b",
    2: "#d4a017",
    3: "#1f7ae0",
    4: "#138a55"
  }[wave] || "#172532";
}

function filteredScanReads(rawReads = []) {
  if (scanMapWaveFilter === "all") return rawReads;
  return rawReads.filter((read) => String(read.wave) === scanMapWaveFilter);
}

function filteredScanGroups(groups = []) {
  if (scanMapWaveFilter === "all") return groups;
  return groups.filter((group) => String(group.wave) === scanMapWaveFilter);
}

function currentScanWaveReads(rawReads = []) {
  const reads = filteredScanReads(rawReads);
  const fallback = reads.length || scanMapWaveFilter !== "all" ? reads : rawReads.filter((read) => read.wave === 1);
  return [...fallback].sort((a, b) => (a.wave - b.wave) || ((a.routeOrder || 9999) - (b.routeOrder || 9999)) || a.code.localeCompare(b.code));
}

function distanceBetweenPoints(a, b) {
  const lat = (a.lat || 0) - (b.lat || 0);
  const lng = (a.lng || 0) - (b.lng || 0);
  return Math.sqrt(lat * lat + lng * lng);
}

function nearestRouteOrder(reads = []) {
  const remaining = [...reads];
  const ordered = [];
  let current = depot;
  while (remaining.length) {
    let bestIndex = 0;
    let bestDistance = Infinity;
    remaining.forEach((read, index) => {
      const distance = distanceBetweenPoints(current, read);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    const next = remaining.splice(bestIndex, 1)[0];
    ordered.push(next);
    current = next;
  }
  return ordered;
}

function applyRouteOrderAndColors(reads = []) {
  const byWave = new Map();
  reads.forEach((read) => {
    if (!byWave.has(read.wave)) byWave.set(read.wave, []);
    byWave.get(read.wave).push(read);
  });

  const result = [];
  [...byWave.entries()].sort((a, b) => a[0] - b[0]).forEach(([wave, waveReads]) => {
    const ordered = nearestRouteOrder(waveReads);
    ordered.forEach((read, index) => {
      result.push({
        ...read,
        routeOrder: index + 1,
        loadColor: classifyLoadColor({ parcels: ordered.length }, index, ordered.length),
        routeColorReason: `${wave}便ナビ順 ${index + 1}/${ordered.length}`
      });
    });
  });
  return result.sort((a, b) => (a.wave - b.wave) || (a.routeOrder - b.routeOrder));
}

function scanNavReadsForCurrentView(rawReads = []) {
  const reads = currentScanWaveReads(rawReads);
  if (scanMapWaveFilter === "all") {
    return [1, 2, 3, 4].flatMap((wave) => reads.filter((read) => read.wave === wave).slice(0, 2));
  }
  const ordered = [...reads].sort((a, b) => (a.routeOrder || 9999) - (b.routeOrder || 9999));
  const maxWaypoints = 8;
  if (ordered.length <= maxWaypoints) return ordered;
  const step = Math.max(1, Math.floor(ordered.length / maxWaypoints));
  const sampled = [];
  for (let index = 0; index < ordered.length && sampled.length < maxWaypoints; index += step) {
    sampled.push(ordered[index]);
  }
  if (!sampled.includes(ordered[ordered.length - 1])) sampled[sampled.length - 1] = ordered[ordered.length - 1];
  return sampled;
}

function deliveryClustersForCurrentView(rawReads = []) {
  const reads = currentScanWaveReads(rawReads);
  const navStops = scanNavReadsForCurrentView(rawReads);
  if (!reads.length) return [];
  if (!navStops.length) {
    return [{ anchor: reads[0], items: reads, index: 1 }];
  }
  return navStops.map((anchor, index) => {
    const nextAnchor = navStops[index + 1];
    const start = reads.findIndex((read) => read.code === anchor.code);
    const end = nextAnchor ? reads.findIndex((read) => read.code === nextAnchor.code) : reads.length;
    const items = reads.slice(Math.max(0, start), end > start ? end : reads.length);
    return { anchor, items, index: index + 1 };
  }).filter((cluster) => cluster.items.length);
}

function renderDeliveryOperation(rawReads = []) {
  const panel = $("#deliveryOperationPanel");
  if (!panel) return;
  const reads = currentScanWaveReads(rawReads);
  if (!reads.length) {
    panel.innerHTML = "<strong>車と徒歩の配送オペレーションをここに表示します</strong>";
    return;
  }
  const clusters = deliveryClustersForCurrentView(rawReads);
  const waveLabel = scanWaveName(scanMapWaveFilter);
  const first = reads[0];
  const currentClusters = clusters.slice(0, 4);
  panel.innerHTML = `
    <div class="operation-head">
      <div>
        <span class="section-kicker">Car + Walk</span>
        <strong>${waveLabel}: 車は代表地点、徒歩は${reads.length}件の個別順</strong>
      </div>
      <b>${first.routeOrder || 1}番 ${loadColorLabel(first.loadColor)}</b>
    </div>
    <div class="operation-now">
      <strong>次の配送</strong>
      <span>${first.code} ${first.address}</span>
      <span>${loadColorLabel(first.loadColor)} ${loadColorName(first.loadColor)} / ${first.routeColorReason || "ナビ順で積み込み"}</span>
    </div>
    <div class="operation-clusters">
      ${currentClusters.map((cluster) => `
        <article>
          <strong>車 ${cluster.index}: ${cluster.anchor.code} 周辺へ移動</strong>
          <span>徒歩配送 ${cluster.items.length}件 / ${cluster.items[0].routeOrder || "-"}番〜${cluster.items[cluster.items.length - 1].routeOrder || "-"}番</span>
          <div>
            ${cluster.items.slice(0, 5).map((item) => `<em class="${item.loadColor}">${item.routeOrder}. ${loadColorLabel(item.loadColor)} ${item.code}</em>`).join("")}
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderScanWaveDashboard(groups = [], rawReads = []) {
  const dashboard = $("#scanWaveDashboard");
  if (!dashboard) return;
  if (!rawReads.length && !groups.length) {
    dashboard.innerHTML = "<strong>読み取り後、便ごとの現在地と次の配送先を表示します</strong>";
    return;
  }

  const selectedReads = currentScanWaveReads(rawReads);
  const selectedGroups = filteredScanGroups(groups);
  const nextRead = selectedReads[0];
  const totalParcels = selectedReads.length || selectedGroups.reduce((sum, group) => sum + group.parcels, 0);
  const navStops = scanNavReadsForCurrentView(rawReads);
  const waveLabel = scanWaveName(scanMapWaveFilter);
  const waveCounts = [1, 2, 3, 4].map((wave) => ({
    wave,
    count: rawReads.filter((read) => read.wave === wave).length || groups.filter((group) => group.wave === wave).reduce((sum, group) => sum + group.parcels, 0)
  }));
  const nextText = nextRead
    ? `${nextRead.routeOrder || 1}番 ${nextRead.code} ${nextRead.address} / ${loadColorLabel(nextRead.loadColor)} ${loadColorName(nextRead.loadColor)}`
    : "束単位のナビ候補を表示中";
  dashboard.innerHTML = `
    <div>
      <strong>${waveLabel}を表示中: ${totalParcels}個</strong>
      <span>次: ${nextText}</span>
      <span>地図は個別ピン${selectedReads.length}件。ナビはGoogle Maps制限に合わせて代表経由地${navStops.length}点に圧縮します。</span>
    </div>
    <div class="scan-wave-counts">
      ${waveCounts.map((item) => `<span style="--wave-color:${scanWaveColor(item.wave)}">${item.wave}便 ${item.count}個</span>`).join("")}
    </div>
  `;
}

function updateScanWaveButtons() {
  document.querySelectorAll("[data-scan-wave]").forEach((button) => {
    button.classList.toggle("active", button.dataset.scanWave === scanMapWaveFilter);
  });
}

function scanRouteStopsForNavigation(groups = [], rawReads = []) {
  const navReads = scanNavReadsForCurrentView(rawReads);
  const targetGroups = filteredScanGroups(groups);
  const targetStops = navReads.length ? navReads : targetGroups;
  if (!targetStops.length) return [];
  return [
    { name: depot.name, address: depot.address, lat: depot.lat, lng: depot.lng, isDepot: true },
    ...targetStops,
    { name: depot.name, address: depot.address, lat: depot.lat, lng: depot.lng, isDepot: true }
  ];
}

function googleMapsUrlForScanWave() {
  const routeStops = scanRouteStopsForNavigation(lastScanGroups, lastScanReads);
  if (!routeStops.length) return "";
  const origin = encodeURIComponent(routePointForMaps(routeStops[0]));
  const destination = encodeURIComponent(routePointForMaps(routeStops[routeStops.length - 1]));
  const waypoints = routeStops.slice(1, -1).map((stop) => encodeURIComponent(routePointForMaps(stop))).join("|");
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ""}&travelmode=driving&avoid=tolls`;
}

function openScanWaveNavigation() {
  const url = googleMapsUrlForScanWave();
  if (!url) {
    $("#scanStatus").textContent = "先に映像読取または400個連続読取を実行してください";
    return;
  }
  window.open(url, "_blank", "noopener");
}

function renderScanDetailMap(groups = [], rawReads = []) {
  const canvas = $("#scanMap");
  if (!canvas) return;
  const mapGroups = filteredScanGroups(groups);
  const mapReads = filteredScanReads(rawReads);
  const navReads = scanNavReadsForCurrentView(rawReads);
  const routeStops = [
    { name: depot.name, area: "勝島", lat: depot.lat, lng: depot.lng, isDepot: true },
    ...(navReads.length ? navReads : mapGroups),
    { name: depot.name, area: "勝島", lat: depot.lat, lng: depot.lng, isDepot: true }
  ];
  const visibleReads = scanMapShowAllPins ? mapReads : mapReads.slice(0, 80);
  $("#scanMapStatus").textContent = rawReads.length
    ? `${scanWaveName(scanMapWaveFilter)} / 個別地点 ${mapReads.length}件 / 地図表示 ${visibleReads.length}点 / ナビ代表 ${navReads.length || mapGroups.length}点${scanMapShowAllPins ? " / 全ピン表示中" : " / 軽量表示"}`
    : `${scanWaveName(scanMapWaveFilter)} / 集約 ${mapGroups.length}束を表示`;
  $("#toggleAllScanPins").textContent = scanMapShowAllPins ? "軽量表示" : "全ピン表示";
  updateScanWaveButtons();
  renderScanWaveDashboard(groups, rawReads);
  renderDeliveryOperation(rawReads);

  if (!window.L) {
    canvas.innerHTML = "<div class=\"map-fallback\">地図ライブラリ読込後に配送地点を表示します</div>";
    return;
  }

  const selectedTile = mapTiles[$("#mapStyle")?.value || "standard"];
  if (!scanMap) {
    scanMap = L.map("scanMap", {
      zoomControl: true,
      attributionControl: false
    });
    scanBaseLayer = L.tileLayer(selectedTile.url, {
      maxZoom: 19,
      attribution: selectedTile.attribution
    }).addTo(scanMap);
    scanMapLayer = L.layerGroup().addTo(scanMap);
  } else if (scanBaseLayer?.options?.attribution !== selectedTile.attribution) {
    scanMap.removeLayer(scanBaseLayer);
    scanBaseLayer = L.tileLayer(selectedTile.url, {
      maxZoom: 19,
      attribution: selectedTile.attribution
    }).addTo(scanMap);
  }

  scanMapLayer.clearLayers();

  visibleReads.forEach((read) => {
    L.circleMarker([read.lat, read.lng], {
      radius: scanMapWaveFilter === "all" ? 3 : 4.5,
      color: scanWaveColor(read.wave),
      weight: 1,
      fillColor: loadColorHex(read.loadColor),
      fillOpacity: scanMapWaveFilter === "all" ? 0.58 : 0.82
    }).bindPopup(`${read.code}<br>${read.address}<br>${read.wave}便 / ナビ順 ${read.routeOrder || "-"}<br>${read.deadline}<br>${loadColorLabel(read.loadColor)} ${loadColorName(read.loadColor)}`).addTo(scanMapLayer);
  });

  L.polyline(routeStops.map((stop) => [stop.lat, stop.lng]), {
    color: scanWaveColor(Number(scanMapWaveFilter)),
    weight: 4,
    opacity: 0.72
  }).addTo(scanMapLayer);

  routeStops.forEach((stop, index) => {
    L.circleMarker([stop.lat, stop.lng], {
      radius: stop.isDepot ? 9 : 8,
      color: "#ffffff",
      weight: 3,
      fillColor: stop.isDepot ? "#172532" : scanWaveColor(stop.wave),
      fillOpacity: 1
    }).bindPopup(stop.isDepot ? "勝島集積所" : `${stop.code ? `${stop.code}<br>` : ""}${stop.address}<br>${stop.parcels ? `${stop.parcels}個 / ` : ""}${stop.wave}便 / ナビ代表${stop.routeOrder ? ` / 順${stop.routeOrder}` : ""}<br>${stop.deadline}`).addTo(scanMapLayer);
    L.marker([stop.lat, stop.lng], {
      icon: L.divIcon({
        className: "route-number-label",
        html: `<span>${index + 1}</span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      }),
      interactive: false
    }).addTo(scanMapLayer);
  });

  const boundsPoints = [...routeStops, ...visibleReads].map((point) => [point.lat, point.lng]);
  scanMap.invalidateSize();
  if (boundsPoints.length) {
    scanMap.fitBounds(L.latLngBounds(boundsPoints), { padding: [24, 24], maxZoom: scanMapWaveFilter === "all" ? 15 : 16 });
  }
  setTimeout(() => scanMap.invalidateSize(), 120);
}

function setScanProgress(label, percent) {
  const progress = $("#scanProgress");
  if (!progress) return;
  progress.querySelector("span").textContent = label;
  progress.querySelector("i").style.width = `${percent}%`;
}

function updateScanCounter({ read = 0, target = scanTargetCount(), confirmed = 0, retry = 0, duplicate = 0 } = {}) {
  const counter = $("#scanCounter");
  if (!counter) return;
  counter.querySelector("strong").textContent = `読取 ${read} / ${target}件`;
  counter.querySelector("span").textContent = `確定 ${confirmed}件 / 再読取 ${retry}件 / 重複 ${duplicate}件`;
}

function playScanTone(type = "ok") {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = type === "ok" ? 880 : type === "retry" ? 520 : 220;
    gain.gain.value = 0.045;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.11);
  } catch (error) {
    // Audio feedback is optional; ignore blocked autoplay/audio contexts.
  }
}

function showScanFeedback(type = "ok", text = "読取OK") {
  const feedback = $("#scanFeedback");
  if (!feedback) return;
  const mark = type === "ok" ? "○" : type === "retry" ? "△" : "×";
  feedback.className = `scan-feedback ${type}`;
  feedback.querySelector("b").textContent = mark;
  feedback.querySelector("span").textContent = text;
  playScanTone(type);
  if (navigator.vibrate) navigator.vibrate(type === "ok" ? 40 : [40, 30, 40]);
}

function scanTargetCount() {
  const input = $("#scanTargetCount");
  const value = Math.min(400, Math.max(1, Number(input?.value || 400)));
  if (input && Number(input.value) !== value) input.value = value;
  return value;
}

function renderScanCapacity() {
  const count = scanTargetCount();
  const speed = Number($("#scanSpeed")?.value || 2);
  const seconds = Math.ceil(count / speed);
  const clips = Math.max(1, Math.ceil(seconds / 60));
  const clipSeconds = Math.ceil(seconds / clips);
  $("#scanCapacityTitle").textContent = `最大400個まで連続読取 / 今回 ${count}個`;
  $("#scanTimeGuide").textContent = `撮影目安: 約${seconds}秒。おすすめは${clipSeconds}秒 x ${clips}本。荷札は0.5秒ほど止めて映すと安定します。`;
}

function doubleScanSimulation(rawReads = [], scanPasses = 2) {
  const total = rawReads.length || scanTargetCount();
  const reads = rawReads.length ? rawReads : generatedParcelReads(total);
  const speed = Number($("#scanSpeed")?.value || 2);
  const firstSeconds = Math.ceil(total / speed);
  const morningReads = reads.filter((read) => read.wave <= 3);
  const confirmSeconds = Math.ceil(morningReads.length / (speed * 1.15));
  const thirdCheckItems = Math.max(35, Math.round(total * 0.34));
  const thirdSeconds = scanPasses >= 3 ? Math.ceil(thirdCheckItems / speed) : 0;
  const totalSeconds = firstSeconds + confirmSeconds;
  const finalTotalSeconds = totalSeconds + thirdSeconds;
  const firstMissed = Math.max(1, Math.round(total * 0.055));
  const firstDuplicate = Math.max(1, Math.round(total * 0.018));
  const firstWrongWave = Math.max(1, Math.round(total * 0.024));
  const firstWrongColor = Math.max(1, Math.round(morningReads.length * 0.045));
  const finalMissed = Math.max(0, Math.round(total * 0.006));
  const finalDuplicate = Math.max(0, Math.round(total * 0.003));
  const finalWrongWave = Math.max(0, Math.round(total * 0.004));
  const finalWrongColor = Math.max(0, Math.round(morningReads.length * 0.008));
  const thirdMissed = scanPasses >= 3 ? Math.max(0, Math.round(total * 0.002)) : finalMissed;
  const thirdDuplicate = scanPasses >= 3 ? 0 : finalDuplicate;
  const thirdWrongWave = scanPasses >= 3 ? Math.max(0, Math.round(total * 0.0015)) : finalWrongWave;
  const thirdWrongColor = scanPasses >= 3 ? Math.max(0, Math.round(morningReads.length * 0.003)) : finalWrongColor;
  const firstAccuracy = Math.round((1 - (firstMissed + firstDuplicate + firstWrongWave) / total) * 1000) / 10;
  const finalAccuracy = Math.round((1 - (finalMissed + finalDuplicate + finalWrongWave) / total) * 1000) / 10;
  const thirdAccuracy = Math.round((1 - (thirdMissed + thirdDuplicate + thirdWrongWave) / total) * 1000) / 10;
  const oldLoad = Math.max(120, Number($("#oldLoadMinutes")?.value || 150));
  const currentAiLoad = Math.max(70, Number($("#aiLoadMinutes")?.value || 90));
  const doubleScanLoad = Math.max(78, currentAiLoad - Math.round(morningReads.length * 0.035) - 8);
  const tripleScanLoad = scanPasses >= 3 ? Math.max(75, doubleScanLoad - 3) : doubleScanLoad;
  const manualSearchMinutes = Math.round(morningReads.length * 0.11);
  const doubleScanSearchMinutes = Math.round(morningReads.length * 0.025);
  const finalSearchMinutes = scanPasses >= 3 ? Math.max(5, doubleScanSearchMinutes - 3) : doubleScanSearchMinutes;
  const finalLoad = scanPasses >= 3 ? tripleScanLoad : doubleScanLoad;
  const savedFromOld = oldLoad - finalLoad;
  const savedFromCurrent = currentAiLoad - finalLoad;
  const returnGain = Math.max(8, Math.round(savedFromCurrent * 0.45 + (firstWrongWave - (scanPasses >= 3 ? thirdWrongWave : finalWrongWave)) * 0.7));
  const waveCounts = [1, 2, 3, 4].map((wave) => reads.filter((read) => read.wave === wave).length);
  const colorCounts = ["red", "yellow", "blue"].map((color) => morningReads.filter((read) => read.loadColor === color).length);

  return {
    scanPasses,
    total,
    morningTotal: morningReads.length,
    firstSeconds,
    confirmSeconds,
    thirdSeconds,
    totalSeconds: finalTotalSeconds,
    firstMissed,
    firstDuplicate,
    firstWrongWave,
    firstWrongColor,
    finalMissed,
    finalDuplicate,
    finalWrongWave,
    finalWrongColor,
    thirdMissed,
    thirdDuplicate,
    thirdWrongWave,
    thirdWrongColor,
    firstAccuracy,
    finalAccuracy,
    thirdAccuracy,
    oldLoad,
    currentAiLoad,
    doubleScanLoad: finalLoad,
    manualSearchMinutes,
    doubleScanSearchMinutes: finalSearchMinutes,
    savedFromOld,
    savedFromCurrent,
    returnGain,
    waveCounts,
    colorCounts
  };
}

function renderDoubleScanSimulation(rawReads = [], scanPasses = 2) {
  const panel = $("#doubleScanPanel");
  if (!panel) return;
  const sim = doubleScanSimulation(rawReads, scanPasses);
  const accuracyText = scanPasses >= 3
    ? `${sim.firstAccuracy}% → ${sim.finalAccuracy}% → ${sim.thirdAccuracy}%`
    : `${sim.firstAccuracy}% → ${sim.finalAccuracy}%`;
  const countText = (first, second, third) => scanPasses >= 3 ? `${first}→${second}→${third}` : `${first}→${second}`;
  panel.hidden = false;
  panel.innerHTML = `
    <div class="double-scan-head">
      <div>
        <span class="section-kicker">${scanPasses >= 3 ? "Triple Scan" : "Double Scan"}</span>
        <strong>${scanPasses}回読取シミュレーション: ${sim.total}個</strong>
      </div>
      <b>${accuracyText}</b>
    </div>
    <div class="double-scan-flow">
      <span>1回目 全体読取 ${Math.ceil(sim.firstSeconds / 60)}分</span>
      <span>2回目 1〜3便確認 ${Math.ceil(sim.confirmSeconds / 60)}分</span>
      ${scanPasses >= 3 ? `<span>3回目 怪しい荷物だけ ${Math.ceil(sim.thirdSeconds / 60)}分</span>` : ""}
      <span>合計 ${Math.ceil(sim.totalSeconds / 60)}分</span>
    </div>
    <div class="double-scan-grid">
      <div><strong>${countText(sim.firstMissed, sim.finalMissed, sim.thirdMissed)}</strong><span>未読取</span></div>
      <div><strong>${countText(sim.firstDuplicate, sim.finalDuplicate, sim.thirdDuplicate)}</strong><span>重複</span></div>
      <div><strong>${countText(sim.firstWrongWave, sim.finalWrongWave, sim.thirdWrongWave)}</strong><span>便違い</span></div>
      <div><strong>${countText(sim.firstWrongColor, sim.finalWrongColor, sim.thirdWrongColor)}</strong><span>赤黄青違い</span></div>
    </div>
    <div class="double-scan-result">
      <strong>朝の仕訳・積み込み ${sim.oldLoad}分 → ${sim.doubleScanLoad}分想定</strong>
      <span>現行AI想定からさらに ${sim.savedFromCurrent}分短縮。手探し時間は ${sim.manualSearchMinutes}分 → ${sim.doubleScanSearchMinutes}分。3便後の勝島戻りは約${sim.returnGain}分前倒し見込み。</span>
      ${scanPasses >= 3 ? "<span>3回目は全荷物ではなく、1回目と2回目で不一致・低信頼・住所ゆれが出た荷物だけを再確認します。</span>" : ""}
      <span>便分け: 1便${sim.waveCounts[0]}個 / 2便${sim.waveCounts[1]}個 / 3便${sim.waveCounts[2]}個 / 4便候補${sim.waveCounts[3]}個。1〜3便の積み色: 赤${sim.colorCounts[0]} / 黄${sim.colorCounts[1]} / 青${sim.colorCounts[2]}。</span>
    </div>
  `;
}

function generatedBulkScanGroups(total) {
  const groups = [
    { address: "港区三田一丁目 1便午前指定束", area: "三田一丁目", ratio: 0.18, deadline: "09:40", lat: 35.65325, lng: 139.74295, wave: 1 },
    { address: "港区三田一丁目 1便法人受付束", area: "三田一丁目", ratio: 0.17, deadline: "10:20", lat: 35.65255, lng: 139.74443, wave: 1 },
    { address: "港区芝三丁目 2便事務所ビル束", area: "芝三丁目", ratio: 0.16, deadline: "11:00", lat: 35.65307, lng: 139.7453, wave: 2 },
    { address: "港区芝三丁目 2便昼前法人束", area: "芝三丁目", ratio: 0.16, deadline: "11:45", lat: 35.65184, lng: 139.74531, wave: 2 },
    { address: "港区三田一丁目 3便午後受付束", area: "三田一丁目", ratio: 0.14, deadline: "13:10", lat: 35.65377, lng: 139.74157, wave: 3 },
    { address: "港区芝三丁目 3便会社受付束", area: "芝三丁目", ratio: 0.12, deadline: "13:35", lat: 35.65126, lng: 139.74886, wave: 3 },
    { address: "港区三田一丁目 4便当日配送候補", area: "三田一丁目", ratio: 0.04, deadline: "16:00", lat: 35.65413, lng: 139.73945, wave: 4 },
    { address: "港区芝三丁目 4便当日配送候補", area: "芝三丁目", ratio: 0.03, deadline: "17:20", lat: 35.65238, lng: 139.74668, wave: 4 }
  ];
  let used = 0;
  return groups.map((group, index) => {
    const parcels = index === groups.length - 1 ? Math.max(1, total - used) : Math.max(1, Math.round(total * group.ratio));
    used += parcels;
    return { ...group, parcels };
  });
}

function seededNumber(seed) {
  const value = Math.sin(seed * 999.91) * 10000;
  return value - Math.floor(value);
}

function generatedParcelReads(total) {
  const groupSpecs = generatedBulkScanGroups(total);
  const mitaBlocks = ["1-4", "1-5", "1-6", "1-7", "1-8", "1-9", "1-10", "1-11", "1-12", "1-13"];
  const shibaBlocks = ["3-2", "3-3", "3-4", "3-5", "3-6", "3-7", "3-8", "3-9", "3-10", "3-11", "3-12", "3-13", "3-14", "3-15", "3-16", "3-17", "3-18", "3-19"];
  const buildingTypes = ["オフィス", "事務所", "受付", "営業所", "法人フロア", "会議室", "管理室", "バックヤード"];
  const reads = [];
  groupSpecs.forEach((group, groupIndex) => {
    for (let index = 0; index < group.parcels; index += 1) {
      const serial = reads.length + 1;
      const blocks = group.area.includes("芝") ? shibaBlocks : mitaBlocks;
      const block = blocks[Math.floor(seededNumber(serial + groupIndex * 17) * blocks.length)];
      const buildingNo = 1 + Math.floor(seededNumber(serial * 3 + groupIndex) * 39);
      const floor = 2 + Math.floor(seededNumber(serial * 5 + groupIndex) * 10);
      const type = buildingTypes[Math.floor(seededNumber(serial * 7 + groupIndex) * buildingTypes.length)];
      const suffix = group.area.includes("芝") ? "芝三丁目" : "三田一丁目";
      reads.push({
        code: `K-${String(serial).padStart(4, "0")}`,
        address: `港区${suffix}${block}-${buildingNo} ${type}${floor}F`,
        area: group.area,
        wave: group.wave,
        deadline: group.deadline,
        loadColor: classifyLoadColor(group, index, group.parcels),
        lat: group.lat + (seededNumber(serial + 11) - 0.5) * 0.0022,
        lng: group.lng + (seededNumber(serial + 19) - 0.5) * 0.0022
      });
    }
  });
  return applyRouteOrderAndColors(reads);
}

function aggregateParcelReads(reads) {
  const groups = new Map();
  reads.forEach((read) => {
    const key = `${read.wave}-${read.area}-${read.deadline}`;
    if (!groups.has(key)) {
      groups.set(key, {
        address: `港区${read.area} ${read.wave}便読取束`,
        area: read.area,
        wave: read.wave,
        deadline: read.deadline,
        parcels: 0,
        lat: read.lat,
        lng: read.lng
      });
    }
    const group = groups.get(key);
    group.parcels += 1;
    group.lat = (group.lat * (group.parcels - 1) + read.lat) / group.parcels;
    group.lng = (group.lng * (group.parcels - 1) + read.lng) / group.parcels;
  });
  return [...groups.values()].sort((a, b) => (a.wave - b.wave) || minutesFromTime(a.deadline) - minutesFromTime(b.deadline));
}

function asklAreaInfo(address = "") {
  const cleaned = address.replace(/^〒\d{3}-\d{4}\s*/, "").replace("東京都港区", "");
  const match = cleaned.match(/(芝|三田)(\d)丁目/);
  const areaKey = match ? `${match[1]}${match[2]}` : "芝1";
  const info = {
    "芝1": { area: "芝一丁目", wave: 1, deadline: "09:40", lat: 35.6519, lng: 139.7536 },
    "芝2": { area: "芝二丁目", wave: 2, deadline: "11:20", lat: 35.6502, lng: 139.7495 },
    "芝3": { area: "芝三丁目", wave: 3, deadline: "13:35", lat: 35.6522, lng: 139.7458 },
    "三田3": { area: "三田三丁目", wave: 4, deadline: "16:10", lat: 35.6472, lng: 139.7422 }
  }[areaKey] || { area: "芝一丁目", wave: 1, deadline: "09:40", lat: 35.6519, lng: 139.7536 };
  return { ...info, areaKey, cleaned };
}

function asklPagesTestReads() {
  const records = window.asklPagesTestRecords || [];
  const sorted = [...records].sort((a, b) => {
    const areaA = asklAreaInfo(a.address).areaKey;
    const areaB = asklAreaInfo(b.address).areaKey;
    if (areaA !== areaB) return areaA.localeCompare(areaB, "ja");
    return a.code.localeCompare(b.code);
  });
  const reads = sorted.map((record, index) => {
    const info = asklAreaInfo(record.address);
    const sameWaveIndex = sorted.slice(0, index).filter((item) => asklAreaInfo(item.address).wave === info.wave).length;
    const sameWaveTotal = sorted.filter((item) => asklAreaInfo(item.address).wave === info.wave).length;
    const seed = Number(record.code.replace(/\D/g, "")) || index + 1;
    const fullAddress = `${record.address} ${record.building} ${record.department}`.trim();
    return {
      code: record.code,
      address: fullAddress,
      area: info.area,
      wave: info.wave,
      deadline: info.deadline,
      loadColor: classifyLoadColor({ parcels: sameWaveTotal }, sameWaveIndex, sameWaveTotal),
      lat: info.lat + (seededNumber(seed + 41) - 0.5) * 0.003,
      lng: info.lng + (seededNumber(seed + 53) - 0.5) * 0.003,
      source: "ASKL Pages",
      customer: record.name
    };
  });
  return applyRouteOrderAndColors(reads);
}

function runAsklPagesTest() {
  const rawReads = asklPagesTestReads();
  if (!rawReads.length) {
    $("#scanStatus").textContent = "ASKL Pagesテストデータを読み込めませんでした";
    updateScanCounter({ read: 0, target: scanTargetCount(), confirmed: 0, retry: scanTargetCount(), duplicate: 0 });
    showScanFeedback("fail", "読取データなし");
    return;
  }
  const groups = aggregateParcelReads(rawReads);
  const sim = doubleScanSimulation(rawReads, 3);
  lastScanGroups = groups;
  lastScanReads = rawReads;
  scanMapShowAllPins = true;
  scanMapWaveFilter = "all";
  runMode = 4;
  $("#fourRuns")?.classList.add("active");
  $("#threeRuns")?.classList.remove("active");
  setScanProgress("ASKL Pages 400件を住所読取", 100);
  updateScanCounter({ read: rawReads.length, target: rawReads.length, confirmed: rawReads.length - sim.thirdMissed - sim.thirdWrongWave, retry: sim.thirdMissed + sim.thirdWrongWave + sim.thirdWrongColor, duplicate: sim.thirdDuplicate });
  showScanFeedback("ok", `400件読取OK`);
  const counts = [1, 2, 3, 4].map((wave) => rawReads.filter((read) => read.wave === wave).length);
  renderVideoScanResults(
    groups,
    `PagesファイルからASKL住所${rawReads.length}件を抽出してテスト読取。芝一丁目${counts[0]}件、芝二丁目${counts[1]}件、芝三丁目${counts[2]}件、三田三丁目${counts[3]}件を便別に分け、各便の中で赤黄青を効率順に判定しました。`,
    rawReads
  );
  renderDoubleScanSimulation(rawReads, 3);
  $("#videoScanCount").textContent = `${rawReads.length}件読取`;
  $("#scanStatus").textContent = "ASKL Pages 400件テスト完了。地図・便別ナビ・3回読取比較に反映しました";
}

function bulk400Scan() {
  const total = scanTargetCount();
  const speed = Number($("#scanSpeed")?.value || 2);
  const seconds = Math.ceil(total / speed);
  const clips = Math.max(1, Math.ceil(seconds / 60));
  const rawReads = generatedParcelReads(total);
  const groups = aggregateParcelReads(rawReads);
  const sim = doubleScanSimulation(rawReads, 2);
  const unitPrice = getUnitPrice();
  runMode = 4;
  $("#fourRuns")?.classList.add("active");
  $("#threeRuns")?.classList.remove("active");
  setScanProgress(`${total}個を連続読取中`, 35);
  updateScanCounter({ read: Math.round(total * 0.35), target: total, confirmed: Math.round(total * 0.28), retry: Math.round(total * 0.07), duplicate: 0 });
  showScanFeedback("retry", `${Math.round(total * 0.35)}件読取中`);
  $("#scanStatus").textContent = `${total}個モード: ${clips}本に分けて読み取り、重複を除去しています`;
  const scannedStops = groups.map((item, index) => ({
    id: Date.now() + index,
    wave: item.wave,
    parcels: item.parcels,
    name: item.address,
    area: item.area,
    deadline: item.deadline,
    distance: 0.7 + index * 0.12,
    fee: item.parcels * unitPrice,
    weight: Math.round(item.parcels * 0.45),
    tags: ["映像読取", `${item.wave}便`, `${item.parcels}個`],
    lat: item.lat,
    lng: item.lng
  }));
  orderedStops = [
    ...orderedStops.filter((stop) => !stop.tags?.includes("映像読取")),
    ...scannedStops
  ];
  optimizeStops();
  setScanProgress("400個対応の便分け・積み順へ反映", 100);
  const routeText = `${rawReads.length}個の仮住所を個別読取し、${groups.length}束に集約。撮影目安は約${seconds}秒、${Math.ceil(seconds / clips)}秒 x ${clips}本。三田一丁目・芝三丁目周辺を1〜3便固定配送と4便当日配送候補へ振り分けました。`;
  renderVideoScanResults(groups, routeText, rawReads);
  updateScanCounter({ read: rawReads.length, target: rawReads.length, confirmed: rawReads.length - sim.finalMissed - sim.finalWrongWave, retry: sim.finalMissed + sim.finalWrongWave + sim.finalWrongColor, duplicate: sim.finalDuplicate });
  showScanFeedback("ok", `${rawReads.length}件読取OK`);
  $("#videoScanCount").textContent = `${total}個読取`;
  $("#scanStatus").textContent = "連続読取完了。束単位で便分け・積み順・ルートに反映しました";
}

function runDoubleScanSimulation() {
  const rawReads = lastScanReads.length ? lastScanReads : generatedParcelReads(scanTargetCount());
  const groups = lastScanGroups.length ? lastScanGroups : aggregateParcelReads(rawReads);
  if (!lastScanReads.length) {
    const total = rawReads.length;
    const speed = Number($("#scanSpeed")?.value || 2);
    const seconds = Math.ceil(total / speed);
    renderVideoScanResults(
      groups,
      `${total}個を2回読取前提で仮シミュレーション。1回目で全体を取り込み、2回目で1〜3便の赤黄青と便違いを確認します。撮影目安は1回目約${seconds}秒です。`,
      rawReads
    );
  } else {
    renderDoubleScanSimulation(rawReads);
  }
  const sim = doubleScanSimulation(rawReads, 2);
  updateScanCounter({ read: rawReads.length, target: rawReads.length, confirmed: rawReads.length - sim.finalMissed - sim.finalWrongWave, retry: sim.finalMissed + sim.finalWrongWave + sim.finalWrongColor, duplicate: sim.finalDuplicate });
  showScanFeedback("ok", "2回読取OK");
  $("#scanStatus").textContent = "2回読取シミュレーション完了。全体読取と便ごと確認で精度・時短を比較しました";
}

function runTripleScanSimulation() {
  const rawReads = lastScanReads.length ? lastScanReads : generatedParcelReads(scanTargetCount());
  const groups = lastScanGroups.length ? lastScanGroups : aggregateParcelReads(rawReads);
  if (!lastScanReads.length) {
    const total = rawReads.length;
    const speed = Number($("#scanSpeed")?.value || 2);
    const seconds = Math.ceil(total / speed);
    renderVideoScanResults(
      groups,
      `${total}個を3回読取前提で仮シミュレーション。1回目で全体、2回目で1〜3便確認、3回目で不一致・低信頼の荷物だけを最終確認します。1回目の撮影目安は約${seconds}秒です。`,
      rawReads
    );
  }
  renderDoubleScanSimulation(rawReads, 3);
  const sim = doubleScanSimulation(rawReads, 3);
  updateScanCounter({ read: rawReads.length, target: rawReads.length, confirmed: rawReads.length - sim.thirdMissed - sim.thirdWrongWave, retry: sim.thirdMissed + sim.thirdWrongWave + sim.thirdWrongColor, duplicate: sim.thirdDuplicate });
  showScanFeedback("ok", "3回読取OK");
  $("#scanStatus").textContent = "3回読取シミュレーション完了。3回目は怪しい荷物だけを再確認する想定です";
}

function bulkVideoScan() {
  setScanProgress("動画OCR診断中", 45);
  updateScanCounter({ read: 0, target: scanTargetCount(), confirmed: 0, retry: scanTargetCount(), duplicate: 0 });
  showScanFeedback("retry", "カメラ確認");
  $("#scanStatus").textContent = "カメラは確認できます。住所を読めたかは読取チェックで判定します";
  $("#videoScanCount").textContent = "カメラ確認";
  $("#videoRouteSummary").textContent = "カメラ接続と住所読取は別です。住所が読めた時だけ件数が増えます。400件まとめて検証する場合は ASKL Pages 400件テストを使ってください。";
  const panel = $("#doubleScanPanel");
  if (panel) {
    panel.hidden = false;
    panel.innerHTML = `
      <div class="double-scan-head">
        <div>
          <span class="section-kicker">Camera Check</span>
          <strong>カメラ接続と住所読取を分けて確認</strong>
        </div>
        <b>確認中</b>
      </div>
      <div class="double-scan-result">
        <strong>住所が読めた時だけ、読取件数が増えます</strong>
        <span>カメラが映るだけでは読取完了ではありません。住所を大きく映して、読取チェックを押してください。</span>
        <span>400件まとめて検証する場合は、ASKL Pages 400件テストを押してください。</span>
      </div>
    `;
  }
  setScanProgress("カメラ確認完了・読取チェックへ", 100);
}

function normalizeOcrText(text = "") {
  return text
    .replace(/[‐‑‒–—―−]/g, "-")
    .replace(/\s+/g, "")
    .replace(/〒/g, "〒");
}

function extractAddressFromOcr(text = "") {
  const normalized = normalizeOcrText(text);
  const code = normalized.match(/ASKL-?\d{3,4}|K-?\d{3,4}/i)?.[0]?.toUpperCase().replace(/([A-Z]+)-?(\d+)/, "$1-$2") || `OCR-${String(ocrReadCount + 1).padStart(4, "0")}`;
  const address = normalized.match(/(?:〒\d{3}-?\d{4})?東京都港区(?:芝|三田)[一二三123１２３]丁目\d{1,2}-\d{1,2}/)?.[0] || "";
  const hasPostal = /〒?\d{3}-?\d{4}/.test(normalized);
  const hasTokyoMinato = /東京都?港区|港区/.test(normalized);
  const hasTargetArea = /(芝|三田)[一二三123１２３]丁目/.test(normalized);
  const hasBlock = /\d{1,2}-\d{1,2}/.test(normalized);
  const score = [hasPostal, hasTokyoMinato, hasTargetArea, hasBlock, Boolean(address)].filter(Boolean).length;
  return { code, address, score, normalized };
}

function renderOcrProof({ ok = false, address = "", confidence = 0, raw = "", reason = "" } = {}) {
  const panel = $("#ocrProofPanel");
  if (!panel) return;
  panel.hidden = false;
  panel.classList.toggle("ok", ok);
  panel.classList.toggle("fail", !ok);
  $("#ocrProofJudge").textContent = ok ? "判定OK: 住所を読めました" : `判定NG: ${reason || "住所を特定できません"}`;
  $("#ocrProofAddress").textContent = address || "-";
  $("#ocrProofConfidence").textContent = `${Math.round(confidence)}%`;
  $("#ocrProofRaw").textContent = raw ? raw.replace(/\s+/g, " ").slice(0, 220) : "-";
}

function addOcrAttempt({ ok = false, code = "", address = "", confidence = 0, raw = "", reason = "" } = {}) {
  ocrAttempts.unshift({
    id: Date.now(),
    ok,
    code,
    address,
    confidence: Math.round(confidence),
    raw: raw ? raw.replace(/\s+/g, " ").slice(0, 120) : "",
    reason
  });
  ocrAttempts = ocrAttempts.slice(0, 30);
  renderOcrReadList();
}

function renderOcrReadList() {
  const list = $("#ocrReadList");
  const items = $("#ocrReadItems");
  if (!list || !items) return;
  list.hidden = !ocrAttempts.length;
  items.innerHTML = ocrAttempts.map((item, index) => `
    <article class="${item.ok ? "ok" : "fail"}">
      <b>${item.ok ? "○" : "△"}</b>
      <div>
        <strong>${index + 1}. ${item.ok ? item.code : "再読取"} / ${item.confidence}%</strong>
        <span>${item.address || item.reason || "住所未検出"}</span>
        <small>${item.raw || "OCR文字なし"}</small>
      </div>
    </article>
  `).join("");
}

function canvasFromVideo(video) {
  const canvas = document.createElement("canvas");
  const width = video.videoWidth || video.clientWidth || 1280;
  const height = video.videoHeight || video.clientHeight || 720;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(video, 0, 0, width, height);
  return canvas;
}

async function captureParcel() {
  const video = $("#cameraPreview");
  if (!video?.srcObject) {
    $("#scanStatus").textContent = "先にカメラ起動を押してください";
    showScanFeedback("fail", "カメラ未起動");
    return;
  }
  if (!window.Tesseract) {
    $("#scanStatus").textContent = "文字読取の部品を読み込めません。再読込するか、ASKL Pages 400件テストで検証してください";
    showScanFeedback("fail", "読取準備不可");
    return;
  }
  try {
    setScanProgress("静止画OCRで住所読取中", 30);
    $("#scanStatus").textContent = "OCR読取中。住所を大きく明るく枠内に入れてください";
    const canvas = canvasFromVideo(video);
    const result = await Tesseract.recognize(canvas, "jpn+eng", {
      logger: (message) => {
        if (message.status === "recognizing text") {
          setScanProgress(`OCR解析 ${Math.round(message.progress * 100)}%`, 35 + Math.round(message.progress * 50));
        }
      }
    });
    const rawText = result.data?.text || "";
    const confidence = result.data?.confidence || 0;
    const extracted = extractAddressFromOcr(rawText);
    const ok = Boolean(extracted.address) && extracted.score >= 4 && confidence >= 35;
    if (!ok) {
      updateScanCounter({ read: ocrReadCount, target: scanTargetCount(), confirmed: ocrReadCount, retry: 1, duplicate: 0 });
      $("#scanStatus").textContent = "住所を読めませんでした。画面の反射を避け、住所を大きく映して再読取してください";
      renderOcrProof({ ok: false, address: extracted.address, confidence, raw: rawText, reason: extracted.address ? "信頼度が低いです" : "住所形式が見つかりません" });
      addOcrAttempt({ ok: false, code: extracted.code, address: extracted.address, confidence, raw: rawText, reason: extracted.address ? "信頼度が低いです" : "住所形式が見つかりません" });
      showScanFeedback("retry", "再読取");
      setScanProgress("住所未検出", 100);
      return;
    }
    ocrReadCount += 1;
    updateScanCounter({ read: ocrReadCount, target: scanTargetCount(), confirmed: ocrReadCount, retry: 0, duplicate: 0 });
    $("#scanStatus").textContent = `OCR読取OK: ${extracted.code} / ${extracted.address}`;
    $("#videoScanCount").textContent = `${ocrReadCount}件OCR読取`;
    renderOcrProof({ ok: true, address: extracted.address, confidence, raw: rawText });
    addOcrAttempt({ ok: true, code: extracted.code, address: extracted.address, confidence, raw: rawText });
    showScanFeedback("ok", `${ocrReadCount}件目OK`);
    setScanProgress("OCR読取OK", 100);
  } catch (error) {
    $("#scanStatus").textContent = "OCR処理に失敗しました。ASKL Pages 400件テストは利用できます";
    showScanFeedback("fail", "OCR失敗");
    setScanProgress("OCR失敗", 100);
  }
}

function preventCameraZoomGestures() {
  const stopGesture = (event) => {
    if (document.body.classList.contains("camera-active") || event.target.closest?.(".camera-frame")) event.preventDefault();
  };
  ["gesturestart", "gesturechange", "gestureend"].forEach((name) => {
    document.addEventListener(name, stopGesture, { passive: false });
  });
  let lastTouchEnd = 0;
  document.addEventListener("touchend", (event) => {
    if (!document.body.classList.contains("camera-active") && !event.target.closest?.(".camera-frame")) return;
    const now = Date.now();
    if (now - lastTouchEnd <= 320) event.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
  document.addEventListener("touchmove", (event) => {
    if (document.body.classList.contains("camera-active") && event.touches?.length > 1) event.preventDefault();
  }, { passive: false });
  document.addEventListener("wheel", (event) => {
    if (document.body.classList.contains("camera-active") && event.ctrlKey) event.preventDefault();
  }, { passive: false });
}

function startVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    $("#voiceText").value = "港区三田一丁目へ16時まで、冷蔵、小箱2個、単価4200円";
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "ja-JP";
  recognition.interimResults = false;
  recognition.onresult = (event) => {
    $("#voiceText").value = event.results[0][0].transcript;
  };
  recognition.start();
}

function showVoicePanel() {
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
  document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
  const scannerNav = document.querySelector('[data-panel="scanner"]');
  scannerNav?.classList.add("active");
  $("#scanner").classList.add("active");
  $("#voiceText").focus();
  if (!$("#voiceText").value.trim()) {
    $("#voiceText").value = "港区三田一丁目へ16時まで、冷蔵、小箱2個、単価4200円";
  }
}

function voiceEnabled() {
  return ($("#voiceGuide")?.value || "on") === "on";
}

function vibeEnabled() {
  return ($("#vibeGuide")?.value || "on") === "on";
}

function pulse(pattern = [180, 80, 180]) {
  if (vibeEnabled() && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function speakGuide(text) {
  if (!voiceEnabled() || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = 1.02;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function guidanceMessage() {
  const route = activeRouteName();
  const advice = routeAdvice();
  const parking = $("#parkingBest")?.textContent.replace(/\s+/g, " ").trim() || "駐車判断は未表示です";
  const morning = $("#morningPlanBadge")?.textContent || "";
  return `次の案内です。${route}。3便目までは朝に決まっている配送です。エリア分け、ナビ順、積み位置を固定して進めます。混雑リスクは${riskText(advice.score)}。${morning}。${parking}`;
}

function announceGuidance(text = guidanceMessage()) {
  pulse();
  speakGuide(text);
  $("#autopilotStatus").textContent = text;
}

function currentMinuteOfDay() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function reminderItems() {
  const timeline = currentOperatingTimeline();
  const items = [
    {
      key: "run2-load",
      time: Math.max(0, timeline[1].depart - 10),
      text: `まもなく2便目です。勝島で車積みを始める準備をしてください。出発目安は${formatClock(timeline[1].depart)}です。`
    },
    {
      key: "run2-return",
      time: Math.max(0, timeline[1].returnTime - 10),
      text: `2便後の勝島戻りが近いです。戻り見込みは${formatClock(timeline[1].returnTime)}です。14時判定に注意してください。`
    },
    {
      key: "run3-load",
      time: Math.max(0, timeline[2].depart - 10),
      text: `まもなく3便目です。仕分け済みの荷物を車へ積むだけです。出発目安は${formatClock(timeline[2].depart)}です。`
    }
  ];
  if (runMode === 4 && timeline[3]) {
    items.push(
      {
        key: "same-day-check",
        time: Math.max(0, timeline[2].returnTime - 10),
        text: `4便目の積み込み判断の時間です。${sameDayLoadDeadline}までに勝島へ戻って、近場の当日配送だけ積んでください。`
      },
      {
        key: "run4-start",
        time: Math.max(0, timeline[3].depart - 5),
        text: `まもなく4便目です。稼ぎの追加便です。無理な遠回りは入れず、近場だけで回してください。`
      }
    );
  }
  return items;
}

function checkVoiceReminders(force = false) {
  const now = currentMinuteOfDay();
  reminderItems().forEach((item) => {
    const due = force ? Math.abs(item.time - now) <= 240 : Math.abs(item.time - now) <= 1;
    if (due && !spokenReminderKeys.has(item.key)) {
      spokenReminderKeys.add(item.key);
      announceGuidance(item.text);
    }
  });
}

function startVoiceReminders() {
  clearInterval(reminderTimer);
  spokenReminderKeys.clear();
  reminderTimer = setInterval(() => checkVoiceReminders(false), 60000);
  const next = reminderItems().find((item) => item.time >= currentMinuteOfDay()) || reminderItems()[0];
  announceGuidance(`音声リマインドを開始しました。次の予定は${formatClock(next.time)}、${next.text}`);
  $("#startReminders").textContent = "音声リマインド中";
}

function openMapsWithGuidance() {
  announceGuidance();
  window.open(googleMapsRouteUrl(), "_blank", "noopener");
}

function openMaps() {
  window.open(googleMapsRouteUrl(), "_blank", "noopener");
}

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
    button.classList.add("active");
    $(`#${button.dataset.panel}`).classList.add("active");
    if (button.dataset.panel === "dashboard") {
      setTimeout(() => {
        renderAll();
        forceVisibleMapSync();
      }, 120);
      setTimeout(forceVisibleMapSync, 650);
    }
  });
});

window.googleMapsRouteUrl = googleMapsRouteUrl;
window.googleMapsScanRouteUrl = googleMapsUrlForScanWave;

document.querySelectorAll("[data-mobile-panel]").forEach((button) => {
  button.addEventListener("click", () => {
    const targetPanel = button.dataset.mobilePanel;
    document.querySelector(`[data-panel="${targetPanel}"]`)?.click();
  });
});

$("#optimizeRoute").addEventListener("click", optimizeStops);
$("#autoWeather").addEventListener("click", detectWeather);
$("#startAutopilot").addEventListener("click", startAutopilot);
$("#nextNavigation").addEventListener("click", openMapsWithGuidance);
$("#guidanceTest").addEventListener("click", () => announceGuidance("音声案内とバイブ通知の確認です。次のルート、駐車判断、休憩タイミングを必要な時にお知らせします。"));
$("#startReminders").addEventListener("click", startVoiceReminders);
$("#cockpitNavigate").addEventListener("click", openMapsWithGuidance);
$("#cockpitVoice").addEventListener("click", () => announceGuidance());
$("#topVoice").addEventListener("click", showVoicePanel);
$("#mobileVoice").addEventListener("click", showVoicePanel);
$("#mobileMaps").addEventListener("click", openMapsWithGuidance);
$("#routeNavigate").addEventListener("click", openMapsWithGuidance);
const addSameDayButton = $("#addSameDay");
if (addSameDayButton) addSameDayButton.addEventListener("click", () => addSameDayStop("button"));
$("#timeSlot").addEventListener("change", renderAll);
$("#mapStyle").addEventListener("change", renderAll);
$("#vicsLayer").addEventListener("change", renderAll);
$("#weatherMode").addEventListener("change", renderAll);
$("#toggleParking").addEventListener("click", () => {
  const body = $("#parkingBody");
  const willShow = body.hidden;
  body.hidden = !willShow;
  $("#toggleParking").setAttribute("aria-expanded", String(willShow));
  $("#toggleParking").textContent = willShow ? "駐車判断を隠す" : "駐車判断を表示";
  renderParking();
});
$("#parkingMode").addEventListener("change", renderParking);
$("#parkingArea").addEventListener("change", renderParking);
$("#threeRuns").addEventListener("click", () => {
  runMode = 3;
  $("#threeRuns").classList.add("active");
  $("#fourRuns").classList.remove("active");
  renderAll();
});
$("#fourRuns").addEventListener("click", () => {
  runMode = 4;
  $("#fourRuns").classList.add("active");
  $("#threeRuns").classList.remove("active");
  renderAll();
});
$("#routePriority").addEventListener("change", optimizeStops);
$("#breakMinutes").addEventListener("input", renderAll);
$("#napPreference").addEventListener("change", renderAll);
$("#mealPreference").addEventListener("change", renderAll);
$("#centerName").addEventListener("input", renderMetrics);
$("#parcelUnitPrice").addEventListener("input", renderAll);
$("#fuelInterval").addEventListener("change", renderAll);
$("#workStartTime").addEventListener("input", renderAll);
$("#oldLoadMinutes").addEventListener("input", renderAll);
$("#aiLoadMinutes").addEventListener("input", renderAll);
$("#bufferMinutes").addEventListener("input", renderAll);
["#run1Parcels", "#run2Parcels", "#run3Parcels", "#run4Parcels"].forEach((selector) => {
  $(selector)?.addEventListener("input", renderAll);
});
$("#startCamera").addEventListener("click", startCamera);
$("#captureParcel").addEventListener("click", captureParcel);
$("#bulkVideoScan").addEventListener("click", bulkVideoScan);
$("#bulk400Scan").addEventListener("click", bulk400Scan);
$("#asklPagesTest").addEventListener("click", runAsklPagesTest);
$("#doubleScanSim").addEventListener("click", runDoubleScanSimulation);
$("#tripleScanSim").addEventListener("click", runTripleScanSimulation);
$("#scanTargetCount").addEventListener("input", renderScanCapacity);
$("#scanSpeed").addEventListener("change", renderScanCapacity);
$("#toggleAllScanPins").addEventListener("click", () => {
  scanMapShowAllPins = !scanMapShowAllPins;
  renderScanDetailMap(lastScanGroups, lastScanReads);
});
document.querySelectorAll("[data-scan-wave]").forEach((button) => {
  button.addEventListener("click", () => {
    scanMapWaveFilter = button.dataset.scanWave;
    renderScanDetailMap(lastScanGroups, lastScanReads);
  });
});
$("#scanWaveNavigate").addEventListener("click", openScanWaveNavigation);
$("#viewScannedRoute").addEventListener("click", () => {
  document.querySelector('[data-panel="dashboard"]')?.click();
  setTimeout(forceVisibleMapSync, 400);
});
$("#demoScan").addEventListener("click", demoScan);
$("#startVoice").addEventListener("click", startVoice);
$("#parseVoice").addEventListener("click", parseVoiceText);
$("#openMaps").addEventListener("click", openMaps);

renderAll();
renderScanCapacity();
preventCameraZoomGestures();
