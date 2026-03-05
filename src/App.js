import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function App() {

  const [name,setName] = useState("");
  const [phone,setPhone] = useState("");
  const [company,setCompany] = useState("");
  const [city,setCity] = useState("");
  const [message,setMessage] = useState("");

  async function addCP(){

    const {error} = await supabase
      .from("channel_partners")
      .insert([
        {name, phone, company, city}
      ]);

    if(error){
      console.log(error);
      setMessage("❌ Error saving CP");
    } else{
      setMessage("✅ Channel Partner added");
      setName("");
      setPhone("");
      setCompany("");
      setCity("");
    }
  }

  return(
    <div style={{padding:40}}>

      <h1>Deep Buildwell RM Dashboard</h1>

      <h2>Add Channel Partner</h2>

      <input
        placeholder="Name"
        value={name}
        onChange={(e)=>setName(e.target.value)}
      /><br/><br/>

      <input
        placeholder="Phone"
        value={phone}
        onChange={(e)=>setPhone(e.target.value)}
      /><br/><br/>

      <input
        placeholder="Company"
        value={company}
        onChange={(e)=>setCompany(e.target.value)}
      /><br/><br/>

      <input
        placeholder="City"
        value={city}
        onChange={(e)=>setCity(e.target.value)}
      /><br/><br/>

      <button onClick={addCP}>
        Save Channel Partner
      </button>

      <p>{message}</p>

    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  const [status, setStatus] = useState("Testing Supabase connection...");

  useEffect(() => {
    testConnection();
  }, []);

  async function testConnection() {
    try {
      const { data, error } = await supabase.from("rms").select("*").limit(1);

      if (error) throw error;

      setStatus("✅ Supabase connected successfully");
      console.log(data);
    } catch (err) {
      console.error(err);
      setStatus("❌ Supabase connection failed");
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Deep Buildwell RM Dashboard</h1>
      <h2>{status}</h2>
    </div>
  );
}
