import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import supabase from "../supabaseClient";

function Dashboard() {

const [rm,setRm] = useState(null);
const [timeRange,setTimeRange] = useState("month");
const [targets,setTargets] = useState(null);
const [predictions,setPredictions] = useState({});
const [backlog,setBacklog] = useState({});
const [loading,setLoading] = useState(true);

const [stats,setStats] = useState({
 totalCPs:0,
 activeCPs:0,
 totalMeetings:0,
 totalSales:0,
 totalSalesValue:0,
 totalCommission:0,
 pendingFollowUps:0,
 recentMeetings:[],
 recentSales:[]
});

const navigate = useNavigate();
const subscriptionsRef = useRef([]);
const dataLoadedRef = useRef(false);



/* ---------------- AUTH CHECK ---------------- */

useEffect(()=>{

const userData = sessionStorage.getItem("user");

if(!userData){
 navigate("/");
 return;
}

const user = JSON.parse(userData);
setRm(user);

},[navigate]);



/* ---------------- INITIAL DATA LOAD ---------------- */

useEffect(()=>{

if(rm && !dataLoadedRef.current){

loadDashboardData(rm.id,timeRange);
loadTargets(rm.id);

dataLoadedRef.current = true;

}

},[rm]);



/* ---------------- TIME RANGE CHANGE ---------------- */

useEffect(()=>{

if(rm){
 loadDashboardData(rm.id,timeRange);
}

},[timeRange]);



/* ---------------- REALTIME SUBSCRIPTIONS ---------------- */

useEffect(()=>{

if(!rm) return;

if(subscriptionsRef.current.length>0){

subscriptionsRef.current.forEach(sub=>{
 if(sub) supabase.removeChannel(sub)
});

subscriptionsRef.current=[];

}

const cpSub = supabase
.channel(`cp-${rm.id}`)
.on("postgres_changes",
{
 event:"*",
 schema:"public",
 table:"channel_partners",
 filter:`rm_id=eq.${rm.id}`
},
()=> loadDashboardData(rm.id,timeRange))
.subscribe();



const meetingSub = supabase
.channel(`meeting-${rm.id}`)
.on("postgres_changes",
{
 event:"*",
 schema:"public",
 table:"meetings",
 filter:`rm_id=eq.${rm.id}`
},
()=> loadDashboardData(rm.id,timeRange))
.subscribe();



const salesSub = supabase
.channel(`sales-${rm.id}`)
.on("postgres_changes",
{
 event:"*",
 schema:"public",
 table:"sales",
 filter:`rm_id=eq.${rm.id}`
},
()=> loadDashboardData(rm.id,timeRange))
.subscribe();


subscriptionsRef.current=[cpSub,meetingSub,salesSub];


return ()=>{

subscriptionsRef.current.forEach(sub=>{
 if(sub) supabase.removeChannel(sub)
});

subscriptionsRef.current=[];

};

},[rm?.id]);



/* ---------------- DATE RANGE ---------------- */

const getDateRange = (range)=>{

const today = new Date();
let startDate = new Date();

switch(range){

case "day":
startDate.setHours(0,0,0,0);
break;

case "week":

const day = today.getDay();
const diff = today.getDate() - day + (day===0 ? -6 : 1);
startDate = new Date(today.setDate(diff));
startDate.setHours(0,0,0,0);

break;

case "month":
startDate = new Date(today.getFullYear(),today.getMonth(),1);
break;

case "all":
startDate = new Date(2000,0,1);
break;

default:
startDate = new Date(today.getFullYear(),today.getMonth(),1);

}

return startDate;

};



/* ---------------- LOAD DASHBOARD DATA ---------------- */

const loadDashboardData = async (rmId,range)=>{

if(!rmId) return;

setLoading(true);

try{

const startDate = getDateRange(range);


const [cpRes,meetingRes,salesRes] = await Promise.all([

supabase
.from("channel_partners")
.select("*")
.eq("rm_id",rmId),

supabase
.from("meetings")
.select("*")
.eq("rm_id",rmId)
.gte("meeting_date",startDate),

supabase
.from("sales")
.select("*")
.eq("rm_id",rmId)
.gte("booking_date",startDate)

]);


const rmCPs = cpRes.data || [];
const rmMeetings = meetingRes.data || [];
const rmSales = salesRes.data || [];


/* Active CP calculation */

const cpWithSales = new Set(
rmSales.map(s=>String(s.cp_id))
);

const activeCPs = rmCPs.filter(cp=>
cpWithSales.has(String(cp.id))
);


/* Revenue */

const totalSalesValue = rmSales.reduce(
(sum,s)=> sum + (s.sale_value || s.amount || 0),
0
);


/* Recent Activity */

const recentMeetings = [...rmMeetings]
.sort((a,b)=> new Date(b.meeting_date)-new Date(a.meeting_date))
.slice(0,5);

const recentSales = [...rmSales]
.sort((a,b)=> new Date(b.booking_date)-new Date(a.booking_date))
.slice(0,5);


setStats({

totalCPs:rmCPs.length,
activeCPs:activeCPs.length,
totalMeetings:rmMeetings.length,
totalSales:rmSales.length,
totalSalesValue,
totalCommission:0,
pendingFollowUps:0,
recentMeetings,
recentSales

});

}
catch(err){

console.error("Dashboard Load Error",err);

}
finally{

setLoading(false);

}

};



/* ---------------- LOAD TARGETS ---------------- */

const loadTargets = async (rmId)=>{

const {data} = await supabase
.from("targets")
.select("*")
.eq("rm_id",rmId);

setTargets(data?.[0] || null);

};



/* ---------------- UTILITIES ---------------- */

const formatCurrency = amount =>

new Intl.NumberFormat("en-IN",{
 style:"currency",
 currency:"INR",
 maximumFractionDigits:0
}).format(amount || 0);


const formatDate = date =>

new Date(date).toLocaleDateString("en-IN",{
 day:"numeric",
 month:"short",
 year:"numeric"
});



/* ---------------- UI ---------------- */

if(!rm) return null;


return(

<div style={{padding:20,maxWidth:1200,margin:"auto"}}>


<h1>Sales Command Center</h1>


{loading ? (

<div>Loading dashboard...</div>

):(


<>

{/* KPI CARDS */}

<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:15}}>

<KPICard icon="👥" label="Total CP" value={stats.totalCPs}/>
<KPICard icon="✅" label="Active CP" value={stats.activeCPs}/>
<KPICard icon="📅" label="Meetings" value={stats.totalMeetings}/>
<KPICard icon="💰" label="Sales" value={stats.totalSales}/>
<KPICard icon="💵" label="Revenue" value={formatCurrency(stats.totalSalesValue)}/>

</div>


{/* QUICK ACTIONS */}

<h2 style={{marginTop:30}}>Quick Actions</h2>

<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10}}>

<ActionLink to="/onboard-cp" label="Onboard CP" icon="➕"/>
<ActionLink to="/my-cps" label="My CPs" icon="👥"/>
<ActionLink to="/log-meeting" label="Log Meeting" icon="📝"/>
<ActionLink to="/record-sale" label="Record Sale" icon="💰"/>

</div>


{/* RECENT ACTIVITY */}

<h2 style={{marginTop:30}}>Recent Activity</h2>

<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>

<ActivityList
title="Recent Meetings"
items={stats.recentMeetings}
dateKey="meeting_date"
formatDate={formatDate}
/>

<ActivityList
title="Recent Sales"
items={stats.recentSales}
dateKey="booking_date"
formatDate={formatDate}
/>

</div>

</>

)}

</div>

);

}



/* ---------------- SMALL COMPONENTS ---------------- */

const KPICard = ({icon,label,value})=>(
<div style={{background:"white",padding:15,borderRadius:8,boxShadow:"0 2px 5px rgba(0,0,0,0.1)",display:"flex",gap:10}}>
<div style={{fontSize:30}}>{icon}</div>
<div>
<div style={{fontSize:20,fontWeight:"bold"}}>{value}</div>
<div style={{fontSize:12,color:"#666"}}>{label}</div>
</div>
</div>
);


const ActionLink = ({to,label,icon})=>(
<Link to={to} style={{textDecoration:"none"}}>
<div style={{padding:15,border:"2px solid #eee",borderRadius:8,textAlign:"center",fontWeight:"bold"}}>
{icon} {label}
</div>
</Link>
);


const ActivityList = ({title,items,dateKey,formatDate})=>(
<div style={{background:"#f8f9fa",padding:15,borderRadius:8}}>
<h3>{title}</h3>
{items.length===0 ? (
<p>No activity</p>
):(
items.map(i=>(
<div key={i.id} style={{padding:8,background:"white",marginBottom:5,borderRadius:4}}>
{formatDate(i[dateKey])}
</div>
))
)}
</div>
);


export default Dashboard;
