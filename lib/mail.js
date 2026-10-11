const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
function notification(record) {
  const rows = [
    ["Name", record.name],
    ["Email", record.email],
    ["Phone", record.phone || "Not supplied"],
    ["Request", record.kind],
    ["Programme", record.programme || "Not supplied"],
    [
      "Preferred visit date",
      record.date
        ? `${record.date}${record.time ? " at " + record.time + " (Myanmar time)" : ""}`
        : "Not supplied",
    ],
    ["Reference", record.id],
  ];
  return {
    subject: `Guru website — ${record.kind}`,
    text: `${rows.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\n${record.message}\n\nReply to this email to contact the visitor. Visit requests require confirmation by the school.`,
    html: `<div style="background:#f2f5fa;padding:24px;font-family:Arial,sans-serif;color:#202d48"><div style="max-width:600px;margin:auto;background:#fff;border:1px solid #d8dfeb"><div style="background:#202d48;color:#fff;padding:24px"><p style="font-size:12px;letter-spacing:2px">GURU INTERNATIONAL SCHOOL</p><h1 style="font-size:24px;margin-bottom:0">New ${escape(record.kind.toLowerCase())}</h1></div><div style="padding:24px"><table style="width:100%;border-collapse:collapse">${rows.map(([label, value]) => `<tr><th style="text-align:left;vertical-align:top;padding:10px 12px 10px 0;border-bottom:1px solid #e3e8f0">${label}</th><td style="padding:10px 0;border-bottom:1px solid #e3e8f0;overflow-wrap:anywhere">${escape(value)}</td></tr>`).join("")}</table><h2 style="font-size:18px">Visitor’s message</h2><p style="line-height:1.6;overflow-wrap:anywhere">${escape(record.message).replace(/\r?\n/g, "<br>")}</p><p style="background:#fff2ad;padding:16px;line-height:1.5">Use Reply to contact the visitor at ${escape(record.email)}. School visits require your confirmation.</p></div></div></div>`,
  };
}
function acknowledgement(record) {
  return {
    subject: "Guru International School — we received your enquiry",
    text: `Dear ${record.name},\n\nThank you for contacting Guru International School. Your enquiry has been saved for our admissions team.\nReference: ${record.id}\n${record.date ? `Requested visit: ${record.date}${record.time ? " at " + record.time + " (Myanmar time)" : ""}\nVisits require a separate confirmation from the school.\n` : ""}\nOur team will contact you using the details you supplied. For further questions, reply to this email or call 09 40 44 66 882.\n\nGuru International School`,
  };
}
function visitUpdate(record) {
  return {
    subject: "Guru International School — visit update",
    text: `Dear ${record.name},\n\nYour school visit is ${record.status === "confirmed" ? "confirmed" : "updated"} for ${record.date} at ${record.time} (Myanmar time).\nAddress: No. (2), Myay Ni Street, Mote Lote Saung (South) Quarter, San Chaung Township, Yangon.\nReference: ${record.id}\n\nPlease reply if you need to change your visit, or call 09 40 44 66 882.\n\nGuru International School`,
  };
}
module.exports = { notification, acknowledgement, visitUpdate };
