import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function MeetingLogger() {

  const [channelPartners, setChannelPartners] = useState([]);
  const [selectedCP, setSelectedCP] = useState("");

  const [meetingMode, setMeetingMode] = useState("Physical");
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState("");
  const [selfie, setSelfie] = useState(null);

  const [followDate, setFollowDate] = useState("");
  const [followTime, setFollowTime] = useState("");
  const [followPlace, setFollowPlace] = useState("");
  const [followRemarks, setFollowRemarks] = useState("");

  useEffect(() => {
    fetchChannelPartners();
  }, []);

  async function fetchChannelPartners() {

    const { data, error } = await supabase
      .from("channel_partners")
      .select("id,name");

    if (error) {
      console.error("Error loading CPs:", error);
    } else {
      setChannelPartners(data);
    }

  }

  async function saveMeeting() {

    if (!selectedCP) {
      alert("Please select Channel Partner");
      return;
    }

    let selfieUrl = null;

    if (selfie) {

      const fileName = Date.now() + "_" + selfie.name;

      const { error: uploadError } = await supabase
        .storage
        .from("meeting-selfies")
        .upload(fileName, selfie);

      if (uploadError) {
        alert("Selfie upload failed");
        console.error(uploadError);
        return;
      }

      const { data } = supabase
        .storage
        .from("meeting-selfies")
        .getPublicUrl(fileName);

      selfieUrl = data.publicUrl;
    }

    const { error } = await supabase
      .from("meetings")
      .insert([
        {
          cp_id: selectedCP,
          meeting_mode: meetingMode,
          notes: notes,
          meeting_outcome: outcome,
          selfie_url: selfieUrl,
          followup_date: followDate,
          followup_time: followTime,
          followup_place: followPlace,
          followup_remarks: followRemarks
        }
      ]);

    if (error) {
      alert("Error saving meeting");
      console.error(error);
    } else {
      alert("Meeting saved successfully");

      setSelectedCP("");
      setNotes("");
      setOutcome("");
      setSelfie(null);
      setFollowDate("");
      setFollowTime("");
      setFollowPlace("");
      setFollowRemarks("");
    }

  }

  return (

    <div style={container}>

      <h1>Log Meeting</h1>

      {/* Channel Partner */}

      <label>Select Channel Partner</label>

      <select
        value={selectedCP}
        onChange={(e) => setSelectedCP(e.target.value)}
        style={input}
      >

        <option value="">Select CP</option>

        {channelPartners.map((cp) => (
          <option key={cp.id} value={cp.id}>
            {cp.name}
          </option>
        ))}

      </select>

      {/* Meeting Mode */}

      <label>Meeting Mode</label>

      <select
        value={meetingMode}
        onChange={(e) => setMeetingMode(e.target.value)}
        style={input}
      >

        <option value="Physical">Physical</option>
        <option value="Online">Online</option>

      </select>

      {/* Notes */}

      <label>Meeting Notes</label>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        style={textarea}
      />

      {/* Outcome */}

      <label>Meeting Outcome</label>

      <select
        value={outcome}
        onChange={(e) => setOutcome(e.target.value)}
        style={input}
      >

        <option value="">Select Outcome</option>
        <option value="Interested">Interested</option>
        <option value="Not Interested">Not Interested</option>
        <option value="Deal Won">Deal Won</option>
        <option value="CP Onboarded">CP Onboarded</option>

      </select>

      {/* Selfie */}

      <label>Upload Selfie</label>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setSelfie(e.target.files[0])}
      />

      {/* Follow-up */}

      <h3>Follow Up</h3>

      <label>Date</label>

      <input
        type="date"
        value={followDate}
        onChange={(e) => setFollowDate(e.target.value)}
        style={input}
      />

      <label>Time</label>

      <input
        type="time"
        value={followTime}
        onChange={(e) => setFollowTime(e.target.value)}
        style={input}
      />

      <label>Place</label>

      <input
        type="text"
        value={followPlace}
        onChange={(e) => setFollowPlace(e.target.value)}
        style={input}
      />

      <label>Remarks</label>

      <textarea
        value={followRemarks}
        onChange={(e) => setFollowRemarks(e.target.value)}
        style={textarea}
      />

      <button onClick={saveMeeting} style={button}>
        Save Meeting
      </button>

    </div>

  );

}

const container = {
  maxWidth: 600,
  margin: "auto",
  padding: 40,
  fontFamily: "Arial"
};

const input = {
  width: "100%",
  padding: 10,
  marginBottom: 20
};

const textarea = {
  width: "100%",
  padding: 10,
  marginBottom: 20,
  height: 80
};

const button = {
  padding: "12px 20px",
  background: "#5c6bc0",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer"
};
