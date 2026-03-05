import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

export default function App() {

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
const [source,setSource]=useState("")
const [rmName,setRmName]=useState("")
const [remarks,setRemarks]=useState("")

const [partners,setPartners]=useState([])

const [message,setMessage]=useState("")


useEffect(()=>{
loadCPs()
},[])


async function loadCPs(){

const {data,error}=await supabase
.from("channel_partners")
.select("*")
.order("id",{ascending:false})

if(!error){
setPartners(data)
}

}



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
cp_source:source,
rm_name:rmName,
rm_remarks:remarks

}])


if(error){

console.log(error)
setMessage("❌ Error saving Channel Partner")

}

else{

setMessage("✅ Channel Partner Added Successfully")

setName("")
setPhone("")
setEmail("")
setAddress("")
setCategory("")
setCompany("")
setMarkets("")
setIndustry("")
setBusiness("")
setGst("")
setRera("")
setPan("")
setSource("")
setRmName("")
setRemarks("")

loadCPs()

}

}



return(

<div style={{padding:40,fontFamily:"Arial"}}>

<h1>Sales Command Center</h1>

<h2>Add Channel Partner</h2>


<input placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)}/><br/><br/>

<input placeholder="Phone No" value={phone} onChange={(e)=>setPhone(e.target.value)}/><br/><br/>

<input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)}/><br/><br/>

<input placeholder="Address" value={address} onChange={(e)=>setAddress(e.target.value)}/><br/><br/>


<select value={category} onChange={(e)=>setCategory(e.target.value)}>
<option value="">Select CP Category</option>
<option>Individual</option>
<option>Company</option>
</select><br/><br/>


<input placeholder="Company" value={company} onChange={(e)=>setCompany(e.target.value)}/><br/><br/>

<input placeholder="Operating Markets" value={markets} onChange={(e)=>setMarkets(e.target.value)}/><br/><br/>

<input placeholder="Industry" value={industry} onChange={(e)=>setIndustry(e.target.value)}/><br/><br/>

<input placeholder="Expected Business per Month" value={business} onChange={(e)=>setBusiness(e.target.value)}/><br/><br/>

<input placeholder="GST No" value={gst} onChange={(e)=>setGst(e.target.value)}/><br/><br/>

<input placeholder="RERA No" value={rera} onChange={(e)=>setRera(e.target.value)}/><br/><br/>

<input placeholder="PAN No" value={pan} onChange={(e)=>setPan(e.target.value)}/><br/><br/>


<select value={source} onChange={(e)=>setSource(e.target.value)}>
<option value="">Select CP Source</option>
<option>Self Generated</option>
<option>Reference</option>
<option>Marketing Campaign</option>
<option>Walk-in</option>
<option>Cold Calling</option>
</select><br/><br/>


<input placeholder="RM Name" value={rmName} onChange={(e)=>setRmName(e.target.value)}/><br/><br/>


<textarea placeholder="RM Remarks" value={remarks} onChange={(e)=>setRemarks(e.target.value)}></textarea>

<br/><br/>

<button onClick={addCP}>Save Channel Partner</button>

<br/><br/>

<h3>{message}</h3>


<hr style={{margin:"40px 0"}}/>

<h2>Channel Partner List</h2>


<table border="1" cellPadding="10">

<thead>

<tr>

<th>Name</th>
<th>Phone</th>
<th>Company</th>
<th>Category</th>
<th>RM</th>
<th>Source</th>

</tr>

</thead>


<tbody>

{partners.map((cp)=>(
<tr key={cp.id}>

<td>{cp.name}</td>
<td>{cp.phone}</td>
<td>{cp.company}</td>
<td>{cp.cp_category}</td>
<td>{cp.rm_name}</td>
<td>{cp.cp_source}</td>

</tr>

))}

</tbody>

</table>

</div>

)

}
