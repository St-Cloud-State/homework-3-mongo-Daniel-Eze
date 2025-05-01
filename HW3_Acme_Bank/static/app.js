let currentAppId = "";

// 1. Create application
async function createApplication() {
  const data = {
    name:    document.getElementById("name").value,
    zipcode: document.getElementById("zipcode").value,
    address: document.getElementById("address").value
  };
  const res = await fetch("/api/applications", {
    method:  "POST",
    headers: {"Content-Type":"application/json"},
    body:    JSON.stringify(data)
  });
  const { app_id } = await res.json();
  currentAppId = app_id;
  document.getElementById("appId").innerText     = app_id;
  document.getElementById("checkAppId").value    = app_id;
  document.getElementById("update").style.display= "block";
  await populateSelect();
}

// 2. Load one application
async function loadApplication() {
  const id = document.getElementById("checkAppId").value.trim() || currentAppId;
  const out = document.getElementById("result");
  if (!id) return out.innerText = "Please enter an application ID.";

  const res = await fetch(`/api/applications/${id}`);
  if (res.status === 404) {
    return out.innerHTML = `<p><b>Status:</b> not found</p>`;
  }
  if (!res.ok) {
    return out.innerText = `Error: ${res.statusText}`;
  }
  const doc = await res.json();
  let html = `<p><b>Status:</b> ${doc.status}</p><ul>`;
  doc.notes.forEach(n => {
    html += `<li>[${new Date(n.timestamp).toLocaleString()}]
               <b>${n.phase}</b>: ${n.message}</li>`;
  });
  html += `</ul>`;
  out.innerHTML = html;
}

// Populate “Select Applicant” dropdown
async function populateSelect() {
  const res = await fetch("/api/applications");
  if (!res.ok) return;
  const list = await res.json();
  const sel  = document.getElementById("selectAppId");
  sel.innerHTML = "";
  list.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a.app_id;
    opt.text  = `${a.app_id} – ${a.name}`;
    sel.appendChild(opt);
  });
}

// 3. Update status or add note
async function updateApplication() {
  const phase   = document.getElementById("phase").value;
  const message = document.getElementById("message").value;
  const id      = document.getElementById("selectAppId").value;

  if (!id) return alert("No applicant selected.");

  const body = { phase, message };
  if (phase === "accepted" || phase === "rejected") {
    body.status = phase;
  }

  
  const res = await fetch(`/api/applications/${id}`, {
    method:  "PATCH",
    headers: {"Content-Type":"application/json"},
    body:    JSON.stringify(body)
  });
  if (res.status === 404) {
    return alert("Application not found—cannot update.");
  }
  if (!res.ok) {
    return alert(`Update failed: ${res.statusText}`);
  }
  await loadApplication();
  document.getElementById("message").value = "";
}

// 4. List all applications
async function loadAllApplications() {
  const res = await fetch("/api/applications");
  const container = document.getElementById("allApps");
  if (!res.ok) {
    return container.innerText = "Failed to load applications.";
  }
  const list = await res.json();
  if (list.length === 0) {
    return container.innerText = "No applications found.";
  }
  let html = `<table>
    <thead><tr>
      <th>Application ID</th><th>Name</th><th>Status</th>
    </tr></thead><tbody>`;
  list.forEach(a => {
    html += `<tr>
      <td>${a.app_id}</td>
      <td>${a.name}</td>
      <td>${a.status}</td>
    </tr>`;
  });
  html += `</tbody></table>`;
  container.innerHTML = html;
}

// 5. Clear database
async function clearDatabase() {
  if (!confirm("Are you sure? This will delete ALL data.")) return;
  const res = await fetch("/api/applications", { method: "DELETE" });
  if (!res.ok) return alert("Failed to clear database.");
  alert("All data cleared.");
  document.getElementById("result").innerText    = "";
  document.getElementById("allApps").innerText   = "";
  document.getElementById("appId").innerText     = "";
  document.getElementById("checkAppId").value    = "";
  document.getElementById("message").value       = "";
  document.getElementById("update").style.display= "none";
  await populateSelect();
}
