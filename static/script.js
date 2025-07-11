/* -------------------- AquaCheck – enhanced -------------------- */
document.addEventListener("DOMContentLoaded", () => {
  /**  ---------------- CLOCK ----------------  **/
  const timeText  = document.getElementById("timeText");
  const ampmText  = document.getElementById("ampmText");
  const dateText  = document.getElementById("dateText");

  const getDaySuffix = d =>
    (d>=11 && d<=13) ? "th" :
    (d%10===1?"st":d%10===2?"nd":d%10===3?"rd":"th");

  const updateClock = () =>{
    const n=new Date();
    let h=n.getHours(), m=n.getMinutes(), s=n.getSeconds();
    const ampm = h>=12?"PM":"AM";
    h = h%12 || 12;
    timeText.textContent = `${h}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
    ampmText.textContent = ampm;
    const opts={weekday:"long",month:"long"};
    const day=n.getDate();
    dateText.innerHTML = `${n.toLocaleDateString(undefined,opts)} ${day}<sup>${getDaySuffix(day)}</sup>`;
  };
  updateClock(); setInterval(updateClock,1_000);

  /**  ---------------- GAUGES ----------------  **/
  const setGaugeValue = (val,bgEl,valEl,color)=>{
    valEl.textContent = (+val).toFixed(2);
    const angle = Math.min(Math.max(+val,0),100)/100*360;
    bgEl.style.background = `conic-gradient(${color} 0deg ${angle}deg, transparent ${angle}deg 360deg)`;
  };
  const $ = id=>document.getElementById(id);
  const gaugeElems = {
    temp : {bar:$("temperatureProgressBar"), txt:$("temperatureText"), col:"#FF4E4E"},
    ph   : {bar:$("pHProgressBar"),          txt:$("pHText"),          col:"#2ECC71"},
    turb : {bar:$("turbidityProgressBar"),   txt:$("turbidityText"),   col:"#2F80ED"},
  };

  /**  ---------------- CHARTS ----------------  **/
  const maxPoints = 60;            // keep last 60 readings (~1 min if 1 s updates)

  const makeChart = (canvasId,label,color) =>{
    const ctx=$(canvasId).getContext("2d");
    return new Chart(ctx,{
      type:"line",
      data:{labels:[],datasets:[{
        label, data:[],
        borderColor:color, borderWidth:2, pointRadius:0, tension:.35
      }]},
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{legend:{display:false},tooltip:{backgroundColor:"#333"}},
        scales:{
          x:{display:false},
          y:{display:false}
        }
      }
    });
  };

  const charts = {
    temp : makeChart("temperatureChart","Temp (°C)",gaugeElems.temp.col),
    ph   : makeChart("pHChart","pH",gaugeElems.ph.col),
    turb : makeChart("turbidityChart","NTU",gaugeElems.turb.col)
  };

  const pushPoint = (chart,val)=>{
    const ts = new Date().toLocaleTimeString();
    chart.data.labels.push(ts);
    chart.data.datasets[0].data.push(val);
    if(chart.data.labels.length>maxPoints){
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }
    chart.update("none");
  };

  /**  ---------------- FIREBASE ----------------  **/
  const firebaseConfig = {
    apiKey:"AIzaSyCrdOgZK6K-rLO6HnNA6Vf13WtB56QxetM",
    authDomain:"aquacheck-e93db.firebaseapp.com",
    databaseURL:"https://aquacheck-e93db-default-rtdb.firebaseio.com",
    projectId:"aquacheck-e93db",
    storageBucket:"aquacheck-e93db.appspot.com",
    messagingSenderId:"983787253521",
    appId:"1:983787253521:web:381820c1676aadd54666b0",
    measurementId:"G-1VFBDS6VD5"
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  const deviceId = "D01";
  const userRef  = db.ref(`users/${deviceId}`);

  userRef.on("child_added",snap=>{
    const d = snap.val();  // {phData:.., tempData:.., turbidityData:..}

    // ---- Gauges ----
    setGaugeValue(d.tempData, gaugeElems.temp.bar, gaugeElems.temp.txt, gaugeElems.temp.col);
    setGaugeValue(d.phData,   gaugeElems.ph.bar,   gaugeElems.ph.txt,   gaugeElems.ph.col);
    setGaugeValue(d.turbidityData, gaugeElems.turb.bar, gaugeElems.turb.txt, gaugeElems.turb.col);

    // ---- Charts ----
    pushPoint(charts.temp, d.tempData);
    pushPoint(charts.ph,   d.phData);
    pushPoint(charts.turb, d.turbidityData);
  });

});
