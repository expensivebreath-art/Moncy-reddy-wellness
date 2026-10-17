/* Moncy Reddy Wellness — shared cloud state, no login screen. */
const SUPABASE_URL = window.MONCY_SUPABASE_CONFIG?.url || '';
const SUPABASE_PUBLISHABLE_KEY = window.MONCY_SUPABASE_CONFIG?.publishableKey || '';
const cloudConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY && window.supabase);
const client = cloudConfigured ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
const $ = id => document.getElementById(id);
const today = () => new Date().toLocaleDateString('en-CA');
const fmt = d => { if(!d) return ''; const date = new Date(`${d}T12:00:00`); return date.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}); };
const blankState = () => ({periods:[],periodLogs:[],medications:[],water:{goal:2000,logs:[]},checkins:[],journal:[],planner:[],goals:[],favourites:[],letters:[],quickNotes:[],garden:[],comfortNotes:[],memories:[],profile:{photo:''},skills:{status:{},removed:[],custom:[],practice:{}},requests:[],sanctuary:{reflections:[],goodThings:[]},mindEntries:[],preferences:{appearance:'dark',skin:'bloom',themeCursors:{space:'galaxy',bloom:'petal'},notifications:{checkin:false,period:false,medication:false,hydration:false,journal:false,sleep:false}}});
let cycleCalendarMonth = new Date(new Date().getFullYear(),new Date().getMonth(),1);
let state = blankState(), lastAppliedUpdatedAt = null, saveQueue = Promise.resolve(), saveInProgress = false, pendingRemoteUpdate = false, selectedMood = 'Okay';
function toast(message){const t=$('toast');t.textContent=message;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2800)}
document.getElementById('sixDigitSyncForm')?.addEventListener('submit',event=>{event.preventDefault();toast('Synced')});
function escapeHTML(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function normalizeState(value){return {...blankState(),...(value||{}),water:{...blankState().water,...(value?.water||{})},profile:{...blankState().profile,...(value?.profile||{})},skills:{...blankState().skills,...(value?.skills||{})},sanctuary:{...blankState().sanctuary,...(value?.sanctuary||{})},preferences:{...blankState().preferences,...(value?.preferences||{}),notifications:{...blankState().preferences.notifications,...(value?.preferences?.notifications||{})}}}}
async function loadState(){
  if(!client)throw new Error('Supabase client is not configured.');
  let {data,error}=await client.from('wellness_state').select('state,updated_at').eq('id',1).maybeSingle();
  if(error)throw error;
  if(!data){const {error:insertError}=await client.from('wellness_state').upsert({id:1,state:blankState(),updated_at:new Date().toISOString()},{onConflict:'id',ignoreDuplicates:true});if(insertError)throw insertError;({data,error}=await client.from('wellness_state').select('state,updated_at').eq('id',1).single());if(error)throw error;}
  state=normalizeState(data?.state);lastAppliedUpdatedAt=data?.updated_at||null;
}
async function refreshSharedState(){
  if(!client)return;
  const {data,error}=await client.from('wellness_state').select('state,updated_at').eq('id',1).maybeSingle();
  if(error)throw error;
  if(data&&data.updated_at!==lastAppliedUpdatedAt){state=normalizeState(data.state);lastAppliedUpdatedAt=data.updated_at;renderAll();applyMoodAmbience();applyAppearance(state.preferences?.appearance||'light');window.applyMoncySkin?.(state.preferences?.skin||'blush');window.applyThemeCursor?.();}
}
function subscribeSharedState(){
  if(!client)return;
  client.channel('moncy-wellness-shared-state').on('postgres_changes',{event:'*',schema:'public',table:'wellness_state',filter:'id=eq.1'},payload=>{
    const row=payload.new;
    if(!row||!row.state)return;
    if(saveInProgress){pendingRemoteUpdate=true;return;}
    if(row.updated_at===lastAppliedUpdatedAt)return;
    state=normalizeState(row.state);lastAppliedUpdatedAt=row.updated_at||null;renderAll();applyMoodAmbience();applyAppearance(state.preferences?.appearance||'light');window.applyMoncySkin?.(state.preferences?.skin||'blush');window.applyThemeCursor?.();
  }).subscribe(status=>{const el=$('settingsStorageStatus');if(el)el.textContent=status==='SUBSCRIBED'?'Connected · Live sync':status==='CHANNEL_ERROR'?'Connection error':status==='TIMED_OUT'?'Connection timed out':'Connecting…';});
}
async function saveState(){
  if(!client){toast('Cloud is not connected. Your changes were not saved.');return false;}
  const snapshot=JSON.parse(JSON.stringify(state));
  saveQueue=saveQueue.then(async()=>{
    saveInProgress=true;
    const updatedAt=new Date().toISOString();
    const {error}=await client.from('wellness_state').upsert({id:1,state:snapshot,updated_at:updatedAt},{onConflict:'id'});
    saveInProgress=false;
    if(error){toast('Could not save to cloud: '+error.message);return false;}
    lastAppliedUpdatedAt=updatedAt;renderAll();
    if(pendingRemoteUpdate){pendingRemoteUpdate=false;try{await refreshSharedState()}catch(e){console.error('Could not refresh shared data',e)}}
    return true;
  }).catch(error=>{saveInProgress=false;toast('Could not save to cloud: '+error.message);return false;});
  return saveQueue;
}
function setStorageStatus(){const el=$('settingsStorageStatus');if(el)el.textContent=cloudConfigured?'Connecting…':'Not configured';}
function showApp(){ $('authView').classList.add('hidden');$('appView').classList.remove('hidden');setStorageStatus();$('todayLabel').textContent=new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});applyAppearance(state.preferences?.appearance||'light');window.applyMoncySkin?.(state.preferences?.skin||'blush');renderAll();applyMoodAmbience();subscribeSharedState();}
function showAuth(message=''){ $('appView').classList.add('hidden');$('authView').classList.remove('hidden');if(message)$('authMessage').textContent=message; }
async function start(){
  if(!cloudConfigured){$('connectionTitle').textContent='Cloud setup needed';showAuth('Supabase could not load. Check your internet connection and supabase-config.js.');return}
  $('connectionTitle').textContent='Connecting to your shared space';
  try{await loadState();showApp()}catch(e){$('connectionTitle').textContent='Database setup needed';showAuth('Run supabase-setup.sql in the Supabase SQL Editor for this project, then refresh. Details: '+e.message)}
}
function switchView(id){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active-view',v.id===id));document.querySelectorAll('.nav-item[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===id));window.scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.goto)));
function switchHealthTab(tab){document.querySelectorAll('[data-health-tab]').forEach(b=>b.classList.toggle('active',b.dataset.healthTab===tab));document.querySelectorAll('.health-panel').forEach(p=>p.classList.toggle('hidden',p.id!=='health-'+tab));if(tab==='overview')$('health-overview').classList.remove('hidden')}
document.querySelectorAll('[data-health-tab]').forEach(b=>b.addEventListener('click',()=>switchHealthTab(b.dataset.healthTab)));
function waterToday(){return state.water.logs.filter(x=>x.date===today()).reduce((n,x)=>n+x.ml,0)}
function renderWater(){const total=waterToday(),goal=Number(state.water.goal||2000),pct=Math.min(100,Math.round(total/goal*100));['waterTotal','waterBigTotal'].forEach(id=>$(id).textContent=total.toLocaleString());$('waterGoalLabel').textContent='Goal: '+goal+' ml';$('waterProgress').style.width=pct+'%';$('waterBigProgress').style.width=pct+'%';$('waterGoal').value=goal;$('waterHistory').innerHTML=state.water.logs.filter(x=>x.date===today()).slice().reverse().map(x=>entryHTML('+'+x.ml+' ml',new Date(x.at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),`<button class="mini-btn danger" data-delete-water="${x.id}">Undo</button>`)).join('')||'<div class="empty-state">Your water log will appear here.</div>'}
document.querySelectorAll('[data-water]').forEach(b=>b.addEventListener('click',async()=>{state.water.logs.push({id:crypto.randomUUID(),date:today(),ml:Number(b.dataset.water),at:new Date().toISOString()});await saveState();toast('Water logged — little sips add up.')}));$('saveWaterGoal').addEventListener('click',async()=>{const n=Number($('waterGoal').value);if(n<250||n>6000){toast('Choose a goal between 250 and 6000 ml.');return}state.water.goal=n;await saveState();toast('Water goal updated.')});
function entryHTML(title,desc,actions=''){return `<div class="entry-item"><div><strong>${escapeHTML(title)}</strong><p>${escapeHTML(desc||'')}</p></div><div class="entry-actions">${actions}</div></div>`}
function dateDiffDays(from,to=today()){const a=new Date(from+'T12:00:00'),b=new Date(to+'T12:00:00');return Math.floor((b-a)/86400000)}
function periodStats(){const periods=state.periods.slice().filter(x=>x.start).sort((a,b)=>a.start.localeCompare(b.start));const latest=periods[periods.length-1];let cycle=Number(latest?.cycle)||28;if(periods.length>=2){const gaps=[];for(let i=1;i<periods.length;i++){const gap=dateDiffDays(periods[i-1].start,periods[i].start);if(gap>=15&&gap<=60)gaps.push(gap)}if(gaps.length)cycle=Math.round(gaps.reduce((a,b)=>a+b,0)/gaps.length)}const cycleDay=latest?Math.max(1,dateDiffDays(latest.start)+1):null;const next=latest?new Date(latest.start+'T12:00:00'):null;if(next)next.setDate(next.getDate()+cycle);return {periods,latest,cycle,cycleDay,next,nextText:next?next.toLocaleDateString('en-CA'):''}}
function renderPeriods(){const stats=periodStats(),p=stats.periods.slice().reverse(),latest=stats.latest;$('cycleSummary').textContent=latest?'Cycle day '+stats.cycleDay+' · Started '+fmt(latest.start):'Your cycle, your way';$('cycleHint').textContent=latest?`Estimated cycle length: ${stats.cycle} days · ${p.length} period start${p.length===1?'':'s'} recorded. Predictions are estimates only.`:'Log a period start date to begin your personal calendar.';$('periodPrediction').textContent=latest?'Estimated next period: '+fmt(stats.nextText)+`. You are on cycle day ${stats.cycleDay} by the logged start date. This is an estimate; cycles naturally vary.`:'Add a period start date to see an estimated next date.';$('periodHistory').innerHTML=p.map(x=>entryHTML(`${fmt(x.start)}${x.end?' – '+fmt(x.end):''}`,`Cycle length: ${x.cycle||28} days · Period length: ${x.length||5} days · Flow: ${x.flow||'Not logged'}${x.symptoms?' · Symptoms: '+x.symptoms:''}`,`<button class="mini-btn danger" data-delete-period="${x.id}">Delete</button>`)).join('')||'<div class="empty-state">No period entries yet. Add a start date whenever you want.</div>';renderCycleCalendar(stats);renderPeriodDayLogs();renderPeriodHealthInsights(stats);renderHomeHealth(stats)}
function dateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function renderCycleCalendar(stats=periodStats()){
 const month=cycleCalendarMonth,year=month.getFullYear(),m=month.getMonth();$('cycleMonthLabel').textContent=month.toLocaleDateString(undefined,{month:'long',year:'numeric'});
 const first=new Date(year,m,1),offset=(first.getDay()+6)%7,daysInMonth=new Date(year,m+1,0).getDate();
 const dayNames=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];let out=dayNames.map(d=>`<div class="calendar-weekday">${d}</div>`).join('');
 for(let i=0;i<offset;i++)out+='<div class="calendar-day blank" aria-hidden="true"></div>';
 for(let day=1;day<=daysInMonth;day++){const d=new Date(year,m,day),key=dateKey(d);let cls=['calendar-day'];if(key===today())cls.push('is-today');let label='';
  if(stats.periods.some(p=>{const end=p.end||dateKey(new Date(new Date(p.start+'T12:00:00').getTime()+((Number(p.length)||5)-1)*86400000));return key>=p.start&&key<=end;})){cls.push('is-period');label='Logged period';}
  if(stats.latest&&stats.next){const start=stats.next,plen=Number(stats.latest.length)||5;const predictedEnd=new Date(start.getTime()+(plen-1)*86400000);if(key>=dateKey(start)&&key<=dateKey(predictedEnd)&&!cls.includes('is-period')){cls.push('is-predicted');label='Predicted period';}const fertileStart=new Date(start.getTime()-14*86400000-5*86400000),fertileEnd=new Date(start.getTime()-14*86400000+1*86400000);if(key>=dateKey(fertileStart)&&key<=dateKey(fertileEnd)&&!cls.includes('is-period')&&!cls.includes('is-predicted')){cls.push('is-fertile');label='Estimated fertile window';}}
  out+=`<div class="${cls.join(' ')}" ${label?`title="${label}"`:''}><span>${day}</span>${label?'<i></i>':''}</div>`;
 }
 $('cycleCalendar').innerHTML=out;
 if(stats.latest&&stats.next){const ov=new Date(stats.next.getTime()-14*86400000),fs=new Date(ov.getTime()-5*86400000),fe=new Date(ov.getTime()+1*86400000);$('cycleInsights').innerHTML=`<div class="cycle-insight"><span>Next period estimate</span><strong>${fmt(stats.nextText)}</strong></div><div class="cycle-insight"><span>Estimated fertile window</span><strong>${fmt(dateKey(fs))} – ${fmt(dateKey(fe))}</strong></div><div class="cycle-insight"><span>Estimated ovulation</span><strong>${fmt(dateKey(ov))}</strong></div><p class="small-note">Fertile-window and ovulation dates are rough calendar estimates, not reliable contraception. They can be inaccurate, especially with irregular cycles.</p>`;}else $('cycleInsights').innerHTML='<div class="empty-state">Log a period start date to unlock cycle estimates.</div>';
}
function renderPeriodDayLogs(){const logs=(state.periodLogs||[]).slice().sort((a,b)=>b.date.localeCompare(a.date));$('periodDayHistory').innerHTML=logs.map(x=>entryHTML(fmt(x.date),[x.flow&&`Flow: ${x.flow}`,x.symptoms&&`Symptoms: ${x.symptoms}`,x.pain&&`Pain: ${x.pain}`,x.mood&&`Mood: ${x.mood}`,x.discharge&&`Discharge: ${x.discharge}`,x.energy&&`Energy: ${x.energy}`,x.notes].filter(Boolean).join(' · ')||'No extra details',`<button class="mini-btn danger" data-delete-period-log="${x.id}">Delete</button>`)).join('')||'<div class="empty-state">Your daily cycle notes will appear here.</div>'}
function renderPeriodHealthInsights(stats=periodStats()){const periods=stats.periods,logs=state.periodLogs||[],gaps=[];for(let i=1;i<periods.length;i++){const d=dateDiffDays(periods[i-1].start,periods[i].start);if(d>=1&&d<=90)gaps.push(d)}const avg=gaps.length?Math.round(gaps.reduce((a,b)=>a+b,0)/gaps.length):null;const range=gaps.length?`${Math.min(...gaps)}–${Math.max(...gaps)} days`:'Need 2+ start dates';const lengths=periods.map(x=>x.end?dateDiffDays(x.start,x.end)+1:Number(x.length)||null).filter(x=>x&&x>0&&x<20);const avgLen=lengths.length?(lengths.reduce((a,b)=>a+b,0)/lengths.length).toFixed(1):null;const recent=logs.filter(x=>dateDiffDays(x.date)<=90);const symptoms={};recent.forEach(x=>(x.symptoms||'').split(/,|;/).map(y=>y.trim()).filter(Boolean).forEach(y=>symptoms[y]=(symptoms[y]||0)+1));const common=Object.entries(symptoms).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>`${x[0]} (${x[1]})`);const severe=recent.filter(x=>String(x.pain||'').startsWith('3')).length;const cards=[['Average cycle length',avg?`${avg} days`:'Not enough data',gaps.length?`Based on ${gaps.length} interval${gaps.length===1?'':'s'} between logged starts.`:'Log at least two period start dates to calculate your personal average.'],['Cycle variation',range,gaps.length>1?'A wider range means your cycle has varied across logged months.':'More logged cycles help show your usual pattern.'],['Typical period length',avgLen?`${avgLen} days`:'Not enough data',lengths.length?'Based on saved period lengths or start/end dates.':'Add an end date or period length to build this insight.'],['Common logged symptoms',common.length?common.join(', '):'No pattern yet','Summary of symptom words you entered in the last 90 days; this is not a clinical finding.'],['Pain check-ins',`${severe} severe pain log${severe===1?'':'s'}`,severe?'If severe pain is recurring, worsening, or disrupts daily life, consider speaking with a clinician.':'Keep tracking pain levels if useful; seek help for severe or sudden pain.'],['Data coverage',`${periods.length} period start${periods.length===1?'':'s'} · ${recent.length} daily log${recent.length===1?'':'s'}`,'Insights become more useful with consistent logs; missing entries can make patterns misleading.']];$('periodHealthSummary').innerHTML=cards.map(c=>`<article class="health-insight-card"><span>${c[0]}</span><strong>${c[1]}</strong><p>${c[2]}</p></article>`).join('')}
$('cyclePrevMonth').addEventListener('click',()=>{cycleCalendarMonth=new Date(cycleCalendarMonth.getFullYear(),cycleCalendarMonth.getMonth()-1,1);renderCycleCalendar()});$('cycleNextMonth').addEventListener('click',()=>{cycleCalendarMonth=new Date(cycleCalendarMonth.getFullYear(),cycleCalendarMonth.getMonth()+1,1);renderCycleCalendar()});
$('savePeriodDay').addEventListener('click',async()=>{const flow=$('todayPeriodFlow').value,symptoms=$('todayPeriodSymptoms').value.trim(),notes=$('todayPeriodNotes').value.trim(),pain=$('todayPeriodPain').value,mood=$('todayPeriodMood').value,discharge=$('todayPeriodDischarge').value,energy=$('todayPeriodEnergy').value;if(!flow&&!symptoms&&!notes&&!pain&&!mood&&!discharge&&!energy)return toast('Add at least one detail first.');state.periodLogs.push({id:crypto.randomUUID(),date:today(),flow,symptoms,notes,pain,mood,discharge,energy,createdAt:new Date().toISOString()});['todayPeriodFlow','todayPeriodSymptoms','todayPeriodNotes','todayPeriodPain','todayPeriodMood','todayPeriodDischarge','todayPeriodEnergy'].forEach(id=>$(id).value='');await saveState();renderPeriodDayLogs();renderPeriodHealthInsights();toast("Today's cycle note saved.")});
function renderHomeHealth(stats=periodStats()){const latest=stats.latest,water=waterToday(),goal=Number(state.water.goal||2000),pct=Math.min(100,Math.round(water/goal*100));$('homeCycleDay').textContent=stats.cycleDay?'Day '+stats.cycleDay:'Not started';$('homeCycleNote').textContent=latest?`Estimated cycle length: ${stats.cycle} days`:'Add your first period start date';$('homeNextPeriod').textContent=stats.next?fmt(stats.nextText):'—';$('homeNextNote').textContent=stats.next?`${Math.max(0,dateDiffDays(today(),stats.nextText))} days from today (estimate)`:'Appears after your first entry';$('homeLastPeriod').textContent=latest?fmt(latest.start):'—';$('homeLastNote').textContent=latest?`${stats.periods.length} start date${stats.periods.length===1?'':'s'} recorded`:'Your history starts here';$('homeWater').textContent=water.toLocaleString();$('homeWaterProgress').style.width=pct+'%';$('homeWaterNote').textContent=`${pct}% of ${goal.toLocaleString()} ml goal`;
const check=state.checkins.find(x=>x.date===today());$('homeMood').textContent=check?check.mood:'Not yet';$('homeMoodNote').textContent=check?[check.energy&&`Energy: ${check.energy}`,check.sleep&&`Sleep: ${check.sleep}h`,check.stress&&`Stress: ${check.stress}`].filter(Boolean).join(' · ')||'Check-in saved':'How are you feeling today?';const total=state.medications.length,taken=state.medications.filter(m=>(m.logs||[]).some(l=>l.date===today())).length;$('homeMeds').textContent=`${taken} / ${total}`;$('homeMedsNote').textContent=total?'scheduled medicines logged today':'No medicines scheduled';$('homeHealthFoot').textContent=latest?`Tracking began from the period start date ${fmt(latest.start)}. Cycle day and next-period date update daily; dates are estimates and may vary. Add each new period start to improve your personal averages.`:'Start with one period start date in Health & wellness. From that date, your cycle day and estimated next period will update automatically.'}
$('savePeriod').addEventListener('click',async()=>{const start=$('periodStart').value;if(!start){toast('Choose a period start date first.');return}const end=$('periodEnd').value;if(end&&end<start){toast('End date should be on or after the start date.');return}state.periods.push({id:crypto.randomUUID(),start,end,cycle:Number($('cycleLength').value)||28,length:Number($('periodLength').value)||5,flow:$('periodFlow').value,symptoms:$('periodSymptoms').value.trim(),createdAt:new Date().toISOString()});await saveState();renderAll();toast('Period entry saved. Your home health snapshot is updated.')});
function renderMeds(){const meds=state.medications;$('medCount').textContent=meds.length+' scheduled';$('medSummary').textContent=meds.length?meds.length+' medicine'+(meds.length===1?'':'s')+' in your list':'No medicines added';$('medList').innerHTML=meds.map(m=>{const taken=(m.logs||[]).some(l=>l.date===today());return entryHTML(m.name,`${m.dose} · ${m.time} · ${m.clock}${m.instructions?' · '+m.instructions:''}`,`${taken?'<span class="soft-pill">Logged today</span>':`<button class="mini-btn" data-take-med="${m.id}">Log taken</button>`}<button class="mini-btn danger" data-delete-med="${m.id}">Delete</button>`)}).join('')||'<div class="empty-state">Your medication schedule will appear here.</div>'}
$('addMed').addEventListener('click',async()=>{const name=$('medName').value.trim(),dose=$('medDose').value.trim();if(!name||!dose){toast('Add a medicine name and its prescribed dose/notes.');return}state.medications.push({id:crypto.randomUUID(),name,dose,time:$('medTime').value,clock:$('medClock').value,instructions:$('medInstructions').value.trim(),logs:[]});$('medName').value='';$('medDose').value='';$('medInstructions').value='';await saveState();toast('Medication schedule added.')});
function renderCheckins(){const list=state.checkins.slice().sort((a,b)=>b.date.localeCompare(a.date));const html=list.map(c=>entryHTML(`${fmt(c.date)} · ${c.mood}`,`Energy: ${c.energy||'—'} · Sleep: ${c.sleep||'—'} h · Stress: ${c.stress||'—'}${c.symptoms?' · Symptoms: '+c.symptoms:''}${c.notes?'\n'+c.notes:''}`,`<button class="mini-btn danger" data-delete-check="${c.id}">Delete</button>`)).join('')||'<div class="empty-state">Your check-ins will appear here.</div>';$('checkHistory').innerHTML=html;document.querySelectorAll('[data-mood]').forEach(b=>b.classList.toggle('selected',b.dataset.mood===selectedMood));}
const moodSuggestions={Lovely:'Keep the good feeling going: take a short walk or write down one thing you appreciate.',Okay:'Try a two-minute stretch or a glass of water, then see how you feel.',Tired:'A small reset may help: rest your eyes, stretch gently, or take a quiet break.',Overwhelmed:'Pause for three slow breaths and choose just one small next step.',Low:'Be gentle with yourself: try a comforting song, sunlight, or a message to someone you trust.'};document.querySelectorAll('[data-mood]').forEach(b=>b.addEventListener('click',()=>{selectedMood=b.dataset.mood;document.querySelectorAll('[data-mood]').forEach(x=>x.classList.toggle('selected',x.dataset.mood===selectedMood));const suggestion=moodSuggestions[selectedMood];if(suggestion)toast(suggestion)}));
async function saveCheckin(detailed){const item={id:crypto.randomUUID(),date:today(),mood:selectedMood,energy:detailed?$('energy').value:'',sleep:detailed?$('sleepHours').value:'',symptoms:detailed?$('checkSymptoms').value.trim():'',stress:detailed?$('stress').value:'',notes:detailed?$('checkNotes').value.trim():$('overviewCheckNote').value.trim()};state.checkins=state.checkins.filter(x=>x.date!==today());state.checkins.push(item);await saveState();renderCheckins();applyMoodAmbience();toast('Your check-in has been saved. Be gentle with yourself.')} $('saveOverviewCheck').addEventListener('click',()=>saveCheckin(false));$('saveDetailedCheck').addEventListener('click',()=>saveCheckin(true));
function renderSimpleList(key,container,mapper){$(container).innerHTML=state[key].slice().reverse().map(mapper).join('')||"<div class=\"empty-state\">Nothing here yet. Add your first one whenever you're ready.</div>"}
$('saveJournal').addEventListener('click',async()=>{const title=$('journalTitle').value.trim(),body=$('journalBody').value.trim();const media=window.getJournalMediaPayload?window.getJournalMediaPayload():{};const mood=$('journalMood')?.value||'';const prompt=$('journalPrompt')?.value||'';if(!title&&!body&&!media.photos?.length&&!media.audio&&!mood){toast('Add a thought, mood, photo, or voice note first.');return}state.journal.push({id:crypto.randomUUID(),title:title||'A little reflection',body,date:today(),mood,prompt,photos:media.photos||[],audio:media.audio||'',location:media.location||''});$('journalTitle').value='';$('journalBody').value='';if($('journalMood'))$('journalMood').value='';if($('journalPrompt'))$('journalPrompt').value='';window.resetJournalMedia?.();await saveState();toast('Journal entry saved.')});
$('saveQuickNote').addEventListener('click',async()=>{const note=$('quickNote').value.trim();if(!note){toast('Write a quick thought first.');return}state.quickNotes.push({id:crypto.randomUUID(),note,date:today()});$('quickNote').value='';await saveState();toast('Little note saved.')});
$('addPlannerTask').addEventListener('click',async()=>{const text=$('plannerTask').value.trim();if(!text)return toast('Add a task first.');state.planner.push({id:crypto.randomUUID(),text,when:$('plannerWhen').value,done:false,date:today()});$('plannerTask').value='';await saveState();toast('Added to your planner.')});
$('addGoal').addEventListener('click',async()=>{const text=$('goalText').value.trim();if(!text)return toast('Add a goal first.');state.goals.push({id:crypto.randomUUID(),text,step:$('goalStep').value.trim(),done:false});$('goalText').value='';$('goalStep').value='';await saveState();toast('A little dream saved.')});
$('addFavourite').addEventListener('click',async()=>{const title=$('favouriteTitle').value.trim();if(!title)return toast('Add a title first.');state.favourites.push({id:crypto.randomUUID(),title,type:$('favouriteType').value,note:$('favouriteNote').value.trim()});$('favouriteTitle').value='';$('favouriteNote').value='';await saveState();toast('Added to your favourites.')});
$('saveLetter').addEventListener('click',async()=>{const body=$('letterBody').value.trim();if(!body)return toast('Write a few words first.');state.letters.push({id:crypto.randomUUID(),title:$('letterTitle').value.trim()||'A letter to myself',body,date:today(),unlockDate:$('letterUnlock').value||''});$('letterTitle').value='';$('letterBody').value='';$('letterUnlock').value='';await saveState();toast('Your letter has been kept.')});
const comfortIdeas={Anxious:'Place both feet on the floor. Let your exhale be a little longer than your inhale, and name five things you can see.',Sad:'You do not have to turn this feeling into a lesson. Get comfortable, have some water, and consider writing one honest sentence.',Overwhelmed:'Make the world smaller for a moment. Choose just one next step that takes less than five minutes; the rest can wait.',Lonely:'Consider sending a small message to someone safe, or spend a few minutes with a familiar song or comforting memory.',Exhausted:'If possible, lower the demands on yourself. Eat or drink something appropriate, rest your eyes, and postpone what can safely wait.'};
function renderGarden(){const list=state.garden||[];$('gardenCount').textContent=list.length+' moments nurtured';$('gardenTitle').textContent=list.length>=10?'A garden full of care':list.length>=4?'Your garden is growing':'A little seed of care';$('gardenCopy').textContent=list.length?'Every saved moment is proof that small care counts.':'Journal, care for yourself, or complete a small goal to nurture your garden.';$('gardenScene').style.setProperty('--blooms',Math.min(12,list.length+1));$('gardenList').innerHTML=list.slice().reverse().map(x=>entryHTML(x.text,fmt(x.date),`<button class="mini-btn danger" data-delete-garden="${x.id}">Delete</button>`)).join('')||'<div class="empty-state">Your first little moment will bloom here.</div>'}
$('addGardenMoment').addEventListener('click',async()=>{const text=$('gardenMoment').value.trim();if(!text)return toast('Write one kind thing first.');state.garden.push({id:crypto.randomUUID(),text,date:today()});$('gardenMoment').value='';await saveState();toast('A little flower for your garden. ♡')});
document.querySelectorAll('[data-comfort]').forEach(b=>b.addEventListener('click',()=>{$('comfortSuggestion').textContent=comfortIdeas[b.dataset.comfort];document.querySelectorAll('[data-comfort]').forEach(x=>x.classList.toggle('selected',x===b));document.body.dataset.ambience=b.dataset.comfort.toLowerCase()}));
$('saveComfortNote').addEventListener('click',async()=>{const text=$('comfortNote').value.trim();if(!text)return toast('Write anything you want to keep first.');state.comfortNotes.push({id:crypto.randomUUID(),text,date:today()});$('comfortNote').value='';await saveState();toast('Your note is saved to the shared cloud.')});
function renderComfort(){$('comfortList').innerHTML=(state.comfortNotes||[]).slice().reverse().map(x=>entryHTML('A note to yourself',fmt(x.date)+'\n'+x.text,`<button class="mini-btn danger" data-delete-comfort="${x.id}">Delete</button>`)).join('')||'<div class="empty-state">Your saved comfort notes will appear here.</div>'}
$('saveMemory').addEventListener('click',async()=>{const title=$('memoryTitle').value.trim(),note=$('memoryNote').value.trim();if(!title&&!note)return toast('Add a title or a few words first.');state.memories.push({id:crypto.randomUUID(),title:title||'A little memory',date:$('memoryDate').value||today(),link:$('memoryLink').value.trim(),note});$('memoryTitle').value='';$('memoryDate').value='';$('memoryLink').value='';$('memoryNote').value='';await saveState();toast('A little memory tucked away. ♡')});
function renderMuseum(){$('memoryList').innerHTML=(state.memories||[]).slice().reverse().map(x=>entryHTML(x.title,fmt(x.date)+(x.note?'\n'+x.note:'')+(x.link?'\n'+x.link:''),`<button class="mini-btn danger" data-delete-memory="${x.id}">Delete</button>`)).join('')||'<div class="empty-state">Your keepsakes will live here.</div>'}
function applyMoodAmbience(){const latest=(state.checkins||[]).slice().sort((a,b)=>b.date.localeCompare(a.date))[0];document.body.dataset.ambience=(latest?.mood||'gentle').toLowerCase()}
function renderAll(){renderWater();renderPeriods();renderMeds();renderCheckins();renderHomeHealth();renderSimpleList('journal','journalList',x=>entryHTML(x.title,(x.date+' · '+(x.mood||'No mood selected')+(x.prompt?' · Prompt: '+x.prompt:'')+(x.location?' · '+x.location:'')+'\n'+x.body+(x.photos?.length?'\n📷 '+x.photos.length+' photo(s)':'')+(x.audio?'\n🎙 Voice note attached':'')),`<button class="mini-btn danger" data-delete-journal="${x.id}">Delete</button>`));renderSimpleList('planner','plannerList',x=>entryHTML((x.done?'✓ ':'')+x.text,x.when+' · '+fmt(x.date),`<button class="mini-btn" data-toggle-task="${x.id}">${x.done?'Undo':'Done'}</button><button class="mini-btn danger" data-delete-task="${x.id}">Delete</button>`));renderSimpleList('goals','goalList',x=>entryHTML((x.done?'✓ ':'')+x.text,x.step,`<button class="mini-btn" data-toggle-goal="${x.id}">${x.done?'Undo':'Done'}</button><button class="mini-btn danger" data-delete-goal="${x.id}">Delete</button>`));renderSimpleList('favourites','favouriteList',x=>entryHTML(x.title,x.type+(x.note?' · '+x.note:''),`<button class="mini-btn danger" data-delete-fav="${x.id}">Delete</button>`));renderSimpleList('letters','letterList',x=>{const locked=x.unlockDate&&x.unlockDate>today();return entryHTML(x.title,locked?'Opens on '+fmt(x.unlockDate):fmt(x.date)+'\n'+x.body,locked?'<span class="soft-pill">Sealed for later</span>':`<button class="mini-btn danger" data-delete-letter="${x.id}">Delete</button>`)});renderGarden();renderComfort();renderMuseum();}
document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;const del=(attr,key)=>{if(b.hasAttribute(attr)){state[key]=state[key].filter(x=>x.id!==b.getAttribute(attr));return true}return false};if(b.dataset.takeMed){const m=state.medications.find(x=>x.id===b.dataset.takeMed);if(m){m.logs=m.logs||[];m.logs.push({date:today(),at:new Date().toISOString()});await saveState();toast('Dose log recorded.');}return}const operations=[['data-delete-water','water.logs'],['data-delete-garden','garden'],['data-delete-comfort','comfortNotes'],['data-delete-memory','memories'],['data-delete-period','periods'],['data-delete-period-log','periodLogs'],['data-delete-med','medications'],['data-delete-check','checkins'],['data-delete-journal','journal'],['data-delete-task','planner'],['data-delete-goal','goals'],['data-delete-fav','favourites'],['data-delete-letter','letters']];for(const [attr,path] of operations){if(b.hasAttribute(attr)){const [parent,child]=path.split('.');if(child)state[parent][child]=state[parent][child].filter(x=>x.id!==b.getAttribute(attr));else state[parent]=state[parent].filter(x=>x.id!==b.getAttribute(attr));await saveState();toast('Removed.');return}}if(b.dataset.toggleTask){const x=state.planner.find(x=>x.id===b.dataset.toggleTask);if(x)x.done=!x.done;await saveState()}if(b.dataset.toggleGoal){const x=state.goals.find(x=>x.id===b.dataset.toggleGoal);if(x)x.done=!x.done;await saveState()}});
$('notifyBtn').addEventListener('click',async()=>{if(!('Notification'in window)){toast('This browser does not support web notifications.');return}const result=await Notification.requestPermission();if(result==='granted'){toast('Browser notifications enabled while this page can run.');new Notification("Moncy's little reminder",{body:'Take a sip of water and be kind to yourself. ♡'})}else toast('Notifications are blocked in browser settings.')});
// Browser reminders are checked while the app page is open. Closed-tab delivery needs a push backend.
let reminded=new Set();function checkReminders(){if(!('Notification'in window)||Notification.permission!=='granted')return;const now=new Date(),clock=now.toTimeString().slice(0,5),day=today();const send=(key,title,body)=>{const stamp=key+'-'+day+'-'+clock;if(!reminded.has(stamp)&&!localStorage.getItem('moncy-reminder-'+key+'-'+day+'-'+clock)){reminded.add(stamp);try{new Notification(title,{body});localStorage.setItem('moncy-reminder-'+key+'-'+day+'-'+clock,'sent')}catch(e){console.warn('Reminder could not be shown',e)}}};
 if(state.preferences?.notifications?.medication===true){state.medications.forEach(m=>{if(m.clock===clock&&!(m.logs||[]).some(l=>l.date===day&&new Date(l.at).toTimeString().slice(0,5)===clock))send('med-'+m.id,'Medication Reminder',`${m.name} · ${m.dose}. Follow your prescribed instructions.`)})}
 if(state.preferences?.notifications?.period===true){try{const stats=periodStats();if(stats.next){const days=dateDiffDays(day,stats.nextText);if(days>=0&&days<=2){const key='period-'+stats.nextText;send(key,days===0?'Period Expected Today':'Period Starting Soon',days===0?'Your estimated period date is today. This is only a prediction.':`Your period may start in ${days} day${days===1?'':'s'}. Predictions can vary.`)}}}catch(e){console.warn('Period reminder skipped',e)}}
 const clockReminders=[['checkin','20:00','State of Mind Check-in','Pause for a moment and notice how you are feeling.'],['hydration','11:00','Hydration Reminder','A gentle nudge to have some water if you need it.'],['hydration','15:00','Hydration Reminder','Take a small pause for water and a stretch.'],['hydration','19:00','Hydration Reminder','Check in with your hydration for today.'],['journal','21:00','Journaling Reminder','Would a few quiet lines help you close the day?'],['sleep','22:00','Bedtime Wind-down','Begin easing into a calmer evening when you can.']];for(const [pref,time,title,body] of clockReminders){if(state.preferences?.notifications?.[pref]===true&&clock===time)send(pref+'-'+time,title,body)}
}checkReminders();setInterval(checkReminders,30000);
start().catch(e=>showAuth('Setup issue: '+e.message));

// Appearance preference is part of the shared cloud state, so it follows Moncy across browsers.
function applyAppearance(theme='light'){
  const lightBtn=document.getElementById('lightThemeBtn');
  const darkBtn=document.getElementById('darkThemeBtn');
  if(!lightBtn||!darkBtn)return;
  theme=theme==='dark'?'dark':'light';
  document.body.dataset.theme=theme;
  const dark=theme==='dark';
  lightBtn.classList.toggle('active',!dark);darkBtn.classList.toggle('active',dark);
  lightBtn.setAttribute('aria-pressed',String(!dark));darkBtn.setAttribute('aria-pressed',String(dark));
  const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=dark?'#171419':'#fff7f4';
}
(function setupAppearance(){
  const lightBtn=document.getElementById('lightThemeBtn');
  const darkBtn=document.getElementById('darkThemeBtn');
  if(!lightBtn||!darkBtn)return;
  applyAppearance('light');
  lightBtn.addEventListener('click',async()=>{state.preferences=state.preferences||{};state.preferences.appearance='light';applyAppearance('light');await saveState()});
  darkBtn.addEventListener('click',async()=>{state.preferences=state.preferences||{};state.preferences.appearance='dark';applyAppearance('dark');await saveState()});
})();

// Birthday surprise sequence: gift unwraps (sparkles + music) → letter → photo memories → cake → colourful blast.
(function setupBirthdayGift(){
  const overlay=document.getElementById('birthdayGift'); if(!overlay)return;
  const box=document.getElementById('unwrapGiftBtn'), cake=document.getElementById('birthdayCakeStage'), blast=document.getElementById('birthdayBlast'), photos=document.getElementById('giftPhotosStage');
  const BE=()=>window.BirthdayExtras||null;
  overlay.classList.remove('hidden'); document.body.classList.add('gift-open');
  const unwrap=()=>{overlay.classList.add('unwrapped');box.disabled=true;try{BE()?.burst(overlay);BE()?.music.start()}catch(e){console.warn(e)}};
  const showPhotos=()=>{overlay.classList.add('photo-time');setTimeout(()=>photos?.scrollIntoView({behavior:'smooth',block:'center'}),80);};
  const showCake=()=>{overlay.classList.remove('photo-time');overlay.classList.add('cake-time');setTimeout(()=>cake.scrollIntoView({behavior:'smooth',block:'center'}),80);};
  const cutCake=()=>{overlay.classList.add('cake-cut');setTimeout(()=>{overlay.classList.add('birthday-fireworks');blast.scrollIntoView({behavior:'smooth',block:'center'});},700);};
  const close=()=>{overlay.classList.add('hidden');document.body.classList.remove('gift-open');try{BE()?.music.stop()}catch(e){}};
  box?.addEventListener('click',unwrap);
  document.getElementById('toCakeBtn')?.addEventListener('click',showPhotos);
  document.getElementById('toCakeFromPhotos')?.addEventListener('click',showCake);
  document.getElementById('cutCakeBtn')?.addEventListener('click',cutCake);
  document.getElementById('enterGiftBtn')?.addEventListener('click',close);
  document.getElementById('skipGiftBtn')?.addEventListener('click',close);
  document.getElementById('giftMusicBtn')?.addEventListener('click',()=>{try{BE()?.music.toggle()}catch(e){}});
})();

// Theme-specific cursor preferences are saved with the shared wellness state.
function applyCursorStyle(style){
  const classes=['botanical-cursor','cursor-petal','cursor-sparkle','cursor-soft','cursor-galaxy','cursor-planet','cursor-trail','cursor-blackhole','cursor-astronaut'];
  document.body.classList.remove(...classes);
  const classMap={petal:'cursor-petal',galaxy:'cursor-galaxy'};
  if(classMap[style]) document.body.classList.add(classMap[style]);
  document.querySelectorAll('[data-theme-cursor]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.cursorStyle===style && btn.dataset.themeCursor===document.body.dataset.skin)));
}
window.applyThemeCursor=()=>{
  state.preferences=state.preferences||{};state.preferences.themeCursors=state.preferences.themeCursors||{space:'galaxy',bloom:'petal'};
  const skin=document.body.dataset.skin==='space'?'space':'bloom';
  let chosen=state.preferences.themeCursors[skin]||(skin==='space'?'galaxy':'petal');if(skin==='space'&&!['galaxy','default'].includes(chosen))chosen='galaxy';if(skin==='bloom'&&!['petal','default'].includes(chosen))chosen='petal';state.preferences.themeCursors[skin]=chosen;applyCursorStyle(chosen);
};
// Notification preferences are opt-in and synced with the shared preferences record.
(function setupNotificationPreferences(){
  document.querySelectorAll('[data-notify-pref]').forEach(input=>{
    const key=input.dataset.notifyPref;
    input.checked=state.preferences?.notifications?.[key]===true;
    input.addEventListener('change',async()=>{
      state.preferences=state.preferences||{};state.preferences.notifications=state.preferences.notifications||{};
      state.preferences.notifications[key]=input.checked;
      if(input.checked && 'Notification' in window && Notification.permission==='default'){
        const permission=await Notification.requestPermission();
        if(permission!=='granted'){input.checked=false;state.preferences.notifications[key]=false;toast('Allow browser notifications to enable reminders.');}
      }
      await saveState();toast(input.checked?'Reminder enabled.':'Reminder turned off.');
    });
  });
})();
// Context-aware click effects: each control gets a matching space or floral burst.
(function setupThemeEffects(){
  document.addEventListener('click',e=>{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const target=e.target.closest('button,a,[role="button"],input,select,textarea,.feature-card,.panel'); if(!target)return;
    const space=document.body.dataset.skin==='space';
    const effect=document.createElement('span'); effect.className='theme-click-effect '+(space?'space-effect':'bloom-effect');
    effect.textContent=space?(['✦','✧','·','✦'][Math.floor(Math.random()*4)]):(['✿','❀','✧','♡'][Math.floor(Math.random()*4)]);
    effect.style.left=e.clientX+'px';effect.style.top=e.clientY+'px';document.body.append(effect);setTimeout(()=>effect.remove(),1050);
  },{passive:true});
})();
(function setupBrandSettings(){
  const toggle=document.getElementById('cursorToggle');
  document.querySelectorAll('[data-theme-cursor]').forEach(btn=>btn.addEventListener('click',async()=>{
    const theme=btn.dataset.themeCursor,style=btn.dataset.cursorStyle;
    state.preferences=state.preferences||{};state.preferences.themeCursors=state.preferences.themeCursors||{space:'galaxy',bloom:'petal'};
    state.preferences.themeCursors[theme]=style;
    if((document.body.dataset.skin==='space'?'space':'bloom')===theme)applyCursorStyle(style);
    document.querySelectorAll(`[data-theme-cursor="${theme}"]`).forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));
    if(toggle && (document.body.dataset.skin==='space'?'space':'bloom')===theme)toggle.checked=style!=='default';
    await saveState();toast(`${btn.querySelector('span:last-child')?.textContent||'Cursor'} saved for ${theme==='space'?'Space':'Bloom'}.`);
  }));
  if(toggle)toggle.addEventListener('change',async()=>{
    const theme=document.body.dataset.skin==='space'?'space':'bloom';
    state.preferences=state.preferences||{};state.preferences.themeCursors=state.preferences.themeCursors||{space:'galaxy',bloom:'petal'};
    if(!toggle.checked)state.preferences.themeCursors[theme]='default';
    else if(state.preferences.themeCursors[theme]==='default')state.preferences.themeCursors[theme]=theme==='space'?'galaxy':'petal';
    window.applyThemeCursor?.();await saveState();
  });
  window.applyThemeCursor?.();
})();
