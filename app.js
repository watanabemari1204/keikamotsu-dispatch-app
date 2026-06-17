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
  { run: 1, load: "06:45", depart: "07:15", area: "三田一丁目→芝三丁目", parcels: 66, returnBy: "10:35", target: "午前指定を先に処理" },
  { run: 2, load: "10:50", depart: "11:05", area: "芝三丁目→三田一丁目", parcels: 64, returnBy: "13:34", target: "14時前に勝島へ戻る" },
  { run: 3, load: "14:05", depart: "14:25", area: "三田一丁目→芝三丁目", parcels: 66, returnBy: "17:20", target: "最終便を取り切る" },
  { run: 4, load: "17:30", depart: "17:45", area: "近場のみ 三田/芝", parcels: 38, returnBy: "19:10", target: "稼ぐ日だけ追加" }
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
let activeMapRoute = [];
let autopilotEnabled = false;
let reminderTimer;
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
    const parcels = targets.reduce((sum, stop) => sum + (stop.parcels || 1), 0);
    const weight = targets.reduce((sum, stop) => sum + stop.weight, 0);
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
  const plan = runPlans.find((item) => item.run === run);
  const targets = run <= 3 ? waveStops(run) : orderedStops.filter((stop) => stop.wave === 3).slice(-4);
  const stopCount = Math.max(1, targets.length || (run === 4 ? 4 : 3));
  const parcelHandling = Math.round(plan.parcels * (run === 4 ? 0.55 : 0.52));
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
    parcels: plan.parcels,
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

function renderRoundTrips() {
  const activeRuns = runPlans.filter((plan) => plan.run <= runMode);
  const timeline = currentOperatingTimeline();
  const reloadOnly = Number($("#bufferMinutes")?.value || 15);
  const workStart = minutesFromTime($("#workStartTime")?.value || "05:30");
  const totalParcels = activeRuns.reduce((sum, plan) => sum + plan.parcels, 0);
  const totalSales = totalParcels * getUnitPrice();
  const extraSales = runPlans[3].parcels * getUnitPrice();
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
      <div><strong>${plan.run}往復目</strong><span>${plan.parcels}個</span></div>
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
  const totalParcels = orderedStops.reduce((sum, stop) => sum + (stop.parcels || 1), 0);
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
  $("#loadRate").textContent = `1個${unitPrice}円 / 最大便 ${Math.max(...wavePlan.map((plan) => waveStops(plan.wave).reduce((sum, stop) => sum + (stop.parcels || 1), 0)))}個`;
  $("#centerReturnBadge").textContent = `${$("#centerName")?.value || "勝島集積所"} 2便後 ${formatClock(returnMinutes)} 戻り`;
  $("#driverStatus").textContent = `${totalParcels}個 / ${runMode}便 / 2便後14:00勝島判定`;
  $("#earningForecast").textContent = `単価 ${unitPrice}円 / 見込み売上 ${yen.format(totalFee)}、走行 ${totalKm.toFixed(1)}km、燃料控除後 ${yen.format(totalFee - Math.round(totalKm * 122))}`;
  renderAchievement();
  renderFuelPlan();
}

function completedParcelsByNow() {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  return runPlans
    .filter((plan) => plan.run <= runMode)
    .reduce((sum, plan) => current >= estimateRunReturn(plan.run) ? sum + plan.parcels : sum, 0);
}

function renderAchievement() {
  const plannedParcels = runPlans.filter((plan) => plan.run <= runMode).reduce((sum, plan) => sum + plan.parcels, 0);
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
    video.srcObject = stream;
    await video.play();
    status.textContent = "カメラ起動中。荷札のバーコードや住所を枠内へ";
  } catch (error) {
    status.textContent = "カメラを利用できません。デモ読取で確認できます";
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
    const areaOrder = a.area.localeCompare(b.area, "ja");
    if (areaOrder !== 0) return areaOrder;
    return minutesFromTime(a.deadline) - minutesFromTime(b.deadline);
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

function renderVideoScanResults(items, routeText) {
  $("#videoScanCount").textContent = `${items.reduce((sum, item) => sum + item.parcels, 0)}個読取`;
  $("#videoRouteSummary").textContent = routeText;
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

function setScanProgress(label, percent) {
  const progress = $("#scanProgress");
  if (!progress) return;
  progress.querySelector("span").textContent = label;
  progress.querySelector("i").style.width = `${percent}%`;
}

function bulkVideoScan() {
  setScanProgress("映像から荷札を読み取り中", 28);
  $("#scanStatus").textContent = "映像内の住所・個数・締切を解析中";
  const unitPrice = getUnitPrice();
  const plan = scannedRoutePlan(demoVideoScanParcels);
  setScanProgress("住所と個数を抽出", 62);
  const scannedStops = plan.sorted.map((item, index) => ({
    id: Date.now() + index,
    wave: 3,
    parcels: item.parcels,
    name: item.address,
    area: item.area,
    deadline: item.deadline,
    distance: 0.8 + index * 0.2,
    fee: item.parcels * unitPrice,
    weight: Math.round(item.parcels * 0.55),
    tags: ["映像読取", "最終便", `${item.parcels}個`],
    x: item.x,
    y: item.y
  }));

  orderedStops = [
    ...orderedStops.filter((stop) => !stop.tags?.includes("映像読取")),
    ...scannedStops
  ];
  $("#timeSlot").value = runMode === 4 ? "17" : "15";
  optimizeStops();
  setScanProgress("配送順とナビ候補へ反映", 88);

  const advice = routeAdvice();
  const routeText = `映像から${scannedStops.length}か所・${plan.totalParcels}個を読取。4便当日配送または最終便の近場枠へ割当し、${advice.recommendation}でナビ候補を更新しました。`;
  renderVideoScanResults(demoVideoScanParcels, routeText);
  $("#scanStatus").textContent = "映像一括読取完了。下の住所リストとルート反映を確認できます";
  setScanProgress("読取完了・ルート反映済み", 100);
  setTimeout(renderAll, 220);
}

function captureParcel() {
  if ("BarcodeDetector" in window) {
    $("#scanStatus").textContent = "バーコード検出に対応。実装時は伝票番号を配送APIへ照会";
  } else {
    demoScan();
  }
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
$("#startCamera").addEventListener("click", startCamera);
$("#captureParcel").addEventListener("click", captureParcel);
$("#bulkVideoScan").addEventListener("click", bulkVideoScan);
$("#viewScannedRoute").addEventListener("click", () => {
  document.querySelector('[data-panel="dashboard"]')?.click();
  setTimeout(forceVisibleMapSync, 400);
});
$("#demoScan").addEventListener("click", demoScan);
$("#startVoice").addEventListener("click", startVoice);
$("#parseVoice").addEventListener("click", parseVoiceText);
$("#openMaps").addEventListener("click", openMaps);

renderAll();
