import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Bar, Doughnut } from "react-chartjs-2";
import {
Chart as ChartJS,
CategoryScale,
LinearScale,
BarElement,
ArcElement,
Tooltip,
Legend
} from "chart.js";

ChartJS.register(
CategoryScale,
LinearScale,
BarElement,
ArcElement,
Tooltip,
Legend
);

export default function AdminDashboard() {

const [kpis,setKpis] = useState({
totalCP:0,
activeCP:0,
limboCP:0,
meetings:0,
sales:0,
revenue:0
});

const [pipeline,setPipeline] = useState({});
const [rmPerformance,setRmPerformance] = useState([]);
const [focusAlerts,setFocusAlerts] = useState([]);

useEffect(()=>{
loadData();
},[]);

async function loadData(){

const {data:cps} = await supabase
.from("channel_partners")
.select("*");

const {data:meetings} = await supabase
.from("meetings")
.select("*");

const {data:sales} = await supabase
.from("sales")
.select("*");

const {data:rms} = await supabase
.from("rms")
.select("*");

const revenue = sales?.reduce((sum,s)=>sum+(s.sale_value||0),0) || 0;

const activeCP = new Set(
sales?.map(s=>s.cp_id)
);

const limbo = cps?.filter(cp=>{
const lastSale = sales
?.filter(s=>s.cp_id===cp.id)
.sort((a,b)=>new Date(b.sale_date)-new Date(a.sale_date))[0];

if(!lastSale) return false;

const days =
(new Date()-new Date(lastSale.sale_date))/(1000*60*60*24);

return days>30;

});

setKpis({
totalCP:cps?.length||0,
activeCP:activeCP.size||0,
limboCP:limbo?.length||0,
meetings:meetings?.length||0,
sales:sales?.length||0,
revenue
});

calculatePipeline(meetings,sales);
calculateRMPerformance(rms,meetings,sales);
generateFocusAlerts(meetings,sales,cps);

}

function calculatePipeline(meetings,sales){

const pipeline = {
leads:20,
meetings:meetings?.length||0,
followups:meetings?.filter(m=>m.followup_date).length||0,
negotiation:meetings?.filter(m=>m.meeting_outcome==="negotiation").length||0,
closed:sales?.length||0
};

setPipeline(pipeline);

}

function calculateRMPerformance(rms,meetings,sales){

const performance = rms?.map(rm=>{

const rmMeetings =
meetings?.filter(m=>m.rm_id===rm.id).length||0;

const rmSales =
sales?.filter(s=>s.rm_id===rm.id).length||0;

const rmRevenue =
sales
?.filter(s=>s.rm_id===rm.id)
.reduce((sum,s)=>sum+(s.sale_value||0),0)||0;

const conversion =
rmMeetings>0?((rmSales/rmMeetings)*100).toFixed(1):0;

return{
name:rm.name,
meetings:rmMeetings,
sales:rmSales,
revenue:rmRevenue,
conversion
};

});

setRmPerformance(performance||[]);

}

function generateFocusAlerts(meetings,sales,cps){

const alerts = [];

if(meetings?.length<20)
alerts.push("⚠ Meeting activity is low");

if(sales?.length<5)
alerts.push("⚠ Sales conversion dropping");

const inactiveCP =
cps?.filter(cp=>!meetings?.find(m=>m.cp_id===cp.id));

if(inactiveCP?.length>10)
alerts.push("⚠ Many CPs inactive");

setFocusAlerts(alerts);

}

const pipelineChart = {
labels:[
"Leads",
"Meetings",
"Followups",
"Negotiation",
"Closed"
],
datasets:[{
label:"Pipeline",
data:[
pipeline.leads||0,
pipeline.meetings||0,
pipeline.followups||0,
pipeline.negotiation||0,
pipeline.closed||0
],
backgroundColor:[
"#6C63FF",
"#00BFA6",
"#FFB300",
"#FF7043",
"#43A047"
]
}]
};

const revenueForecast =
(pipeline.negotiation*0.7 +
pipeline.followups*0.4 +
pipeline.meetings*0.2)*100000;

return(

<div style={container}>

<h1>RevenuePilot Admin Command Center</h1>

{/* KPI Radar */}

<div style={kpiGrid}>

<KPI title="Total CPs" value={kpis.totalCP}/>
<KPI title="Active CPs" value={kpis.activeCP}/>
<KPI title="Limbo CPs" value={kpis.limboCP}/>
<KPI title="Meetings" value={kpis.meetings}/>
<KPI title="Sales" value={kpis.sales}/>
<KPI title="Revenue" value={"₹"+kpis.revenue.toLocaleString()}/>

</div>

{/* Pipeline */}

<div style={panel}>

<h2>Revenue Pipeline</h2>

<Bar data={pipelineChart}/>

</div>

{/* Forecast */}

<div style={panel}>

<h2>Revenue Forecast</h2>

<h3>Expected Revenue</h3>

<p style={{fontSize:28}}>
₹{revenueForecast.toLocaleString()}
</p>

</div>

{/* RM Performance */}

<div style={panel}>

<h2>RM Performance</h2>

<table style={table}>

<thead>
<tr>
<th>RM</th>
<th>Meetings</th>
<th>Sales</th>
<th>Revenue</th>
<th>Conversion</th>
</tr>
</thead>

<tbody>

{rmPerformance.map((rm,i)=>(
<tr key={i}>
<td>{rm.name}</td>
<td>{rm.meetings}</td>
<td>{rm.sales}</td>
<td>₹{rm.revenue.toLocaleString()}</td>
<td>{rm.conversion}%</td>
</tr>
))}

</tbody>

</table>

</div>

{/* Focus Alerts */}

<div style={panel}>

<h2>Focus Alerts</h2>

{focusAlerts.length===0 && <p>No alerts</p>}

{focusAlerts.map((a,i)=>(
<p key={i}>{a}</p>
))}

</div>

{/* Admin Controls */}

<div style={panel}>

<h2>Management Controls</h2>

<div style={btnGrid}>

<button>Manage RMs</button>
<button>Manage CPs</button>
<button>Manage Sales</button>
<button>Targets</button>
<button>Upload Leads</button>
<button>Download Reports</button>

</div>

</div>

</div>

);

}

function KPI({title,value}){

return(

<div style={kpiCard}>
<h3>{title}</h3>
<p style={{fontSize:28}}>{value}</p>
</div>

);

}

const container={
padding:40,
fontFamily:"Arial"
};

const kpiGrid={
display:"grid",
gridTemplateColumns:"repeat(6,1fr)",
gap:20,
marginBottom:30
};

const kpiCard={
padding:20,
background:"#f4f6fb",
borderRadius:10,
textAlign:"center"
};

const panel={
background:"#ffffff",
padding:30,
marginBottom:30,
borderRadius:10,
boxShadow:"0 3px 10px rgba(0,0,0,0.1)"
};

const table={
width:"100%",
borderCollapse:"collapse"
};

const btnGrid={
display:"grid",
gridTemplateColumns:"repeat(3,1fr)",
gap:15
};
