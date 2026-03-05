import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  const [status, setStatus] = useState("Testing...");

  useEffect(() => {
    testConnection();
  }, []);

  async function testConnection() {
    try {
      const { data, error } = await supabase.from("rms").select("*").limit(1);

      if (error) throw error;

      setStatus("✅ Supabase connected");
      console.log(data);
    } catch (err) {
      console.error(err);
      setStatus("❌ Connection failed");
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>RM Dashboard Test</h1>
      <h2>{status}</h2>
    </div>
  );
}
