import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function MeetingLogger() {

  const [meetingWith, setMeetingWith] = useState("Channel Partner");
  const [name, setName] = useState("");
  const [meetingMode, setMeetingMode] = useState("Physical");
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState("");
  const [selfie, setSelfie] = useState(null);

  const [followDate, setFollowDate] = useState("");
  const [followTime, setFollowTime] = useState("");
  const [followPlace, setFollowPlace] = useState("");
  const [followRemarks, setFollowRemarks] = useState("");

  async function saveMeeting() {

    let selfieUrl = null;

    try {

      // Upload selfie ONLY if selected
      if (selfie) {

        const fileName = `selfie-${Date.now()}`;

        const { data, error } = await supabase.storage
          .from("meeting-selfies")
          .upload(fileName, selfie);

        if (error) {
          console.error(error);
        } else {
          selfieUrl = data.path;
        }
      }

      const { error } = await supabase
        .from("meetings")
        .insert([
          {
            meeting_with: meetingWith,
            name: name,
            meeting_mode: meetingMode,
            notes: notes,
            meeting_outcome: outcome,
            selfie_url: selfieUrl,
            followup_date: followDate,
            followup_time: followTime,
            followup_place: followPlace,
            followup_remarks: followRemarks,
          },
        ]);

      if (error) {
        alert("Error saving meeting");
        console.error(error);
      } else {
        alert("Meeting saved successfully");

        // Clear form
        setName("");
        setNotes("");
        setOutcome("");
        setSelfie(null);
        setFollowDate("");
        setFollowTime("");
        setFollowPlace("");
        setFollowRemarks("");
      }

    } catch (err) {
      console.error(err);
    }
  }

  return (

    <div style={{ padding: 40 }}>

      <h1>Log Meeting</h1>

      <div style={form}>

        <label>Meeting With</label>
        <select value={meetingWith} onChange={(e)=>setMeetingWith(e.target.value)}>
          <option>Channel Partner</option>
          <option>Client</option>
          <option>Prospect</option>
        </select>

        <label>Name</label>
        <input
          value={name}
          onChange={(e)=>setName(e.target.value)}
        />

        <label>Meeting Mode</label>
        <select value={meetingMode} onChange={(e)=>setMeetingMode(e.target.value)}>
          <option>Physical</option>
          <option>Online</option>
        </select>

        <label>Upload Selfie (optional)</label>
        <input
          type="file"
          onChange={(e)=>setSelfie(e.target.files[0])}
        />

        <label>Meeting Notes</label>
        <textarea
          value={notes}
          onChange={(e)=>setNotes(e.target.value)}
        />

        <label>Meeting Outcome</label>
        <select value={outcome} onChange={(e)=>setOutcome(e.target.value)}>
          <option value="">Select Outcome</option>
          <option>Interested</option>
          <option>Not Interested</option>
          <option>Deal Won</option>
          <option>CP Onboarded</option>
        </select>

      </div>

      {/* FOLLOW UP */}

      {outcome !== "Not Interested" && outcome !== "" && (

        <div style={followBox}>

          <h3>Follow-up Details</h3>

          <label>Date</label>
          <input
            type="date"
            value={followDate}
            onChange={(e)=>setFollowDate(e.target.value)}
          />

          <label>Time</label>
          <input
            type="time"
            value={followTime}
            onChange={(e)=>setFollowTime(e.target.value)}
          />

          <label>Place</label>
          <input
            value={followPlace}
            onChange={(e)=>setFollowPlace(e.target.value)}
          />

          <label>Remarks</label>
          <textarea
            value={followRemarks}
            onChange={(e)=>setFollowRemarks(e.target.value)}
          />

        </div>

      )}

      <button style={btn} onClick={saveMeeting}>
        Save Meeting
      </button>

    </div>
  );
}

const form = {
  display: "grid",
  gap: 10,
  maxWidth: 400
};

const followBox = {
  marginTop: 30,
  padding: 20,
  border: "1px solid #ddd",
  maxWidth: 400
};

const btn = {
  marginTop: 20,
  padding: "10px 20px",
  background: "#5c6bc0",
  color: "#fff",
  border: "none",
  borderRadius: 5
};
