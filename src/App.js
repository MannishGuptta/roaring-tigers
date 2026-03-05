import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  const [status, setStatus] = useState("Testing connection...");

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
      setStatus("❌ Connection failed");
      console.error(err);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Deep Buildwell RM Dashboard</h1>
      <h2>{status}</h2>
    </div>
  );
}
