const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function notification(record) {
  const rows = [['Name',record.name],['Email',record.email],['Phone',record.phone || 'Not supplied'],['Request',record.kind],['Preferred visit date',record.date || 'Not supplied'],['Reference',record.id]];
  return {
    subject: `Guru website — ${record.kind}`,
    text: `${rows.map(([label,value]) => `${label}: ${value}`).join('\n')}\n\n${record.message}\n\nReply to this email to contact the visitor. Visit requests require confirmation by the school.`,
    html: `<div style="background:#f2f5fa;padding:24px;font-family:Arial,sans-serif;color:#202d48"><div style="max-width:600px;margin:auto;background:#fff;border:1px solid #d8dfeb"><div style="background:#202d48;color:#fff;padding:24px"><p style="font-size:12px;letter-spacing:2px">GURU INTERNATIONAL SCHOOL</p><h1 style="font-size:24px;margin-bottom:0">New ${escape(record.kind.toLowerCase())}</h1></div><div style="padding:24px"><table style="width:100%;border-collapse:collapse">${rows.map(([label,value]) => `<tr><th style="text-align:left;vertical-align:top;padding:10px 12px 10px 0;border-bottom:1px solid #e3e8f0">${label}</th><td style="padding:10px 0;border-bottom:1px solid #e3e8f0;overflow-wrap:anywhere">${escape(value)}</td></tr>`).join('')}</table><h2 style="font-size:18px">Visitor’s message</h2><p style="line-height:1.6;overflow-wrap:anywhere">${escape(record.message).replace(/\r?\n/g,'<br>')}</p><p style="background:#fff2ad;padding:16px;line-height:1.5">Use Reply to contact the visitor at ${escape(record.email)}. School visits require your confirmation.</p></div></div></div>`
  };
}
module.exports = {notification};
