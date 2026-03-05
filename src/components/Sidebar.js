import { Link } from "react-router-dom";

export default function Sidebar(){

return(

<div style={{
width:200,
height:"100vh",
background:"#1f2937",
color:"white",
padding:20,
position:"fixed"
}}>

<h2>Sales CRM</h2>

<div style={{marginTop:30}}>

<p><Link to="/" style={{color:"white"}}>Dashboard</Link></p>

<p><Link to="/partners" style={{color:"white"}}>Channel Partners</Link></p>

<p><Link to="/meetings" style={{color:"white"}}>Meetings</Link></p>

<p><Link to="/sales" style={{color:"white"}}>Sales</Link></p>

</div>

</div>

)

}
