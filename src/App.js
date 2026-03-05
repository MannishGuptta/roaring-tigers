import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function App(){

const [name,setName]=useState("")
const [phone,setPhone]=useState("")
const [email,setEmail]=useState("")
const [address,setAddress]=useState("")
const [category,setCategory]=useState("")
const [company,setCompany]=useState("")
const [markets,setMarkets]=useState("")
const [industry,setIndustry]=useState("")
const [business,setBusiness]=useState("")
const [gst,setGst]=useState("")
const [rera,setRera]=useState("")
const [pan,setPan]=useState("")
const [rmName,setRmName]=useState("")
const [remarks,setRemarks]=useState("")
const [message,setMessage]=useState("")
const [source,setSource] = useState("")
async function addCP(){

const {error}=await supabase
.from("channel_partners")
.insert([{
name,
phone,
email,
address,
cp_category:category,
company,
operating_markets:markets,
industry,
expected_business_pm:business,
gst_no:gst,
rera_no:rera,
pan_no:pan,
rm_name:rmName,
rm_remarks:remarks
}])

if(error){
console.log(error)
setMessage("❌ Error saving Channel Partner")
}
else{
setMessage("✅ Channel Partner Added")
}

}

return(

<div style={{padding:40}}>

<h1>Deep Buildwell RM Dashboard</h1>

<h2>Add Channel Partner</h2>

<input placeholder="Name" onChange={(e)=>setName(e.target.value)}/><br/><br/>

<input placeholder="Phone" onChange={(e)=>setPhone(e.target.value)}/><br/><br/>

<input placeholder="Email" onChange={(e)=>setEmail(e.target.value)}/><br/><br/>

<input placeholder="Address" onChange={(e)=>setAddress(e.target.value)}/><br/><br/>

<select onChange={(e)=>setCategory(e.target.value)}>
<option>Select CP Category</option>
<option>Individual</option>
<option>Company</option>
</select><br/><br/>

<input placeholder="Company" onChange={(e)=>setCompany(e.target.value)}/><br/><br/>

<input placeholder="Operating Markets" onChange={(e)=>setMarkets(e.target.value)}/><br/><br/>

<input placeholder="Industry" onChange={(e)=>setIndustry(e.target.value)}/><br/><br/>

<input placeholder="Expected Business p.m." onChange={(e)=>setBusiness(e.target.value)}/><br/><br/>

<input placeholder="GST No" onChange={(e)=>setGst(e.target.value)}/><br/><br/>

<input placeholder="RERA No" onChange={(e)=>setRera(e.target.value)}/><br/><br/>

<input placeholder="PAN No" onChange={(e)=>setPan(e.target.value)}/><br/><br/>

<input placeholder="RM Name" onChange={(e)=>setRmName(e.target.value)}/><br/><br/>

<textarea placeholder="RM Remarks" onChange={(e)=>setRemarks(e.target.value)}></textarea><br/><br/>

<button onClick={addCP}>Save Channel Partner</button>

<p>{message}</p>

</div>

)

}
