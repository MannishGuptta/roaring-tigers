import supabase from "../supabaseClient";

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
