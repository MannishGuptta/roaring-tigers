import { useState } from "react";
import supabase from "../supabaseClient";

export default function Login() {
  const [phone, setPhone] = useState("");

  const handleLogin = async () => {
    const { data, error } = await supabase
      .from("rms")
      .select("*")
      .eq("phone", phone)
      .single();

    if (error || !data) {
      alert("Invalid phone number");
      return;
    }

    localStorage.setItem("rmUser", JSON.stringify(data));
    window.location.href = "/dashboard";
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>RM Login</h2>

      <input
        type="text"
        placeholder="Enter Phone Number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <br /><br />

      <button onClick={handleLogin}>
        Login
      </button>
    </div>
  );
}import supabase from "../supabaseClient";

const handleLogin = async () => {
  const { data, error } = await supabase
    .from('rms')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error || !data) {
    alert("Invalid phone number");
    return;
  }

  // save RM session
  localStorage.setItem("rmUser", JSON.stringify(data));

  // go to dashboard
  window.location.href = "/dashboard";
};
